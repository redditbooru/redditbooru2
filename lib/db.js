module.exports = (function() {
    
    var defer = require('q').defer,
        config = require('../config.js').MYSQL_CONFIG,
        _ = require('underscore'),
        mysql = require('mysql').createConnection({
            host: 'localhost',
            user: config.user,
            password: config.password,
            database: config.database
        }),

        query = function(query, params) {
            var promise = defer();
            if (_.isFunction(params)) {
                callback = params;
                params = {};
            }
            mysql.query(query, params, function(err, rows, fields) {
                if (err) {
                    throw err;
                } else {
                    promise.resolve(rows);
                }
            });
            return promise.promise;
        };

    mysql.connect();
    mysql.config.queryFormat = function (query, values) {
        return !values ? query : query.replace(/\:(\w+)/g, function (txt, key) {
            return values.hasOwnProperty(key) ? this.escape(values[key]) : txt;
        }.bind(this));
    };

    return {
        query: query
    };

}());