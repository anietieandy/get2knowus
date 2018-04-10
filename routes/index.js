var express = require('express');
var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
var router = express.Router();

var natural_language_understanding = new NaturalLanguageUnderstandingV1({
  'username': '7a5ee176-5c44-4860-b347-1e0761c93172',
  'password': 'VMCZS5242eXl',
  'version_date': '2017-02-27'
});
// Used for BlueMix API
var tone_analyzer = new ToneAnalyzerV3({
  username: 'b75c30c3-1875-42ca-8bf2-f1b9c317a0e4',
  password: '2GXhXCY3jq88',
  version_date: '2017-09-21'
});

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
var recent_queries = []; 
var blue = []

if (!process.env.PRODUCTION) {
	credentials = require('../credentials.json');
}

// Instantiates a client
const bigquery = BigQuery({
	projectId: projectId,
	credentials: credentials
});


/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', {
		title: 'Get2KnowUS',
		args: {}
	});
});

router.get('/download', function (req, res) {
	res.download("all_posts.txt", "post_data.txt");
});

router.get('/vis', function (req, res, next) {
	res.render('vis', {
		title: 'Get2KnowUS',
		words: [{ text: "Chair", size: 40 }, { text: "Vivian", size: 25 }, { text: "Devesh", size: 25 }, { text: "Forever", size: 15 }, { text: "Friends", size: 10 }],
		err: ''
	});
});

router.post('/api/add_classification', function (req, res, next) {
	var post_data = {
		query: req.body.query,
		post: req.body.post,
		user: req.body.user,
		valid: req.body.valid
	};
	classificationDb.addClassification(post_data, function (err) {
		if (err) {
			res.status(500).send("Error adding new classification to database.");
		} else {
			res.status(200).send("Successfully added classification to database.");
		}
	});
});

router.post('/submit_cross_group_query', function (req, res, next) {
	var group_one = req.body.query_field1;
	var group_two = req.body.query_field2;
	console.log(group_one);
	console.log(group_two);

	// group one's queries
	var group_one_queries = [group_one.replace(/'/gi, "\\'")]
	var query_one_entered = sqlQuery + group_one_queries[0] + "%'" + " LIMIT 500;";

	// group two's queries
	var group_two_queries = [group_two.replace(/'/gi, "\\'")]
	var query_two_entered = sqlQuery + group_two_queries[0] + "%'" + " LIMIT 500;";

	var options_one = {
		query: query_one_entered,
		useLegacySql: false
	};

	var options_two = {
		query: query_two_entered,
		useLegacySql: false
	};

	runQuery(options_one, (rows_one) => {
		var group_one_text = "";
		for (var i = 0; i < rows_one.length; i++) {
			group_one_text += rows_one[i].body.replace(/(\r\n|\n|\r)/gm, "") + "\n";
		}
		runQuery(options_two, (rows_two) => {
			var group_two_text = "";
			for (var i = 0; i < rows_two.length; i++) {
				group_two_text += rows_two[i].body.replace(/(\r\n|\n|\r)/gm, "") + "\n";
			}
			// tokenize all text
			var group_one_tokens = group_one_text.split(new RegExp('\w+\'*\w*'));
			var group_two_tokens = group_two_text.split(new RegExp('\w+\'*\w*'));	

			// get phrases
			var group_one_phrases = flatten_phrases(group_one_tokens);
			var group_two_phrases = flatten_phrases(group_two_tokens);

			// get results
			var results = log_odds_results(group_one_phrases, group_two_phrases);
			// sort results
			var items = Object.keys(results).map(function(key) {
				return [key, results[key]];
			});

			var tuples = Object.keys(results).map(function(key) {
				return [key, results[key][0]];
			});

			items.sort(function(first, second) {
				return (Math.abs(second[1][0]) - Math.abs(first[1][0]));
			});

			var sorted_tuples = Object.keys(results).map(function(key) {
				return [key, results[key][0], results[key][1]];
			});

			sorted_tuples.sort(function(first, second) {
				return (Math.abs(second[1]) - Math.abs(first[1]));
			});

			sorted_tuples = sorted_tuples.filter(item => isNaN(item[1]) != true);

			var highest_log_scores = items.slice(0, 10);
			var lowest_log_scores = items.slice(-10);
			res.render('cross_group', {
				title: 'Get2KnowUS',
				query_one: req.body.query_field1,
				query_two: req.body.query_field2,
				group_one_rows: rows_one,
				group_two_rows: rows_two,
				highest_scores: highest_log_scores,
				lowest_scores: lowest_log_scores,
				all_data: tuples,
				all_sorted: sorted_tuples
			});
		})
	})


});

router.post('/submit_query', function (req, res, next) {
	var curr_query = req.body.query_field;
	if (!req.body.hidden) {
		new_options = getOptions(curr_query, function (new_options) {
			recent_queries = curr_query; 
			if (new_options.length > 0) {
				res.render('index', {
					title: 'Get2KnowUS',
					args: {
						help: "We found some other queries you may find helpful - check to see if you'd like to add them!",
						other_queries: new_options,
						query_to_enter: curr_query, 
						choice: 1
					}
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
		runQuery(options, (rows) => {
			var str = ""
			for (var i = 0; i < rows.length; i++) {
				str += rows[i].body.replace(/(\r\n|\n|\r)/gm, "") + "\n";
			}
			fs.writeFile('query_results.txt', str, function (err) {
				exec('python2 classifier/sdg1.py query_results.txt ' + new_query, (err, stdout, stderr) => {
					if (err) {
						console.log(err);
						return;
					}
					var all_results = stdout.split("##########")[1];
					all_results = all_results.replace(/(\r\n|\n|\r)/gm, "");
					all_results = all_results.substring(1, all_results.length);
					all_results = all_results.split(" ");
					var new_username_query = usernameQuery;
					for (var i = 0; i < all_results.length; i++) {
						if (all_results[i] == "1") {
							new_username_query += "'" + rows[i].author + "', ";
						}
					}
					new_username_query = new_username_query.substring(0, new_username_query.length - 2);
					new_username_query += ") AND body != '[deleted]' LIMIT 500;";
					var username_options = {
						query: new_username_query,
						useLegacySql: false
					};
					runQuery(username_options, (rows) => { //FIX THIS
						var new_str = ""
						for (var i = 0; i < rows.length; i++) {
							new_str += rows[i].body.replace(/(\r\n|\n|\r)/gm, "") + "\n";
						}
						fs.writeFile('all_posts.txt', new_str, function (err) {
							if (err) {
								console.log(err);
								return;
							}
							recent_queries = all_queries; 
							exec('python2 NLPMaybe/wordCloud.py all_posts.txt', (err, stdout, stderr) => {
								if (err) {
									console.log(err);
								} else {
									exec('python2 NLPMaybe/wordCloud2.py all_posts.txt', (err, stdout, stderr) => {
										if (err) {
											console.log(err); 
										}
											console.log("analyzing tone now...");						
											res.render('query_results', { title: 'Get2KnowUS', all_queries: all_queries, results: rows, bluemix_results: [], bluemix_data: [], bluemix_name: [] });

									}); 
								}
							});
						});
					});
				});
			});
		});
	}
});

router.post('/classify_query', function (req, res, next) {
	var curr_query = req.body.query_field;
	if (!req.body.hidden) {
		var other_queries = getOptions(curr_query, function (new_options) {
			res.render('index', {
				title: 'Get2KnowUs',
				args: {
					help: "We found some other queries you may want to classify - check to see if you'd like to add them!",
					other_queries: new_options,
					query_to_enter: query_to_enter,
					choice: 2
				}
			})
		});
	} else {
		var all_queries = [curr_query];
		curr_sql_query = curr_query.replace(/'/gi, "\\'");
		var query_to_enter = sqlQueryClassify + curr_sql_query + "%'";
		for (query in req.body) {
			if (query != 'hidden' && query != 'query_field') {
				all_queries.push(query);
				query = query.replace(/'/gi, "\\'");
				query_to_enter += " OR body LIKE '%" + query + "%'";
			}
		}
		query_to_enter += " ORDER BY rand LIMIT 100;";

		var options = {
			query: query_to_enter,
			useLegacySql: false
		};

		runQuery(options, (rows) => {
			res.render('classify_queries',
				{
					title: 'Get2KnowUS',
					all_queries: all_queries,
					query_analyzed: req.body.query_field.replace(/'/gi, ''),
					results: rows
				});
		});
	}
});


router.post('/blueMixSingle', function(req, res, next) {
	var query = req.body.query
	analyzeIndiv(query, function(result) {
		res.status(200).send(result);
	});
	console.log("in blue");
	//res.render('query_results', { title: 'Get2KnowUS', all_queries: all_queries, results: rows, bluemix_results: blue });
});

// I'll be a given a list of (%, word type) to print out. 
// Look at how natasha handled sdg and all_posts.txt
router.post('/deep_dive', function(req, res, next) {
	var deep_query = req.body.deep_dive_field; 
	var new_queries = [];
	var all_posts = []; 
	var new_str = "";  
	
	fs.readFile('all_posts.txt', function read(err, data) {
		if(err) {
			throw err; 
		} 
		var file = data.toString(); 
		var split_file = file.split('\n'); 

		for (var i = 0; i < split_file.length; i++){ 
			if(split_file[i].includes(deep_query)){
				new_queries.push(split_file[i]); 
				new_str += (split_file[i]); 
			}
			all_posts.push(split_file[i]); 
		}

		fs.writeFile('NLPMaybe/deep_dive.txt', new_str, function(err){
			if(err) {
				console.log(err);
				return;  
			}
			exec('python2 NLPMaybe/liwcAnal.py deep_dive.txt all_posts.txt', (err, stdout, stderr) => {
				var liwc_all = stdout.split("\n"); 
				var liwc_res = []; 
				var csv_text = "word_classification, regularized_count, absolute_difference\n"; 
				for (var i = 0; i < liwc_all.length; i++) {
					var l = liwc_all[i].split("++");
					var l_obj = {
						key: l[0], 
						ind: l[1],
						all: l[2]
					}
					csv_text += l[0] + "," + l[1] + "," + l[2] + "\n"; 
					liwc_res.push(l_obj); 
				}
				var input = "";
				for (var i = 0; i < new_queries.length; i++) {
					input = input + " " + new_queries[i]
				}

			  	var param = {
				  'tone_input': {'text': "input"},
				  'content_type': 'application/json'
				};
		      	var input_all = "";
		      	for (var i = 0; i < all_posts.length; i++) {
		      		input_all = input_all + " " + all_posts[i]
		      	}
			    fs.writeFile('liwcDownload.csv', csv_text, function(err){
					if(err) {
						console.log(err);
						return;  
					}
				  	tone_analyzer.tone(param, function(error, response) {
				  		if (error)
					      console.log('error:', error);
					    else { 
					  	  var blue_deep = [];
					      for (var i = 0; i < response.document_tone.tones.length; i++) {
					      	blue_deep.push("Tone: " + JSON.stringify(response.document_tone.tones[i].tone_name) + " Score: " + JSON.stringify(response.document_tone.tones[i].score))
					      }
					      var param_all = {
					      	'tone_input': {'text': input_all},
					      	'content_type': 'application/json'
					      };
					      tone_analyzer.tone(param_all, function(error, response) {
					      	if (error)
					      		console.log('error:', error);
						    else { 
						  	  var blue_all = [];
						      for (var i = 0; i < response.document_tone.tones.length; i++) {
						      	blue_all.push("Tone: " + JSON.stringify(response.document_tone.tones[i].tone_name) + " Score: " + JSON.stringify(response.document_tone.tones[i].score))
						      }

								res.render('deep_dive', {
									title: 'Get2KnowUs', 
									all_queries: recent_queries,
									deep_query: deep_query,  
									results: new_queries, 
									bluemix_deep: blue_deep, 
									bluemix_all: blue_all, 
									liwc: liwc_res

								});  
							}
						}); 
					} 
				}); 
			}); 
		});
	}); 
}); 
}); 


router.get('/download_csv', function (req, res) {
	res.download("liwcDownload.csv", "liwc_download.csv");
});

router.get('/show_tone', function (req, res) {
	console.log("hi"); 
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
	});
}

function getNouns(word, i, ar) {
	return (word[1] == "NN")
}

function listCombos(opts, i, tokens) {
	var combos = []
	var keys = Object.keys(opts);
	if (i > tokens.length - 1) {
		return ""
	} else if (i == tokens.length - 1) {
		if (keys.indexOf(i.toString()) != -1) {
			var vals = opts[i];
			for (var v in vals) {
				combos.push(vals[v]);
			}
		} else {
			combos.push(tokens[i]);
		}
	} else {
		var other_combos = listCombos(opts, i + 1, tokens);
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
			var new_t = tokens[t - 1] + '\'' + tokens[t + 1];
			t++;
			clean_tokens[t - 1] = new_t;
			clean_tokens.splice(0, t - 1);

		} else {
			clean_tokens.push(tokens[t])
		}
	}

	var tagged_tokens = tagger.tag(clean_tokens)

	var num_nouns = tagged_tokens.filter(getNouns).length

	var options = {};
	var curr_opts = [];
	tagged_tokens.forEach(function (tok, t) {
		if (tok[1] == "NN") {
			wordnet.lookup(tok[0], function (results) {
				results.forEach(function (result) {
					var syns = result.synonyms;
					var tok_idx = syns.indexOf(tok[0]);
					syns.splice(tok_idx, 1)
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
			output.push({ text: item.term, size: item.tfidf })
		}
		callback(output);
	});
}

/*ANALYZING TEXT USING IBM WATSON*/
// var input1 = 'UPenn is an amazing school. It is the best school ever. Harvard on the other hand is iffy and not that great. Plus, it\'s in Boston which is too cold'
// var input2 = 'Do you ever feel like breaking down? Do you ever feel out of place? Like somehow you just don\'t belong and no one understands you.'

function analyzeText(text) {
  var param = {
    'text': text,
    'features': {
      'entities': {
        'emotion': true,
        'sentiment': true,
        'limit': 2
      },
      'keywords': {
        'emotion': true,
        'sentiment': true,
        //'limit': 5
      }
    }
  }
  natural_language_understanding.analyze(param, function(err, response) {
    if (err)
      console.log('error:', err);
    else
      console.log(JSON.stringify(response.keywords, null, 2));
  });
}
//The score that is returned lies in the range of 0.5 to 1. A score greater than 0.75 indicates a high likelihood that the tone is perceived in the content.
function analyzeTone(text, res, all_queries, rows) {
	var input = "";
	var outputs = [];
	//var mapList = [];
	for (var i = 0; i < text.length; i++) {
		//console.log(text[i].body);
		input = input + " " + text[i].body
	}
	//console.log(mapList)
  var param = {
  'tone_input': {'text': input},
  'content_type': 'application/json'
};
  // tone_analyzer.tone(param, function(error, response) {
  // 	var blue = []; 
  //   if (error)
  //     console.log('error:', error);
  //   else
  // 	  var blue = [];
  // 	  var blueData = [];
  // 	  var blueName = [];
  //     for (var i = 0; i < response.document_tone.tones.length; i++) { 
  //     	var val = parseFloat(JSON.stringify(response.document_tone.tones[i].score));
  //     	if (val < 0.6) { //low
  //     		blue.push("Detected low amounts of " + JSON.stringify(response.document_tone.tones[i].tone_name));
  //     	}
  //     	else if (val < 0.7) { //slight
  //     		blue.push("Detected slight amounts of " + JSON.stringify(response.document_tone.tones[i].tone_name));
  //     	}
  //     	else if (val < 0.8) { //medium
  //     		blue.push("Detected medium amounts of " + JSON.stringify(response.document_tone.tones[i].tone_name));
  //     	}
  //     	else if (val < 0.9) { //moderate
  //     		blue.push("Detected moderate amounts of " + JSON.stringify(response.document_tone.tones[i].tone_name));
  //     	}
  //     	else { //high
  //     		blue.push("Detected high amounts of " + JSON.stringify(response.document_tone.tones[i].tone_name));
  //     	}
  //     	//blue.push("Tone: " + JSON.stringify(response.document_tone.tones[i].tone_name) + " Score: " + JSON.stringify(response.document_tone.tones[i].score))
  //     	//blueData.push([JSON.stringify(response.document_tone.tones[i].tone_name), JSON.stringify(response.document_tone.tones[i].score)])
  //     	blueData.push(JSON.stringify(response.document_tone.tones[i].score))
  //     	blueName.push(response.document_tone.tones[i].tone_name)
  //     }	
  // 	  //var blue = JSON.stringify(response.document_tone.tones[0]);
  // 	  res.render('query_results', { title: 'Get2KnowUS', all_queries: all_queries, results: rows, bluemix_results: blue, bluemix_data: blueData, bluemix_name: blueName });
  //   }
  // );
   res.render('query_results', { title: 'Get2KnowUS', all_queries: all_queries, results: rows, bluemix_results: [], bluemix_data: [], bluemix_name: [] });

}

function analyzeIndiv(text, callback) {
	var param = {
		'tone_input': {'text': text},
		'content_type': 'application/json'
	};
	tone_analyzer.tone(param, function(error, response) {
		var blue = [];
		if (error)
			console.log('error: ', error);
		else {
	      	for (var i = 0; i < response.document_tone.tones.length; i++) {
		      	var val = parseFloat(JSON.stringify(response.document_tone.tones[i].score));
		      	if (val < 0.6) { //low
		      		blue.push("Detected low amounts of " + JSON.stringify(response.document_tone.tones[i].tone_name));
		      	}
		      	else if (val < 0.7) { //slight
		      		blue.push("Detected slight amounts of " + JSON.stringify(response.document_tone.tones[i].tone_name));
		      	}
		      	else if (val < 0.8) { //medium
		      		blue.push("Detected medium amounts of " + JSON.stringify(response.document_tone.tones[i].tone_name));
		      	}
		      	else if (val < 0.9) { //moderate
		      		blue.push("Detected moderate amounts of " + JSON.stringify(response.document_tone.tones[i].tone_name));
		      	}
		      	else { //high
		      		blue.push("Detected high amounts of " + JSON.stringify(response.document_tone.tones[i].tone_name));
		      	}
	      	}	
	    }
	    if (blue.length == 0) {
	    	callback("No detectable tones")
	    }
	    else {
	    	callback(blue);
		}
	    //return new Map(blue);
	});
}
/*ANALYZING TEXT USING IBM WATSON*/

function flatten_phrases(sentence_list) {
	to_return = [];
	for (var i = 0; i < sentence_list.length; i++) {
		var curr_sentence = sentence_list[i];
		var buf = []
		var curr_sentence_split = curr_sentence.trim().split(/\s+/);
		for (var j = 0; j < curr_sentence_split.length; j++) {
			var word = curr_sentence_split[j].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

			if (isNaN(word)) {
				to_return.push(word);
			}
		}
	}
	return to_return;
}

function get_priors() {
	var prior_counter = {};
	var result;
	var result = fs.readFileSync("resources/small_phrase_corpus_tok2.txt", 'utf8');
	var lines = result.split('\n');
	for (var line = 0; line < lines.length; line++) {
		var words = lines[line].trim().split(/\s+/);
		words.map(word => word.trim());
		for (var i = 0; i < words.length; i++) {
			var word = words[i];
			if (word in prior_counter) {
				prior_counter[word] += 1;
			} else {
				prior_counter[word] = 1;
			}
		}
	}
	return prior_counter;	
}

function log_odds_results(group_one, group_two) {
	var group_one = group_one.filter(word => word.length != 1).map(word => word.toLowerCase().trim());
	var group_two = group_two.filter(word => word.length != 1).map(word => word.toLowerCase().trim());

	var group_one_counter = {};
	var group_one_values = 0;

	var combined_group_counter = {};
	var combined_group_values = 0;

	var group_two_counter = {};
	var group_two_values = 0;

	for (var i = 0; i < group_one.length; i++) {
		var word = group_one[i];
		if (word in group_one_counter) {
			group_one_counter[word] += 1;
		} else {
			group_one_counter[word] = 1;
		}

		if (word in combined_group_counter) {
			combined_group_counter[word] += 1;
		} else {
			combined_group_counter[word] = 1;
		}
	}

	for (var i = 0; i < group_two.length; i++) {
		var word = group_two[i];
		if (word in group_two_counter) {
			group_two_counter[word] += 1;
		} else {
			group_two_counter[word] = 1;
		}

		if (word in combined_group_counter) {
			combined_group_counter[word] += 1;
		} else {
			combined_group_counter[word] = 1;
		}		
	}

	group_one_values = group_one.length;
	group_two_values = group_two.length;
	combined_group_values = group_one_values + group_two_values;

	var prior_counter = get_priors();

	for (var i = 0; i < group_one.length; i++) {
		var word = group_one[i];
		if (word in prior_counter) {
			prior_counter[word] += 1;
		} else {
			prior_counter[word] = 1;
		}
	}

	for (var i = 0; i < group_two.length; i++) {
		var word = group_two[i];
		if (word in prior_counter) {
			prior_counter[word] += 1;
		} else {
			prior_counter[word] = 1;
		}
	}

	priors_sum = 0;
	for (var i = 0; i < prior_counter.length; i++) {
		var val = prior_counter[i];
		priors_sum += val;
	}

	all_deltas = {}
	all_sigmas = {}
	zscore_freqs = {}

	for (var word in combined_group_counter) {
		if (word in group_one_counter) {
			all_deltas[word] = Math.log((1.0 * (group_one_counter[word] + prior_counter[word])) / (group_one_values + priors_sum - group_one_counter[word] - prior_counter[word]));
		} else {
			all_deltas[word] = Math.log((1.0 * (0.0 + prior_counter[word])) / (group_one_values + priors_sum - 0.0 - prior_counter[word]));
		}

		if (word in group_two_counter) {
			all_deltas[word] -= Math.log((1.0 * (group_two_counter[word] + prior_counter[word])) / (group_two_values + priors_sum - group_two_counter[word] - prior_counter[word]));
		} else {
			all_deltas[word] -= Math.log((1.0 * (0.0 + prior_counter[word])) / (group_two_values + priors_sum - 0.0 - prior_counter[word]));
		}

		if (word in group_one_counter) {
			var group_one_value = group_one_counter[word];
		} else {
			var group_one_value = 0.0;
		}

		if (word in group_two_counter) {
			var group_two_vaue = group_two_counter[word];
		} else {
			var group_two_value = 0.0;
		}
		all_sigmas[word] = Math.sqrt(
								(1.0/(group_one_value + prior_counter[word])) +
								(1.0/(group_one_values + priors_sum - group_one_value - prior_counter[word])) +
								(1.0/(group_two_value + prior_counter[word])) +
								(1.0/(group_two_values + priors_sum - group_two_value - prior_counter[word])));
		zscore_freqs[word] = [ (1.0 * all_deltas[word]) / all_sigmas[word], combined_group_counter[word], group_one_counter[word], group_two_counter[word]]
	}

	return zscore_freqs;
}



module.exports = router;
