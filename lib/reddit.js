/**
 * Reddit interface
 */

var _ = require('underscore'),
    defer = require('q').defer,
    http = require('http'),
    reddit = function(username) {
        
    };

_.extend(reddit.prototype, {

    _login: function() {

    },

    comment: function(parent, body) {

    },

    vote: function(object) {

    },

    report: function(object) {

    },

    getDataListing: function(page) {
        var retVal = defer(),
            buffer = new Buffer(0),
            failed = false;
        http.get('http://www.reddit.com/' + page + '.json', function(res) {
            res
                .on('error', function(e) {
                    retVal.reject(new Error(e.message));
                    failed = true;
                })
                .on('data', function(chunk) {
                    buffer = Buffer.concat([ buffer, chunk ]);
                })
                .on('end', function() {
                    try {
                        var obj = JSON.parse(buffer.toString());
                        retVal.resolve(obj);
                    } catch (e) {
                        retVal.reject(new Error(e.message));
                    }
                });
        });
        return retVal.promise;
    }

});

/**
 * Static version of getDataListing
 */
reddit.getDataListing = function(page) {
    var obj = new reddit();
    return obj.getDataListing(page);
};

module.exports = reddit;