var _ = require('underscore'),
    defer = require('q').defer,
    util = require('util'),
    Dal = require('../../lib/dal.js'),
    User = require('./user.js'),
    Post = function(obj) {
        if (_.isObject(obj)) {
            Post.copyRowFromDb(this, obj);
        }
    };

// Inherit Dal
util.inherits(Post, Dal);
_.extend(Post, Dal);

// Database mapping
Post._dbTable = 'posts';
Post._dbPrimaryKey = 'id';
Post._dbMap = {
    id: 'post_id',
    sourceId: 'source_id',
    externalId: 'post_external_id',
    dateCreated: 'post_date',
    dateUpdated: 'post_updated',
    title: 'post_title',
    link: 'post_link',
    userId: 'user_id',
    keywords: 'post_keywords',
    score: 'post_score',
    processed: 'post_processed',
    visible: 'post_visible',
    meta: 'post_meta'
};

Post.createFromRedditPost = function(post) {

    var retVal = defer();

    User.getByUserName(post.author)
        .then(function(userId) {
            retVal.resolve(new Post({
                post_external_id: post.id,
                user_id: userId,
                post_date: post.created,
                post_title: post.title,
                post_link: post.link,
                nsfw: post.over_18,
                post_score: post.score,
                post_processed: false,
                post_visible: false
            }));
        })
        .fail(function(err) {
            retVal.reject(err);
        });

    return retVal.promise;
};

module.exports = Post;