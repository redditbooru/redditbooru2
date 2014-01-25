var _ = require('underscore'),
    mongo = require('../../lib/mongo.js'),

    DEFAULT_QUERY = {
        limit: 25,
        keywords: null,
        sources: null,
        sort: 'date',
        offset: 0,
        nsfw: false,
        minDate: null,
        maxDate: null
    },

    Item = {

        createItem: function(post, image) {
            return {
                postId: post.id,
                imageId: image.id,
                sourceId: post.sourceId,
                title: post.title,
                keywords: post.keywords,
                link: post.link,
                redditId: post.externalId,
                score: post.score,
                date: post.dateCreated,
                nsfw: post.nsfw,
                width: image.width,
                height: image.height
            };
        },

        query: function(options) {
            var query = {},
                sort = {};
            options = _.defaults(options || {}, DEFAULT_QUERY);

            if (options.keywords) {
                query.keywords = new RegExp('\\b(' + options.keywords.split(' ').join('|') + ')\\b', 'i');
            }

            if (options.sources) {
                if (_.isArray(options.sources)) {
                    query.sourceId = { $in: options.sources };
                } else if (_.isNumber(options.sources)) {
                    query.sourceId = options.sources;
                } else if (_.isString(options.sources)) {
                    options.sources = options.sources.split(',');
                    for (var i = 0, count = options.sources.length; i < count; i++) {
                        options.sources[i] = parseInt(options.sources[i]);
                    }
                    query.sourceId = { $in: options.sources };
                }
            }

            if (options.minDate || options.maxDate) {
                query.date = {};
                if (options.minDate) {
                    query.date.$gte = options.minDate;
                }
                if (options.maxDate) {
                    query.date.$lte = options.maxDate;
                }
            }

            sort[options.sort] = -1;

            return mongo.find('posts', query, sort, options.limit, options.offset);
        }

    };

module.exports = Item;