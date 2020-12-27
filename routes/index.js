const express = require('express'), fs = require('fs'), axios = require('axios'), router = express.Router(), path = require('path'), ConnectedUser = require('../models/ConnectedUser'), { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

/* GET home page. */
router.get('/', ensureAuthenticated, (req, res, next) => {
  let cookie = req.cookies['user'];
  ConnectedUser.findOne({_id: cookie}).then(user => {
    res.render('index', { navbar: 0, name: user.name });
  });
});


router.get('/terms', (req, res) => {
  res.render('terms', { navbar: 2 });
});

router.get('/help', (req, res) => {
  res.render('help', { navbar: 2 });
});

router.get('/login', forwardAuthenticated, (req, res) => {
  res.render('initialForm', { navbar: 1 });
});

router.post('/login', (req, res) => {
  const newUser = new ConnectedUser(req.body);
  newUser.save().then(user => {
    res.cookie('user', user._id);
    res.redirect('/');
  }).catch(err => console.log(err));
});

router.get('/announcer', (req, res) => {
  const directoryPath = "public/media/videos/adds";
	fs.readdir(directoryPath, function (err, files) {
    if (err) return console.log('Unable to scan directory: ' + err); 
		else {
      let fileName = files[0];
      res.render('announcer', {title: 'SITP - Transmilenio', files: files, file: fileName, navbar: 2}); 
		}
	});
});

router.get('/map', (req, res) => {
  res.render('map', {title: 'SITP - Transmilenio', navbar: 2})
});

router.get('/error', (req, res) => {
  res.render('fail', {title: 'SITP - Transmilenio', navbar: 1});
});


module.exports = router;
