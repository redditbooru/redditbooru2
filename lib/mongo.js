var _ = require('underscore'),
    MongoClient = require('mongodb').MongoClient,
    defer = require('q').defer,
    config = require('../config.js').MONGO_CONFIG,
    Mongo = function() {

        this.queue = [];
        this.db = null;

        var that = this;

        MongoClient.connect(config.database, function(err, db) {
            if (err) {
                throw err;
            } else {

                that.db = db;

                // Run any operations that were queued up while waiting for the connection
                if (that.queue.length > 0) {
                    _.each(that.queue, function(action) {
                        action.func.apply(that, action.params).then(function(result) {
                            action.promise.resolve(result);
                        }).fail(function(err) {
                            action.promise.reject(err);
                        });
                    });
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
            params: Array.prototype.slice.call(params),
            promise: promise
        });
        return true;
    }
    return false;
};

// These are all async wrappers for core mongo functionality
Mongo.prototype.find = function(collection, criteria) {
    var retVal = defer();

    if (!this.enqueue(this.find, arguments, retVal)) {
        this.db.collection(collection).find(criteria).toArray(function(err, result) {
            if (err) {
                retVal.reject(err);
            } else {
                retVal.resolve(result);
            }
        });
    }

    return retVal.promise;
};

Mongo.prototype.update = function(collection, obj, criteria) {
    var retVal = defer();

    if (!this.enqueue(this.update, arguments, retVal)) {
        criteria = !_.isObject(criteria) ? {} : null;
        this.db.collection(collection).update(criteria, { $set: obj }, { upsert: true, safe: true }, function(err, result) {
            if (err) {
                retVal.reject(err);
            } else {
                retVal.resolve(result);
            }
        });
    }

    return retVal.promise;
};

Mongo.prototype.save = function(collection, obj) {
    var retVal = defer();

    if (!this.enqueue(this.save, arguments, retVal)) {
        this.db.collection(collection).save(obj, { upsert: true }, function(err, result) {
            if (err) {
                retVal.reject(err);
            } else {
                retVal.resolve(result);
            }
        });
    }

    return retVal.promise;
};

if (!global._mongo) {
    global._mongo = new Mongo();
}
module.exports = global._mongo;