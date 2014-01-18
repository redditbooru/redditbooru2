var defer = require('q').defer,
    Canvas = require('canvas'),
    Image = Canvas.Image,
    HttpUtil = require('./HttpUtil.js'),
    ImageProcessor = {
        process: function(data) {
            var img = new Image(),
                retVal = defer();

            img.onload = function() {
                console.log('image loaded');
                var canvas = new Canvas(256, 256),
                    ctx = canvas.getContext('2d'),
                    histogram = { red:[0, 0, 0, 0], green:[0, 0, 0, 0], blue:[0, 0, 0, 0] },
                    pixels = 0,
                    data = [];

                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 256, 256);
                data = ctx.getImageData(0, 0, 256, 256);
                data = data.data || null;

                if (null !== data) {
                    pixels = img.width * img.height;

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
                        histogram: histogram,
                        width: img.width,
                        height: img.height
                    });

                } else {
                    retVal.reject(new Error('Invalid image'));
                }

            };

            img.onerror = function(err) {
                retVal.reject(err);
            };

            img.src = data;

            return retVal.promise;

        },

        processFromUrl: function(url) {
            var retVal = defer();
            HttpUtil.get(url).then(function(buffer) {
                console.log(url + ' loaded!');
                ImageProcessor.process(buffer).then(function(image) {
                    retVal.resolve(image);
                }).fail(function(err) {
                    retVal.reject(err);
                })
            });
            return retVal.promise;
        }
    };

module.exports = ImageProcessor;