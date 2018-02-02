var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

var app = express();

var routes = require('./routes/index');
var users = require('./routes/users');

// The project ID to use, e.g. "your-project-id"
const projectId = "green-entity-183800";
var url = 'mongodb://viviange:password@ds221228.mlab.com:21228/confirmations';

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

  insertDocuments(db, function() {
    db.close();
  });
});

/* I DID STUFF*/
var insertDocuments = function(db, callback) {
  // Get the documents collection
  console.log(db);
  var collection = db.collection('confirmations');
  // Insert some documents
  collection.insert(
    {query : "m a dad", post : "I'm a dad...sike", user: "testuser1", valid: false}
  , function(err, result) {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    assert.equal(1, result.ops.length);
    console.log("Inserted 1 document into the collection");
    callback(result);
  });
}

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
  	console.log("\n---------------------");
  	console.log("Author: " + row.author);
  	console.log("Name: " + row.name);
  	console.log("Subreddit: " + row.subreddit);
  	console.log("Body: " + row.body);  	
  }
}












module.exports = app;
