var _ = require('underscore'),
    util = require('util'),
    base = require('base-converter'),
    defer = require('q').defer,
    Dal = require('../../lib/dal.js'),
    ImageProcessor = require('../../lib/ImageProcessor.js'),
    ImageIO = require('../../lib/ImageIO.js'),
    Item = require('../cache/item'),
    cdnPath = require('../../config').CDN_PATH,

    Image = function(obj) {
        if (_.isObject(obj)) {
            Image.copyRowFromDb(this, obj);
            if (this.id) {
                this.cdnUrl = this._generateCdnUrl();
            }
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
    type: 'image_type',
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
    isGood: 'image_good'
};

Image.prototype._generateCdnUrl = function() {
    return cdnPath + base.decTo36(this.id) + '.' + this.type;
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

        // Bolt on the image type for any future insert sync operation
        obj = new Image(obj);
        obj.type = image.imageType;
        retVal.resolve(obj);

    }).fail(function(err) {
        retVal.reject(err);
    });

    return retVal.promise;
};

/**
 * Reverse image search is here
 */
Image.queryByImage = function(options) {
    var retVal = defer(),
        runQuery = function(image) {
            Image._queryByImage(image, options).then(function(results) {
                retVal.resolve(results);
            }).fail(function(err) {
                retVal.reject(err);
            });
        };

    if (options.imageUrl) {
        ImageProcessor.processFromUrl(options.imageUrl).then(function(image) {
            runQuery(image);
        }).fail(function(err) {
            retVal.reject(err);
        });
    } else if (options.image instanceof Image) {
        runQuery(options.image)
    } else {
        retVal.reject(new Error('No image to query against'));
    }

    return retVal.promise;
};

/**
 * Actual query implementation
 */
Image._queryByImage = function(image, options) {
    var retVal = defer(),
        db = global._db,
        query = 'SELECT `image_id`, (',
        tempArr = [],
        params = {},
        i = 1,
        start = Date.now();

    for (; i < 5; i++) {
        tempArr.push('ABS(`image_hist_r' + i + '` - :imageR' + i + ')');
        params['imageR' + i] = image.histogram.red[i - 1];
        tempArr.push('ABS(`image_hist_g' + i + '` - :imageG' + i + ')');
        params['imageG' + i] = image.histogram.green[i - 1];
        tempArr.push('ABS(`image_hist_b' + i + '` - :imageB' + i + ')');
        params['imageB' + i] = image.histogram.blue[i - 1];
    }

    query += tempArr.join(' + ') + ') AS distance FROM `images` WHERE image_id IN (SELECT x.`image_id` FROM `posts` p INNER JOIN `post_images` x ON x.`post_id` = p.`post_id` WHERE ';

    if (options.sources) {
        tempArr = [];
        if (_.isArray(options.sources)) {
            tempArr = options.sources;
        } else if (_.isNumber(options.sources)) {
            tempArr = [ options.sources ];
        } else if (_.isString(options.sources)) {
            options.sources = options.sources.split(',');
            for (var i = 0, count = options.sources.length; i < count; i++) {
                tempArr.push(parseInt(options.sources[i]));
            }
        }
        query += 'source_id IN (' + tempArr.join(',') + ') AND ';
    }

    query += '1) ORDER BY distance ASC, image_id DESC';

    params['limit'] = _.isNumber(options.limit) ? options.limit : 25;
    query += ' LIMIT :limit';

    db.query(query, params).then(function(results) {
        var ids = [];
        _.each(results, function(item) {
            ids.push(item.image_id);
        });

        // Return the cache item for each augmented with the distance number
        Item.query({ imageId: ids }).then(function(images) {
            for (var i = 0, count = results.length; i < count; i++) {
                if (images[i] && images[i].imageId == results[i].image_id) {
                    images[i].distance = results[i].distance;
                }
            }
            retVal.resolve(images);
            console.log((Date.now() - start) + 'ms for reverse lookup');
        }).fail(function(err) {
            retVal.reject(err);
        });
    }).fail(function(err) {
        retVal.reject(err);
    });

    return retVal.promise;
};

/**
 * Syncs an image to the database and, on insert, saves said image. That said,
 * I can't think of a reason there would ever be an update on an image...
 * @override
 */
Image.prototype.sync = function() {
    var retVal = defer();
        insert = !(this.id > 0);

    Dal.prototype.sync.call(this).then(function(image) {
        if (insert && image.type) {
            var fileName = base.decTo36(image.id) + '.' + image.type;
            ImageIO.saveImage(image.url, fileName).then(function() {
                image.cdnUrl = image._generateCdnUrl();
                retVal.resolve(image);
            }).fail(function(err) {
                retVal.reject(err);
            });
        } else {
            retVal.resolve(image);
        }
    }).fail(function(err) {
        retVal.reject(err);
    });

    return retVal.promise;
};

module.exports = Image;