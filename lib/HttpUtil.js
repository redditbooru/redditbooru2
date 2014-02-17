var request = require('request')
    defer = require('q').defer,
    config = require('../config.js').HTTPUTIL_CONFIG,
    HttpUtil = {
        get: function(url, fakeReferer) {
            var retVal = defer(),
                buffer = new Buffer(0),
                error = null,
                headers = {
                    'User-Agent': config.userAgent
                };

            if (fakeReferer) {
                headers.Referer = fakeReferer;
            }

            request({
                url: url,
                headers: headers
            }, function(err, response, body) {
                if (err || response.statusCode !== 200) {
                    retVal.reject(err);
                } else {
                    retVal.resolve(body);
                }
            });

            return retVal.promise;
        }
    };

module.exports = HttpUtil;