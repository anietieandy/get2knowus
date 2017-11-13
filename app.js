var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
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


// Imports the Google Cloud client library.
const Storage = require('@google-cloud/storage');

// Instantiates a client. Explicitly use service account credentials by
// specifying the private key file. All clients in google-cloud-node have this
// helper, see https://googlecloudplatform.github.io/google-cloud-node/#/docs/google-cloud/latest/guides/authentication
const storage = Storage({
  keyFilename: 'My First Project-b75eb6aaa18f.json'
});

// Makes an authenticated API request.
storage
  .getBuckets()
  .then((results) => {
    const buckets = results[0];

    console.log('Buckets:');
    buckets.forEach((bucket) => {
      console.log(bucket.name);
    });
  })
  .catch((err) => {
    console.error('ERROR:', err);
  });

// Imports the Google Cloud client library
const BigQuery = require('@google-cloud/bigquery');

// The project ID to use, e.g. "your-project-id"
const projectId = "bigquerytest-185903";

// The SQL query to run
const sqlQuery = `SELECT author, name, subreddit, body
FROM `fh-bigquery:reddit_comments.2015_05`
WHERE author != "[deleted]" AND author
IN (SELECT author FROM `fh-bigquery:reddit_comments.2015_05` WHERE LENGTH(body) < 255 AND LENGTH(body) > 30 AND body LIKE '%m a dad%') LIMIT 500;`;

// Instantiates a client
const bigquery = BigQuery({
  projectId: projectId
});

// Query options list: https://cloud.google.com/bigquery/docs/reference/v2/jobs/query
const options = {
  query: sqlQuery,
  useLegacySql: false // Use standard SQL syntax for queries.
};

// Runs the query
bigquery
  .query(options)
  .then((results) => {
    const rows = results[0];
    printResult(rows);
  })
  .catch((err) => {
    console.error('ERROR:', err);
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


module.exports = app;
