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

    getDataListing: function(page, limit, period) {
        var retVal = defer(),
            buffer = new Buffer(0),
            failed = false,
            limit = limit || 25,
            period = period || 'day';
        HttpUtil.get('http://www.reddit.com/' + page + '.json?limit=' + limit + '&t=' + period)
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
reddit.getDataListing = function(page, limit, period) {
    var obj = new reddit();
    return obj.getDataListing(page, limit, period);
};

module.exports = reddit;