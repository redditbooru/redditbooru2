/**
 * Resolves a URL to a list of images depending on the
 * source provider
 */
var http = require('http'),
    _ = require('underscore'),
    urlParse = require('url').parse,
    HttpUtil = require('./HttpUtil.js'),
    defer = require('q').defer,

    urlMatcher = {
        IMGUR_ALBUM: /(a|gallery)\/([\w]+)/i,
        MINUS_ALBUM: /([\w]+\.)?minus.com\/([^\.])+$/i,
        TUMBLR_POST: /\/post\/([\d]+)\//
    },

    ImageResolver = {

        /**
         * Determins the image service and returns an array of URLs
         */
        getImageListFromUrl: function(url) {
            var urlInfo = urlParse(url),
                retVal;
            
            switch (urlInfo.hostname) {
                case 'i.imgur.com':
                case 'imgur.com':
                    retVal = ImageResolver.handleImgurLink(url);
                    break;
                case 'mediacru.sh':
                    break;
                case 'tumblr.com':
                    break;
                case 'minus.com':
                    break;
                
                // If there are no special handlers, just pass the URL back
                default:
                    retVal = defer();
                    retVal.resolve([ url ]);
                    retVal = retVal.promise;
                    break;
            }

            return retVal;
        },

        /**
         * Resolves imgur links to an image link or album
         */
        handleImgurLink: function(url) {
            var retVal = defer(),
                urlInfo = urlParse(url),
                result;

            // Check for an album
            if (urlMatcher.IMGUR_ALBUM.test(urlInfo.path)) {
                return ImageResolver.getImgurAlbum(url);
            } else if (urlInfo.path.indexOf(',') !== -1) {
                result = urlInfo.path.substr(1).split(',');
                for (var i = 0, count = result.length; i < count; i++) {
                    result[i] = 'http://imgur.com/' + result[i] + '.jpg';
                }
                retVal.resolve(result);
            } else {
                result = urlParse(url);
                if (result.path.indexOf('.') === -1) {
                    retVal.resolve([ url + '.jpg' ]);
                }
            }

            return retVal.promise;
        },

        /**
         * Gets a list of images in an imgur album
         */
        getImgurAlbum: function(url) {
            var retVal = defer(),
                result = urlMatcher.IMGUR_ALBUM.exec(url);

            if (result) {
                HttpUtil.get('http://api.imgur.com/2/album/' + result[2] + '.json')
                    .then(function(data) {
                        try {
                            var response = [];
                            data = JSON.parse(data.toString());
                            if (_.has(data, 'album') && _.has(data.album, 'images')) {
                                _.each(data.album.images, function(image) {
                                    response.push(image.links.original);
                                });
                                retVal.resolve(response);
                            } else {
                                retVal.reject(new Error('Invalid album'));
                            }
                        } catch (err) {
                            retVal.reject(err);
                        }
                    })
                    .fail(function(error) {
                        retVal.reject(error);
                    });
            } else {
                retVal.fail(new Error('Invalid album link'));
            }

            return retVal.promise;
        },

        /**
         * Handles mediacru.sh hosted media
         */
        getMediacrushImages: function(url) {
            var retVal = defer();
            return retVal.promise;
        },

        /**
         * Handles tumblr media
         */
        getTumblrImages: function(url) {
            var retVal = defer();
            return retVal.promise;
        },

        /**
         * Gets images from a minus album
         */
        getMinusAlbum: function(url) {
            var retVal = defer();
            return retVal.promise;
        }

    };

module.exports = ImageResolver;