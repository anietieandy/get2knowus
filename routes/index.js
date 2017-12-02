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

router.post('/submit_query', function(req, res, next) {
	runClassifier()
	curr_query = req.body.query_field
	if (curr_query.includes("'")) {
		res.render('index', { title: 'Get2KnowUS', 
							  err: "Please provide a phrase that does not contain '."})
	}
	query_to_enter = sqlQuery + curr_query;
	query_to_enter += "%' LIMIT 500;";
	console.log(query_to_enter);
	var options = {
		query: query_to_enter,
		useLegacySql: false
	};
	bigquery
	.query(options)
	.then((results) => {
		rows = results[0];
		console.log(rows);
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

module.exports = router;
