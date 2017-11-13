var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

var routes = require('./routes/index');
var users = require('./routes/users');

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
  	console.log("\n---------------------");
  	console.log("Author: " + row.author);
  	console.log("Name: " + row.name);
  	console.log("Subreddit: " + row.subreddit);
  	console.log("Body: " + row.body);  	
  }
}





// Instantiates a client. Explicitly use service account credentials by
// specifying the private key file. All clients in google-cloud-node have this
// helper, see https://googlecloudplatform.github.io/google-cloud-node/#/docs/google-cloud/latest/guides/authentication
/*
const storage = Storage({
  keyFilename: 'My First Project-b75eb6aaa18f.json'
});
*/

// Makes an authenticated API request.
/*
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
  });	*/












module.exports = app;
