var express = require('express');
var router = express.Router();

var sqlQuery = "SELECT author, name, subreddit, body FROM `fh-bigquery.reddit_comments.2015_05` WHERE LENGTH(body) < 255 AND LENGTH(body) > 30 AND body LIKE '%";

// Imports the Google Cloud client library.
const Storage = require('@google-cloud/storage');
// Imports the Google Cloud client library
const BigQuery = require('@google-cloud/bigquery');
// The project ID to use, e.g. "your-project-id"
const projectId = "green-entity-183800";
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
  						err: '' });
});

router.get('/vis', function(req, res, next) {
  res.render('vis', { title: 'Get2KnowUS',
  						words: [{text:"Chair", size: 40}, {text:"Vivian", size: 25}, {text:"Devesh", size: 25}, {text:"Forever", size: 15}, {text:"Friends", size: 10}],
  						err: '' });
});

router.post('/submit_query', function(req, res, next) {
	runClassifier()
	curr_query = req.body.query_field
	if (curr_query.includes("'")) {
		res.render('index', { title: 'Get2KnowUS', 
							  err: "Please provide a phrase that does not contain '."})
	}
	query_to_enter = sqlQuery + curr_query;
	query_to_enter += "%' LIMIT 500;";
	// console.log(query_to_enter);
	var options = {
		query: query_to_enter,
		useLegacySql: false
	};
	bigquery
	.query(options)
	.then((results) => {
		rows = results[0];
		// console.log(rows);
		res.render('query_results', { title: 'Get2KnowUS', query: curr_query, results: rows });
		})
	.catch((err) => {
		console.error('ERROR:', err);
	});
});


function runQuery(options) {
	bigquery
	  .query(options)
	  .then((results) => {
	    rows = results[0];
	    return rows;
	  })
	  .catch((err) => {
	    console.error('ERROR:', err);
	  });	
}

function runClassifier() {
	exec('python classifier/nb1.py', function(err, stdout, stderr) {
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
	var tokenizer = new natural.WordTokenizer();
	var wordnet = new natural.WordNet(); 

	var tokens = tokenizer.tokenize(curr_query);
	var tagged_tokens = tagger.tag(tokens)

	var num_nouns = tagged_tokens.filter(getNouns).length

	var options = {};
	var curr_opts = [];
	tagged_tokens.forEach(function(tok, t) {
		if (tok[1] == "NN") {
			wordnet.lookup(tok[0], function(results) {
				results.forEach(function(result) {
					var syns = result.synonyms; 
					curr_opts = syns.slice(); 
				})
				options[t] = curr_opts; 
				if (Object.keys(options).length == num_nouns) {
					combos = listCombos(options, 0, tokens); 
					console.log("COMBOS = " + combos); 
					callback(options);
				}	
			});
		}
	})
}

module.exports = router;
