var express = require('express');
var app = express();
var http = require('http').Server(app);
var ioServer = require('socket.io');
var io = ioServer(http);

var DataProvider = require('./dataProvider').DataProvider;

var Provider = new DataProvider('localhost', 27017);

app.set('port', 8080)
app.use('/', express.static(__dirname));


var players = ['red', 'blue']; // needs to be player objects, but player objects ID is based on game.entitites.length. Either write function to compare ignoring ID or need central server to track entity IDs.


function joinRoom(socket, roomId, roomSize, player, gameId, settings) {
	socket.join(roomId);
	Provider.db.collection('games', function(err, gamesCollection) {
		gamesCollection.findOne({gameId: gameId}, function (err, doc) {
			if(doc === null) gamesCollection.insert({gameId: gameId});
		});
	});
	socket.broadcast.to(roomId).send('game joined', {id: 2, roomId: roomId, roomSize: roomSize, player: player, gameId: gameId});
	socket.emit('game joined', {id: 5, roomId: roomId, roomSize: roomSize, player: player, gameId: gameId});
	if (roomSize === 2) { 
		socket.emit("game start", {settings: settings});
		socket.to(roomId).emit("game start", {settings: settings});
	}
}

function leaveRoom(socket, sessionId, roomId, player) {
	socket.to(roomId).emit('chat', {player: "system", msg: player + " has been disconnected"});
	Provider.db.collection('connections', function(err, connectionsCollection) {
			if(connectionsCollection) connectionsCollection.remove({sessionId: sessionId}, function(err, doc) {
				if(doc) connectionsCollection.find({roomId: roomId}).toArray(function(err, docs) {
					if(docs !== null && docs.length > 0) connectionsCollection.update({_id: docs[0]._id}, {$set:{roomSize: 1}}, function(err, doc) {
						//console.log("update ", err, doc);
					});
				});
			});
		});
}

io.of('/room').on('connection', function(socket) {
	var sessionId = socket.id+"a";
	var roomId = sessionId;
	var gameId = sessionId;
	var player = "red";
	var settings = null;

	//console.log('connected', socket);

	socket.on("find multiplayer", function(msg) {
		//console.log('find multiplayer', msg);
		settings = msg.settings;
		Provider.db.collection('connections', function(err, connectionsCollection) {
			connectionsCollection.findOne({roomSize: 1}, function(err, doc) {
				if(err) console.log(err);
				if(doc === null) {
					connectionsCollection.findOne({sessionId: sessionId}, function(err, doc) {
						if(err) console.log(err);
						if(doc === null) {
							connectionsCollection.insert({sessionId: sessionId, roomId: sessionId, roomSize: 1, player: player, gameId: sessionId, settings: settings}, function(err, doc) {
								if(err) console.log(err);
								joinRoom(socket, sessionId, 1, player, sessionId, settings);
							});
						}
					});
				} else {
					var foundDoc = doc;

					roomId = foundDoc.roomId;
					gameId = foundDoc.gameId;
					// console.log(settings);
					settings.width = Math.min(foundDoc.settings.width, settings.width);
					settings.height = Math.min(foundDoc.settings.height, settings.height);
					// console.log(settings);

					if(foundDoc.player === "red") player = "blue";

					connectionsCollection.update({roomId: roomId}, {$set:{settings: settings}});

					connectionsCollection.insert({sessionId: sessionId, roomId: roomId, roomSize: 2, player: player, gameId: gameId, settings: settings}, function(err, doc) {
						if(err) console.log(err);
						connectionsCollection.update({_id: foundDoc._id}, {$set:{roomSize: 2}}, function(err, doc) {
							if(err) console.log(err);
							joinRoom(socket, roomId, 2, player, gameId, settings);
						});
					});
				};
			});
		});

		socket.on("cancel find multiplayer", function() {
			leaveRoom(socket, sessionId, roomId, player);
		})
	});

	socket.on('disconnect', function(reason) {
		leaveRoom(socket, sessionId, roomId, player);
	});

	socket.on('chat', function(msg) {
		socket.to(msg.roomId).emit('chat', msg);
	});

	socket.on("move", function(msg) {
		Provider.db.collection('games', function(err, gamesCollection) {
			gamesCollection.update({gameId: gameId}, {"$push":{hexID: msg.hexID, player: msg.player, state: msg.gameState, view: msg.viewState}});
		});
		socket.to(msg.roomId).emit("move", {hexID: msg.hexID, player: msg.player});
	});
});

io.set('transports', ['polling']); // websockets are having trouble (wierd). When client tries to recieve "game joined", it works, but it resets the connection without this line. 
// See more here: http://stackoverflow.com/questions/17730369/connection-failed-from-client-to-server-in-socket-io and do more research!!


http.listen(app.get('port'), function() {
	console.log('listening on *:8080');
});