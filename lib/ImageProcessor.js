var defer = require('q').defer,
    Canvas = require('canvas'),
    Binary = require('mongodb').Binary,
    Image = Canvas.Image,
    HttpUtil = require('./HttpUtil.js'),
    ImageIO = require('./ImageIO.js'),
    mongo = require('./mongo.js'),
    ImageProcessor = {
        process: function(buffer) {
            var img = new Image(),
                retVal = defer();

            img.onload = function() {
                var canvas = new Canvas(256, 256),
                    ctx = canvas.getContext('2d'),
                    histogram = { red:[0, 0, 0, 0], green:[0, 0, 0, 0], blue:[0, 0, 0, 0] },
                    data = [],
                    width = img.width,
                    height = img.height,
                    pixels = width * height;

                ctx.antialias = 'subpixel';
                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 256, 256);
                data = ctx.getImageData(0, 0, 256, 256);
                data = data.data || null;
                img = null;

                if (null !== data) {

                    for (var i = 0, length = data.length; i < length; i += 4) {
                        histogram.red[Math.floor(data[i] / 64)]++;
                        histogram.green[Math.floor(data[i + 1] / 64)]++;
                        histogram.blue[Math.floor(data[i + 2] / 64)]++;
                    }

                    pixels = data.length / 4;

                    for (var i = 0; i < 4; i++) {
                        histogram.red[i] /= pixels;
                        histogram.green[i] /= pixels;
                        histogram.blue[i] /= pixels;
                    }

                    retVal.resolve({
                        imageType: ImageProcessor.getFileExtensionFromBuffer(buffer),
                        histogram: histogram,
                        width: width,
                        height: height
                    });

                } else {
                    retVal.reject(new Error('Invalid image'));
                }

            };

            img.onerror = function(err) {
                retVal.reject(err);
            };

            img.src = buffer;

            return retVal.promise;

        },

        processFromUrl: function(url) {
            var retVal = defer();
            ImageIO.retrieveImage(url).then(function(buffer) {
                ImageProcessor.process(buffer).then(function(image) {
                    retVal.resolve(image);
                }).fail(function(err) {
                    retVal.reject(err);
                });
            });
            return retVal.promise;
        },

        /**
         * Determines a file extension by image data (gloriously synchronous!)
         */
        getFileExtensionFromBuffer: function(buffer) {
            var retVal = null;
            if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
                retVal = 'jpg';
            } else if (buffer.length >= 4 && buffer[0] === 0x89 && buffer.toString().substr(1, 3) === 'PNG') {
                retVal = 'png';
            } else if (buffer.toString().substr(0, 6) === 'GIF89a' || buffer.toString().substr(0, 6) === 'GIF87a') {
                retVal = 'gif';
            }
            return retVal;
        }

    };

module.exports = ImageProcessor;