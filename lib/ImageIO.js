var AWS = require('aws-sdk'),
    Binary = require('mongodb').Binary,
    defer = require('q').defer,
    fs = require('fs'),
    HttpUtil = require('./HttpUtil.js'),
    mongo = require('./mongo.js'),
    config = require('../config.js').IMAGE_IO,
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
                    downloadImage(url);
                } else {
                    retVal.resolve(results[0].imageData.buffer);
                }
            }).fail(function(err) {
                downloadImage(url);
            });

            return retVal.promise;
        },

        /**
         * Downloads and saves an image to local and cloud storage
         * @return Boolean success of save operation
         */
        saveImage: function(url, fileName) {
            var retVal = defer();

            ImageIO.retrieveImage(url).then(function(buffer) {
                // Save off to AWS first. Having an S3 copy is imperative since local storage is cleaned periodically
                var s3 = new AWS.S3;
                s3.putObject({
                    ACL: config.awsACL,
                    Body: buffer,
                    Bucket: config.awsBucket,
                    Key: config.awsFolder + fileName
                }, function(err, data) {
                    if (err) {
                        retVal.reject(err);
                    } else {
                        // Now save the local copy
                        fs.writeFile(config.localStore + fileName, buffer, function(err, bytesWritten, buffer) {
                            if (err) {
                                retVal.reject(err);
                            } else {
                                retVal.resolve(true);
                            }
                        });
                    }
                });
            }).fail(function(err) {
                retVal.fail(err);
            });

            return retVal.promise;
        }

    };

module.exports = ImageIO;