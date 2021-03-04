const express = require('express'), fs = require('fs'), router = express.Router(), path = require('path'), dbHelpers = path.join(__dirname, "../models/dbHelpers"), tables = require(dbHelpers), snmp = require ("net-snmp");

let session = undefined, oids = ["1.3.6.1.2.1.1.5.0"], busId = '';

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { navbar: 0 });
});

router.get('/terms', (req, res) => {
  res.render('terms', { navbar: 2 });
});

router.get('/help', (req, res) => {
  res.render('help', { navbar: 2 });
});

router.get('/login', (req, res) => {
  res.render('initialForm', { navbar: 1 });
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

router.post('/updatemap', (req, res) => {
  let location = {messageTime: req.body.time, lat: req.body.lat, lon: req.body.lon, speed: req.body.speed, busId: busId}
  tables.addLocation(location).then(location => res.sendStatus(200)).catch(err => console.log(err));
});

router.get('/getLastLocation', (req, res) => {
  tables.getLastLocation().then(location => res.json(location)).catch(err => res.json(err));
});

router.get('/map', (req, res) => {
  res.render('map', {title: 'SITP - Transmilenio', navbar: 2})
});

router.get('/error', (req, res) => {
  res.render('fail', {title: 'SITP - Transmilenio', navbar: 1});
});

router.post('/connectedUsers', (req, res) => {
  session = snmp.createSession("10.100.100.254", "metgroup2021");
  session.get (oids, async (error, varbinds) => {
    if (error) console.error (error);
    else {
      let user = {traveler_kind: req.body.traveler_kind, stratum: req.body.stratum, age: req.body.age, gender: req.body.gender, busId: varbinds[0].value.toString()}
      await tables.addUser(user).then(user => res.sendStatus(200)).catch(err => res.sendStatus(400));
    }
    session.close();
  });
});

// streamax MDVR routes
router.get('/tmsadata', (req, res) => {
  let query = parseInt(req.msgkind);
  if (query === 0) {
    res.sendJson({idRoute: 'No disponible'})
  } else {
    res.sendStatus(400);
  }
});

router.post('/tmsadata', (req, res) => {
  let query = parseInt(req.msgkind);
  if (query === 0) {
    if (req.msgcontent.length <= 256 ) {
      await tables.addNewTmsaMessage(req.msgcontent).then(msg => res.sendStatus(200)).catch(err => res.sendStatus(400));
    } else {
      res.sendStatus(400);
    }
  } else if (query == 1) {
    res.sendStatus(200);
  } else {
    res.sendStatus(400)
  }
});

module.exports = router;