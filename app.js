var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
var app = express();

var routes = require('./routes/index');
var users = require('./routes/users');
var natural_language_understanding = new NaturalLanguageUnderstandingV1({
  'username': '7a5ee176-5c44-4860-b347-1e0761c93172',
  'password': 'VMCZS5242eXl',
  'version_date': '2017-02-27'
});
// Used for BlueMix API
var tone_analyzer = new ToneAnalyzerV3({
  username: '768d89c3-05a2-4b88-95ea-9addf4e3c125',
  password: 'NyPHlxJNZIqq',
  version_date: '2017-09-21'
});

// The project ID to use, e.g. "your-project-id"
const projectId = "green-entity-183800";

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public/images', 'favicon')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var credentials = process.env;

if (!process.env.PRODUCTION) {
	credentials = require('./credentials.json');
}

//add credentials for Google Cloud
var config = {
	projectId: projectId,
	credentials: credentials
};

// The SQL query to run
const sqlQuery = 
"SELECT author, name, subreddit, body FROM `fh-bigquery.reddit_comments.2015_05` WHERE author != '[deleted]' AND author IN (SELECT author FROM `fh-bigquery.reddit_comments.2015_05` WHERE LENGTH(body) < 255 AND LENGTH(body) > 30 AND body LIKE '%m a dad%') LIMIT 500;";

function printResult (rows) {
  console.log('Query Results:');
  for (var i = 0; i < rows.length; i++) {
  	row = rows[i];
  	// console.log("\n---------------------");
  	// console.log("Author: " + row.author);
  	// console.log("Name: " + row.name);
  	// console.log("Subreddit: " + row.subreddit);
  	// console.log("Body: " + row.body);  	
  }
}
/*ANALYZING TEXT USING IBM WATSON*/
var input1 = 'UPenn is an amazing school. It is the best school ever. Harvard on the other hand is iffy and not that great. Plus, it\'s in Boston which is too cold'
var input2 = 'Do you ever feel like breaking down? Do you ever feel out of place? Like somehow you just don\'t belong and no one understands you.'

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

function analyzeTone(text) {
  var param = {
  'tone_input': {'text': text},
  'content_type': 'application/json'
};
  tone_analyzer.tone(param, function(error, response) {
    if (error)
      console.log('error:', error);
    else
      console.log(JSON.stringify(response.document_tone, null, 2));
    }
  );
}

analyzeText(input1);
analyzeTone(input2);
/*ANALYZING TEXT USING IBM WATSON*/

module.exports = app
