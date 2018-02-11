var mongoose = require('mongoose');

var credentials = process.env;

if (!process.env.PRODUCTION) {
	credentials = require('./../credentials.json');
}

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://' + credentials.MLAB_USERNAME + ':' + credentials.MLAB_PASSWORD + '@ds221228.mlab.com:21228/' + credentials.MLAB_DB_NAME, function (err) {
	if (err && err.message.includes('ECONNREFUSED')) {
		console.log('Error connecting to mongodb database: %s.', err.message);
		process.exit(0);
	} else if (err) {
		throw err;
	} else {
		console.log('Successfully connected to DB.');
	}
});

var db = mongoose.connection;

var classificationSchema = new mongoose.Schema({
	query: String,
	post: String,
	user: String,
	valid: Boolean
  });

var Classifications = mongoose.model('Classifications', classificationSchema);

module.exports = {
	Classifications: Classifications,
	classifications_db: db.collection('Classifications')
};