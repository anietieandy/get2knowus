var express = require('express');
var router = express.Router();

var bigNum = 20000;
//" + Math.floor(Math.random() * bigNum) + "
var sqlQuery = "SELECT author, name, subreddit, body FROM `fh-bigquery.reddit_comments.2015_05` WHERE author != '[deleted]' AND LENGTH(body) < 255 AND LENGTH(body) > 30 AND body LIKE '%";
var sqlQueryClassify = "SELECT author, name, subreddit, body, rand() as rand FROM `fh-bigquery.reddit_comments.2015_05` WHERE author != '[deleted]' AND LENGTH(body) < 255 AND LENGTH(body) > 30 AND body LIKE '%";
var usernameQuery = "SELECT body FROM `fh-bigquery.reddit_comments.2015_05` WHERE LENGTH(body) < 255 AND LENGTH(body) > 30 AND author IN (";

// Imports the Google Cloud client library.
const Storage = require('@google-cloud/storage');
// Imports the Google Cloud client library
const BigQuery = require('@google-cloud/bigquery');
// The project ID to use, e.g. "your-project-id"
const projectId = "green-entity-183800";
//for fs
const fs = require('fs');
// classification db
const classificationDb = require('../db/classification');
//For exec
var exec = require('child_process').exec;

var natural = require('natural'); 
var path = require('path') 

// Used to tag words with their parts of speech
var base_folder = path.join(path.dirname(require.resolve("natural")), "brill_pos_tagger");
var rulesFilename = base_folder + "/data/English/tr_from_posjs.txt";
var lexiconFilename = base_folder + "/data/English/lexicon_from_posjs.json";
var defaultCategory = 'N';
var lexicon = new natural.Lexicon(lexiconFilename, defaultCategory);
var rules = new natural.RuleSet(rulesFilename);
var tagger = new natural.BrillPOSTagger(lexicon, rules);

var credentials = process.env;

if (!process.env.PRODUCTION) {
	credentials = require('../credentials.json');
}

// Instantiates a client
const bigquery = BigQuery({
  projectId: projectId,
  credentials: credentials
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Get2KnowUS',
  						args: {}
  						});
});

router.get('/download', function(req,res) {
	res.sendFile("all_posts.txt", { root: '.' });
});

router.get('/vis', function(req, res, next) {
  res.render('vis', { title: 'Get2KnowUS',
  						words: [{text:"Chair", size: 40}, {text:"Vivian", size: 25}, {text:"Devesh", size: 25}, {text:"Forever", size: 15}, {text:"Friends", size: 10}],
  						err: '' });
});

router.post('/api/add_classification', function(req, res, next) {
	var post_data = {
		query: req.body.query,
		post: req.body.post,
		user: req.body.user,
		valid: req.body.valid
	};
	classificationDb.addClassification(post_data, function(err) {
		if (err) {
			res.status(500).send("Error adding new classification to database.");
		} else {
			res.status(200).send("Successfully added classification to database.");
		}
	});
});

router.post('/submit_query', function(req, res, next) {
	var curr_query = req.body.query_field;
	if (!req.body.hidden) {
		console.log("first callback")
		new_options = getOptions(curr_query, function(new_options) {
			if (new_options.length > 0) {
				res.render('index', { title: 'Get2KnowUS',
									  args: {help: "We found some other queries you may find helpful - check to see if you'd like to add them!",
		  									 other_queries: new_options,
		  									 query_to_enter: curr_query}
		  							});
			}
		});
	} else {
		var all_queries = [curr_query];
		var new_query = curr_query.replace(/'/gi, "\\'");
		var query_to_enter = sqlQuery + new_query + "%'";
		for (query in req.body) {
			if (query != 'hidden' && query != 'query_field') {
				all_queries.push(query);
				query = query.replace(/'/gi, "\\'");
				query_to_enter += " OR body LIKE '%" + query + "%'";
			}
		}
		query_to_enter += " LIMIT 500;";

		var options = {
			query: query_to_enter,
			useLegacySql: false
		};
		console.log("if this prints once, a callback is being called twice!!!!");
		runQuery(options, (rows) => {
			var str = ""
			for (var i = 0; i < rows.length; i++) {
				str += rows[i].body.replace(/(\r\n|\n|\r)/gm,"") + "\n";
			}
			fs.writeFile('query_results.txt', str, function(err) {
				console.log("about to query");
				exec('python2 classifier/sdg1.py query_results.txt ' + new_query, (err, stdout, stderr) => {
					if (err) {
						console.log(err);
						return;
					}
					console.log("Finished classifier")
					var all_results = stdout.split("##########")[1];
					all_results = all_results.replace(/(\r\n|\n|\r)/gm,"");
					all_results = all_results.substring(1,all_results.length);
					all_results = all_results.split(" ");
					var new_username_query = usernameQuery;
					for (var i = 0; i < all_results.length; i++) {
						if (all_results[i] == "1") {
							new_username_query += "'" + rows[i].author + "', ";
						}
					}
					new_username_query = new_username_query.substring(0, new_username_query.length - 2);
					new_username_query += ") AND body != '[deleted]' LIMIT 500;";
					console.log(new_username_query);
					var username_options = {
						query: new_username_query,
						useLegacySql: false
					};
					runQuery(username_options, (rows) => { //FIX THIS
						var new_str = ""
						for (var i = 0; i < rows.length; i++) {
							new_str += rows[i].body.replace(/(\r\n|\n|\r)/gm,"") + "\n";
						}						
						fs.writeFile('all_posts.txt', new_str, function(err) {
							if (err) {
								console.log(err);
								return;
							}
							exec('python2 NLPMaybe/wordCloud.py all_posts.txt', (err, stdout, stderr) => {
								res.render('query_results', { title: 'Get2KnowUS', all_queries: all_queries, results: rows });
							});
						});
					});
				});
			});
		});		
	}
});

router.post('/classify_query', function(req, res, next) {
	var curr_query = req.body.query_field;
	curr_sql_query = curr_query.replace(/'/gi, "\\'");
	var query_to_enter = sqlQueryClassify + curr_sql_query + "%'";
	query_to_enter += " OR body LIKE '%" + curr_sql_query + "%'";
	query_to_enter += " ORDER BY rand LIMIT 100;";
	console.log(query_to_enter);

	var options = {
		query: query_to_enter,
		useLegacySql: false
	};

	runQuery(options, (rows) => {
		res.render('classify_queries', 
				   { title: 'Get2KnowUS',
					 all_queries: [req.body.query_field],
					 query_analyzed: req.body.query_field.replace(/'/gi, ''),
					results: rows
					});		
	});		

});


function runQuery(options, callback) {
	bigquery
	  .query(options)
	  .then((results) => results[0])
	  .then(callback)
	  .catch((err) => {
	    console.error('ERROR:', err);
	  });	
}

function runClassifier() {
	exec('python classifier/nb1.py', (err, stdout, stderr) => {
	  if (err) {
	    return;
	  }
	  console.log(stdout);
	  console.log(stderr);
	});
}

function getNouns(word, i, ar) {
	return (word[1] == "NN")
}

function listCombos(opts, i, tokens) { 
	var combos = []
	var keys = Object.keys(opts); 
	if (i > tokens.length-1) {
		return ""
	} else if (i == tokens.length-1) {
		if (keys.indexOf(i.toString()) != -1) {
			var vals = opts[i]; 
			for (var v in vals) {
				combos.push(vals[v]); 
			}
		} else {
			combos.push(tokens[i]); 
		}
	} else {
		var other_combos = listCombos(opts, i+1, tokens); 
		if (keys.indexOf(i.toString()) != -1) {
			var vals = opts[i]; 
			for (var v in vals) {
				for (var oc in other_combos) {
					var new_q = vals[v] + " " + other_combos[oc]; 
					combos.push(new_q); 
				}
			}
		} else {
			for (var oc in other_combos) {
				var new_q = tokens[i] + " " + other_combos[oc]; 
				combos.push(new_q); 
			}
		}
	}
	return combos; 
}

function getOptions(curr_query, callback) {
	var tokenizer = new natural.WordPunctTokenizer();
	var wordnet = new natural.WordNet(); 

	var tokens = tokenizer.tokenize(curr_query);
	var clean_tokens = []
	for (var t = 0; t < tokens.length; t++) {
		if (tokens[t] == '\'') {
			var new_t = tokens[t-1] + '\'' + tokens[t+1]; 
			t++; 
			clean_tokens[t-1] = new_t;
			clean_tokens.splice(0, t-1); 

		} else {
			clean_tokens.push(tokens[t])
		}
	}

	var tagged_tokens = tagger.tag(clean_tokens)

	var num_nouns = tagged_tokens.filter(getNouns).length

	var options = {};
	var curr_opts = [];
	tagged_tokens.forEach(function(tok, t) {
		if (tok[1] == "NN") {
			wordnet.lookup(tok[0], function(results) {
				results.forEach(function(result) {
					var syns = result.synonyms; 
					var tok_idx = syns.indexOf(tok[0]);
					syns.splice(tok_idx,1)
					curr_opts = syns.slice(); 
				})
				options[t] = curr_opts; 
				if (Object.keys(options).length == num_nouns) {
					combos = listCombos(options, 0, clean_tokens); 
					callback(combos);
				}	
			});
		}
	})
}

function getImportance(text, callback) {
	var TfIdf = natural.TfIdf;
	var tfidf = new TfIdf();
	fs.readFile('corpus.txt', function read(err, data) {
    					if (err) {
        					throw err;
    						}
					    var corpus = data;
					    tfidf.addDocument(corpus);
						tfidf.addDocument(text);
						var terms = tfidf.listTerms(0);
						var output = []
						for (item in terms) {
							output.push({text:item.term, size:item.tfidf})
						}
						callback(output);
						});
	
	// tfidf.listTerms(0).forEach(function(item) {
 //    	console.log(item.term + ': ' + item.tfidf);
	// });
}

module.exports = router;
