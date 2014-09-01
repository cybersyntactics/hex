var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

// This file is really embarassing. Lots of ideas. None of them are really used right now other than the constructor.

DataProvider = function(host, port) {
	this.db = new Db('node-mongo-hex', new Server(host, port, {auto_reconnect: true}, {}));
	this.db.open(function(){});
};

DataProvider.prototype.from = function(table_name, callback) {
	this.db.collection(table_name, function(error, table_object){
		if (error) callback(error);
		else callback(null, table_object);
	});
};

DataProvider.prototype.newProvider = function(table_name) {
	return function(callback) {
		var result;
		this.db.collection(table_name, function(err, collection) {
			if(typeof(callback) === "undefined" && !err) result = collection;
			else if(typeof(callback) === "undefined" && err !== null) result = err;
			else if(err) callback(err);
			else callback(null, collection);
		});
		if(result !== null) return result;
	}
}

DataProvider.prototype.newFinder = function(collection) {
	return function(query, callback, options) {
		collection.find(query, options).toArray(function(err, docs) {
			if(err) callback(err);
			else callback(null, docs);
		});
	};
};

DataProvider.prototype.findAllFrom = function(table_name, callback) {
	var get = this;
	get.from(table_name, function(error, table_object) {
		if (error) callback(error)
		else {
			table_object.find().toArray(function(error, results) {
				if (error) callback(error)
				else callback(null, results)
			});
		}
	});
};

DataProvider.prototype.findByIdFrom = function(id, table_name, callback) {
	this.from(table_name, function(error, table_object) {
		if (error) callback(error)
		else {
			table_object.findOne({_id: table_object.db.bson_serializer.ObjectID.createFromHexString(id)}, function (error, result) {
				if (error) callback(error)
				else callback(null, result);
			});
		}

	});
};

DataProvider.prototype.where = function(id) {
	var that = this;
	return {'from': function(table_name) {
		return {'perform': function(callback) {
			that.from(table_name, function(error, table_object) {
				if (error) callback(error)
				else {
					table_object.findOne({_id: table_object.db.bson_serializer.ObjectID.createFromHexString(id)}, function (error, result) {
						if (error) callback(error)
						else callback(null, result);
					});
				}
			});
		}}
	}};
};


DataProvider.prototype.save = function(save_objects, collection_name, callback) {
	this.from(collection_name, function(error, collection_object) {
		if (error) callback(error);
		else {
			if (typeof(save_objects.length) == "undefined")
				save_objects = [save_objects];

			for (var i = 0; i < save_objects.length; i++) {
				save_object = save_objects[i];
				save_object.created_at = new Date();
				if (save_object.comments === undefined) save_object.comments = [];
				for (var j = 0; j < save_object.comments.length; j++) {
					save_object.comments[j].created_at = new Date();
				}
			}

			collection_object.insert(save_objects, function() {
				callback(null, save_objects);
			});
		}
	});
}


DataProvider.prototype.addObjectToDocument = function(collection_name, docId, object, callback) {
	this.from(collection_name, function(error, collection_object) {
		if(error) callback(error);
		else {
			collection_object.update(
				{_id: collection_object.db.bson_serializer.ObjectID.createFromHexString(docId)},
				{"$push": object},
				function(error, document_object){
					if(error) callback(error);
					else callback(null, document_object);
				});
		}
	});
};

exports.DataProvider = DataProvider;