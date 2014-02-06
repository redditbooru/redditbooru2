var _ = require('underscore'),
    mongo = require('../../lib/mongo.js'),
    ImageResolver = require('../../lib/ImageResolver'),

    DEFAULT_QUERY = {
        limit: 25,
        keywords: null,
        sources: null,
        sort: 'dateCreated',
        offset: 0,
        nsfw: false,
        minDate: null,
        maxDate: null,
        afterDate: null,
        user: null,
        externalId: null,
        postId: null,
        imageId: null,
        afterId: null
    },

    Item = {

        createItem: function(post, image, source, author) {
            return {
                postId: post.id,
                imageId: image.id,
                sourceId: post.sourceId,
                sourceName: source.name,
                baseUrl: source.baseUrl,
                userId: post.userId,
                userName: author,
                title: post.title,
                keywords: post.keywords,
                cdnUrl: image.cdnUrl,
                redditId: post.externalId,
                score: post.score,
                dateCreated: post.dateCreated,
                nsfw: post.nsfw,
                width: image.width,
                height: image.height,
                thumbUrl: ImageResolver.getThumbUrl(image.cdnUrl)
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

            // Old API backwards compatibility
            options.maxDate = options.afterDate ? options.afterDate : options.maxDate;
            if (options.minDate || options.maxDate) {
                query.dateCreated = {};
                if (options.minDate) {
                    query.dateCreated.$gt = parseInt(options.minDate);
                }
                if (options.maxDate) {
                    query.dateCreated.$lt = parseInt(options.maxDate);
                }
            }

            if (_.isArray(options.imageId)) {
                query.imageId = { $in: options.imageId };
            } else if (options.imageId) {
                query.imageId = parseInt(options.imageId);
            }

            if (options.postId) {
                query.postId = parseInt(options.postId);
            }

            if (options.externalId) {
                query.externalId = options.externalId;
            }

            if (options.user) {
                query.userName = options.user;
            }

            if (options.afterId) {
                query.afterId = { $lt: options.afterId };
            }

            sort[options.sort] = -1;

            return mongo.find('posts', query, sort, options.limit, options.offset);
        }

    };

module.exports = Item;