var http = require('follow-redirects').http,
    https = require('follow-redirects').https,
    defer = require('q').defer,
    urlParse = require('url').parse,
    config = require('../config.js').HTTPUTIL_CONFIG,
    HttpUtil = {
        get: function(url, fakeReferer) {
            var req = url.indexOf('https') === 0 ? https : http,
                retVal = defer(),
                urlInfo = urlParse(url),
                buffer = new Buffer(0),
                error = null;

            try {
                req.get({
                    hostname: urlInfo.hostname,
                    port: urlInfo.port,
                    path: urlInfo.path,
                    headers: {
                        'User-Agent': config.userAgent,
                        'Referer': fakeReferer ? 'http://' + urlInfo.hostname : null
                    }
                }, function(res) {
                    res
                        .on('error', function(err) {
                            error = err;
                        })
                        .on('data', function(chunk) {
                            buffer = Buffer.concat([ buffer, chunk ]);
                        })
                        .on('end', function() {
                            if (error) {
                                retVal.reject(error);
                            } else {
                                retVal.resolve(buffer);
                            }
                        });
                });
            } catch (err) {
                retVal.reject(err);
            }

            return retVal.promise;
        }
    };

module.exports = HttpUtil;