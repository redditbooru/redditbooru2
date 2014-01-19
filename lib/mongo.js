var MongoClient = require('mongodb').MongoClient,
    defer = require('q').defer,
    config = require('../config.js').MONGO_CONFIG,
    Mongo = function() {

        this.queue = [];
        this.db = null;

        MongoClient.connect(config.database, function(err, db) {
            if (err) {
                throw err;
            } else {

                // Run any operations that were queued up while waiting for the connection
                if (this.queue.length > 0) {

                }
            }
        });

    };

/**
 * This will enqueue an operation if we're still waiting to
 * connect to the database. Otherwise, it will allow standard
 * program flow
 */
Mongo.prototype.enqueue = function(func, params, promise) {
    if (null === this.db) {
        this.queue.push({
            func: func,
            params: params,
            promise: promise
        });
        return true;
    }
    return false;
};

// These are all async wrappers for core mongo functionality
Mongo.prototype.find = function(criteria) {
    var retVal = defer();

    if (!this.enqueue('find', arguments, retVal)) {

    }

    return retVal.promise;
};


Mongo.prototype.findOne = function() {
    var retVal = defer();

    if (!this.enqueue('findOne', arguments, retVal)) {

    }

    return retVal.promise;
};

Mongo.prototype.sync = function(collection, obj, criteria) {
    var retVal = defer();

    if (!this.enqueue('sync', arguments, retVal)) {

    }

    return retVal.promise;
};

if (!global._mongo) {
    global._mongo = new Mongo();
}
module.exports = global._mongo;