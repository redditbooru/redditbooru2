var defer = require('q').defer,
    Binary = require('mongodb').Binary,
    HttpUtil = require('./HttpUtil.js'),
    mongo = require('./mongo.js'),
    ImageIO = {
        downloadImage: function(url) {
            var retVal = defer();

            HttpUtil.get(url).then(function(buffer) {
                retVal.resolve(buffer);
            }).fail(function(err) {
                retVal.reject(err);
            });

            return retVal.promise;
        },

        /**
         * Retrieves an image from cache or downloads and saves as necessary
         */
        retrieveImage: function(url) {
            var retVal = defer(),
                downloadImage = function(url) {
                    console.log('Downloading image...');
                    ImageIO.downloadImage(url).then(function(buffer) {
                        // Store a copy of the image so we can use it later
                        mongo.save('imageCache', {
                            url: url,
                            imageData: new Binary(buffer)
                        });
                        retVal.resolve(buffer);
                    }).fail(function(err) {
                        retVal.reject(err);
                    });
                };

            mongo.find('imageCache', { url: url }).then(function(results) {
                if (!results.length) {
                    console.log('[ImageIO] ' + url + ' not found in mongo cache');
                    downloadImage(url);
                } else {
                    console.log('[ImageIO] ' + url + ' found in mongo cache');
                    retVal.resolve(results[0].imageData.buffer);
                }
            }).fail(function(err) {
                console.log('[ImageIO] Failed to retrieve ' + url + ' from mongo cache: ' + err);
                downloadImage(url);
            });

            return retVal.promise;
        }
    };

module.exports = ImageIO;