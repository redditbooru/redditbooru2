var _ = require('underscore'),
    util = require('util'),
    defer = require('q').defer,
    Dal = require('../../lib/dal.js'),
    ImageProcessor = require('../../lib/ImageProcessor.js'),
    Image = function(obj) {
        if (_.isObject(obj)) {
            Image.copyRowFromDb(this, obj);
        }
    };

// Inherit Dal
util.inherits(Image, Dal);
_.extend(Image, Dal);

// Database mapping
Image._dbTable = 'images';
Image._dbPrimaryKey = 'id';
Image._dbMap = {
    id: 'image_id',
    sourceId: 'source_id',
    url: 'image_url',
    cdnUrl: 'image_cdn_url',
    width: 'image_width',
    height: 'image_height',
    histR1: 'image_hist_r1',
    histR2: 'image_hist_r2',
    histR3: 'image_hist_r3',
    histR4: 'image_hist_r4',
    histG1: 'image_hist_g1',
    histG2: 'image_hist_g2',
    histG3: 'image_hist_g3',
    histG4: 'image_hist_g4',
    histB1: 'image_hist_b1',
    histB2: 'image_hist_b2',
    histB3: 'image_hist_b3',
    histB4: 'image_hist_b4',
    isGood: 'image_good',
    contentRating: 'image_rating'
};

/**
 * Creates an image object with histogram data from a URL
 */
Image.createFromUrl = function(url) {
    var retVal = defer();

    ImageProcessor.processFromUrl(url).then(function(image) {
        var obj = {
                image_url: url,
                image_width: image.width,
                image_height: image.height
            },
            i = 0;

        for (; i < 4; i++) {
            obj['image_hist_r' + (i + 1)] = image.histogram.red[i];
            obj['image_hist_g' + (i + 1)] = image.histogram.green[i];
            obj['image_hist_b' + (i + 1)] = image.histogram.blue[i];
        }

        retVal.resolve(new Image(obj));

    }).fail(function(err) {
        retVal.reject(err);
    });

    return retVal.promise;
};

module.exports = Image;