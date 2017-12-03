var express = require('express');
var router = express.Router();

var sqlQuery = "SELECT author, name, subreddit, body FROM `fh-bigquery.reddit_comments.2015_05` WHERE author != '[deleted]' AND LENGTH(body) < 255 AND LENGTH(body) > 30 AND body LIKE '%";

var usernameQuery = "SELECT body FROM `fh-bigquery.reddit_comments.2015_05` WHERE author IN (";

// Imports the Google Cloud client library.
const Storage = require('@google-cloud/storage');
// Imports the Google Cloud client library
const BigQuery = require('@google-cloud/bigquery');
// The project ID to use, e.g. "your-project-id"
const projectId = "green-entity-183800";
//for fs
const fs = require('fs');
//For exec
var exec = require('child_process').exec;


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

router.post('/submit_query', function(req, res, next) {
	var curr_query = req.body.query_field;
	if (!req.body.hidden) {
		var new_options = ["I'm a father"]
		if (new_options.length > 0) {
			res.render('index', { title: 'Get2KnowUS',
								  args: {help: "We found some other queries you may find helpful - check to see if you'd like to add them!",
	  									 other_queries: new_options,
	  									 query_to_enter: curr_query}
	  							});
		}
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
				exec('python2 classifier/sdg1.py query_results.txt', (err, stdout, stderr) => {
					if (err) {
						console.log(err);
						return;
					}
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
							res.render('query_results', { title: 'Get2KnowUS', all_queries: all_queries, results: rows });
						});
					});
				});
			});
		});		
	}
});

router.post('/classify_query', function(req, res, next) {
	var curr_query = req.body.query_field;
	if (!req.body.hidden) {
		new_options = ["I'm a father"]
		if (new_options.length > 0) {
			res.render('index', { title: 'Get2KnowUS',
								  args: {help: "We found some other queries you may find helpful - check to see if you'd like to add them!",
	  									 other_queries: new_options,
	  									 query_to_enter: curr_query}
	  							});
		}
	} else {
		var all_queries = [];
		all_queries.push(curr_query);		
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
			res.render('classify_queries', { title: 'Get2KnowUS', queries: all_queries, results: rows });		
		});			
	}	
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

module.exports = router;
