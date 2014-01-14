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
            var promise = defer(),
                action = query.split(' ')[0].toLowerCase();

            mysql.query(query, params, function(err, result, fields) {
                if (err) {
                    promise.reject(err);
                } else {
                    switch (action) {
                        case 'select':
                            promise.resolve(result);
                            break;
                        case 'insert':
                            promise.resolve(result.insertId);
                            break;
                        case 'delete':
                        case 'update':
                            break;
                    }
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