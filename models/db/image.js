var _ = require('underscore'),
    util = require('util'),
    Dal = require('../../lib/dal.js'),
    Image = function(obj) {
        if (_.isObject(obj)) {
            Image.copyRowFromDb(this, obj);
        }
    };

// Database mapping
Image._dbTable = 'images';
Image._primaryKey = 'id';
Image._dbMap = {
    id: 'image_id',
    postId: 'post_id',
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

_.extend(Image, Dal);

module.exports = Image;