var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Animes' });
});

router.get('/hola/:name/:last/user', function(req, res, next) {
  console.log(req.params);
  res.send({"data":"hola"});
  //res.render('index', { title: 'Animes' });
});

router.post('/hola', function(req, res, next) {
  console.log(req.params);
  res.send({"data":"hola"});
  //res.render('index', { title: 'Animes' });
});

module.exports = router;
