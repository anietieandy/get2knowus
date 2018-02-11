var mongo = require('./mongo')

module.exports = {
	addClassification: function (postData, callback) {
		var new_classification = new mongo.Classifications(postData);
		new_classification.save(callback);
	}
};