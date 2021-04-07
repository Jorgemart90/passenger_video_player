const { response } = require('express');

const express = require('express'), fs = require('fs'), router = express.Router(), path = require('path'), dbHelpers = path.join(__dirname, "../models/dbHelpers"), tables = require(dbHelpers), snmp = require ("net-snmp"), axios = require('axios');

let oids = ["1.3.6.1.2.1.1.5.0"];

const session = snmp.createSession("10.100.100.254", "metgroup2021");

global.routeId = '';
global.busId = '';

session.get (oids, (error, varbinds) => {
  if (error) console.error (error);
  else {
    global.busId = varbinds[0].value.toString();
  }
  session.close();
});

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
  const directoryPath = "public/media/videos/adds", extension = ".mp4";
	fs.readdir(directoryPath, function (err, files) {
    if (err) return console.log('Unable to scan directory: ' + err); 
		else {
      let targetFiles = files.filter(function(file) {
        return path.extname(directoryPath + '/' + file).toLowerCase() === extension;
      });
      let fileName = targetFiles[0], message = "Bienvenidos a Transmilenio. Que tengan un excelente viaje.";
      res.render('announcer', {title: 'SITP - Transmilenio', files: targetFiles, file: fileName, navbar: 2, message: message}); 
		}
	});
});

router.post('/updatemap', (req, res) => {
  let location = {messageTime: req.body.time, lat: req.body.lat, lon: req.body.lon, speed: req.body.speed, busId: busId}
  tables.addLocation(location).then(location => res.sendStatus(200)).catch(err => console.log(err));
});

router.get('/getLastLocation', (req, res) => {
  tables.getLastLocation().then(location => res.json(location)).catch(err => console.log(err));
});

router.get('/map', (req, res) => {
  res.render('map', {title: 'SITP - Transmilenio', navbar: 2})
});

router.get('/error', (req, res) => {
  res.render('fail', {title: 'SITP - Transmilenio', navbar: 1});
});

// streamax MDVR routes
/*router.get('/tmsaroutedata', async (req, res) => {
  let query = parseInt(req.body.msgkind);
  if (query === 0) {
    res.json({idRoute: 'No disponible'})
  } else {
    res.sendStatus(400);
  }
});

router.post('/tmsadata', async (req, res) => {
  let query = parseInt(req.body.msgkind);
  if (query === 0) {
    if (req.body.msgcontent.length <= 256 ) {
      await tables.addNewTmsaMessage({broadcastdate: req.body.broadcastdate, content: req.body.msgcontent}).then(msg => res.sendStatus(200)).catch(err => console.log(err));
    } else {
      res.sendStatus(400);
    }
  } else if (query == 1) {
    res.sendStatus(200);
  } else {
    res.sendStatus(400)
  }
});*/

router.get('/getLastMessageContent', (req, res) => {
  tables.getLastMessage().then(message =>res.json(message[0])).catch(err => console.log(err));
});

router.post('/parseroute', (req, res) => {
  let request = req.body, used = request.used.data[0] + request.used.data[1] - 1, selected = request.routes[used], divided = selected.split(','), filtered = divided.filter((elem) => { return elem != ""; });
  if (used == request.routes.length - 1) filtered.pop();
  let reconstituted = String.fromCharCode.apply(String, filtered); 
  global.routeId = reconstituted.replace(/[^0-9a-záéíóúñ ]/gi, '');
  res.sendStatus(200);
});

// streamax disposable routes
router.get('/tmsaroutedata', async (req, res) => {
  let query = parseInt(req.query.msgquery);
  if (query === 0) {
    res.json({idRoute: global.routeId})
  } else if (query === 1) {
    res.json({alive: true})
  } else {
    res.sendStatus(400);
  }
});

router.post('/tmsaroutedata', async (req, res) => {
  let query = parseInt(req.body.msgkind);
  if (query >= 0) {
    if (req.body.msgcontent.length <= 256 ) {
      await tables.addNewTmsaMessage({broadcastdate: req.body.broadcastdate, content: req.body.msgcontent}).then(msg => res.sendStatus(200)).catch(err => console.log(err));
    } else {
      res.sendStatus(400);
    }
  } else {
    res.sendStatus(400);
  }
});

router.post('/connectedUsers', async (req, res) => {
  let user = {traveler_kind: req.body.traveler_kind, stratum: req.body.stratum, age: req.body.age, gender: req.body.gender, busId: global.busId, routeId: global.routeId}
  await tables.addUser(user).then(user => res.sendStatus(200)).catch(err => {
    console.log(err);
    res.sendStatus(400)
  });
});

router.get('/videosportal', (req, res) => {
  const directoryPath = "public/media/videos";
	fs.readdir(directoryPath, function (err, files) {
    if (err) return console.log('Unable to scan directory: ' + err); 
		else {
			var results = {}, tmp = [];
			files.forEach(function(file) {
				tmp = fs.readdirSync(directoryPath+"/"+file);
				tmp.forEach(function(archive) {
					if (path.extname(directoryPath + "/" + archive) == ".jpg") results[file] = archive;
				});
			});
			res.render('videosportal', { title: 'SITP - Transmilenio', videos: results, directoryPath: directoryPath, navbar: 2});
		}
	});
});

module.exports = router;