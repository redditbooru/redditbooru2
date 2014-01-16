/**
 * Reddit interface
 */

var _ = require('underscore'),
    defer = require('q').defer,
    HttpUtil = require('./HttpUtil.js'),
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
        HttpUtil.get('http://www.reddit.com/' + page + '.json')
            .then(function(data) {
                try {
                    var obj = JSON.parse(data.toString());
                    retVal.resolve(obj);
                } catch (e) {
                    retVal.reject(new Error(e.message));
                }
            })
            .fail(function(err) {
                retVal.reject(err);
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