var http = require('http'),
    defer = require('q').defer,
    urlParse = require('url').parse,
    config = require('../config.js'),
    HttpUtil = {
        get: function(url, fakeReferer) {
            var retVal = defer(),
                urlInfo = urlParse(url),
                buffer = new Buffer(0),
                error = null;

            http.get({
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

            return retVal.promise;
        }
    };

module.exports = HttpUtil;