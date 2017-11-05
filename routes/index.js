var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Get2KnowUS' });
});

router.post('/submit_query', function(req, res, next) {
	console.log(req.body.query_field);
  	res.render('query_results', { title: 'Get2KnowUS', query: req.body.query_field, results: ["dummy result 1", "dummy result 2"] });
});


module.exports = router;
