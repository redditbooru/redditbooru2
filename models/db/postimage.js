var _ = require('underscore'),
    util = require('util'),
    Dal = require('../../lib/dal.js'),
    PostImage = function(obj) {
        if (_.isObject(obj)) {
            PostImage.copyRowFromDb(this, obj);
        }
    };

// Inherit Dal
util.inherits(PostImage, Dal);
_.extend(PostImage, Dal);

// Database mapping
PostImage._dbTable = 'post_images';
PostImage._dbMap = {
    postId: 'post_id',
    imageId: 'image_id'
};

module.exports = PostImage;