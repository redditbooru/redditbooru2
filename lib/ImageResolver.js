/**
 * Resolves a URL to a list of images depending on the
 * source provider
 */
var http = require('http'),
    _ = require('underscore'),
    urlParse = require('url').parse,
    HttpUtil = require('./HttpUtil.js'),
    defer = require('q').defer,
    config = require('../config.js').IMAGE_RESOLVER,

    urlMatcher = {
        IMGUR_ALBUM: /(a|gallery)\/([\w]+)/i,
        MINUS_ALBUM: /([\w]+\.)?(minus.com|min.us)\/([^\.]+)$/i,
        TUMBLR_POST: /\/post\/([\d]+)\//,
        YANDERE_IMAGE: /original-file-changed\" href=\"([^\"]+)\"/
    },

    ImageResolver = {

        /**
         * Determins the image service and returns an array of URLs
         */
        getImageListFromUrl: function(url) {
            var urlInfo = urlParse(url),
                retVal,
                baseDomain = '';

            if (urlInfo) {
                // Strip off the subdomains
                baseDomain = urlInfo.hostname.split('.');
                baseDomain = baseDomain[baseDomain.length - 2] + '.' + baseDomain[baseDomain.length - 1];
                switch (baseDomain) {
                    case 'imgur.com':
                        retVal = ImageResolver.handleImgurLink(url, urlInfo);
                        break;
                    case 'mediacru.sh':
                        retVal = ImageResolver.getMediacrushImages(url);
                        break;
                    case 'tumblr.com':
                        retVal = ImageResolver.getTumblrImages(url, urlInfo);
                        break;
                    case 'yande.re':
                        retVal = ImageResolver.getYandereImage(url);
                        break;
                    case 'min.us':
                    case 'minus.com':
                        retVal = ImageResolver.getMinusAlbum(url, urlInfo);
                        break;
                    
                    // If there are no special handlers, just pass the URL back
                    default:
                        retVal = defer();
                        retVal.resolve([ url ]);
                        retVal = retVal.promise;
                        break;
                }
            } else {
                retVal = defer();
                retVal.reject(new Error('Invalid URL'));
                retVal = retVal.promise;
            }

            return retVal;
        },

        /**
         * Resolves imgur links to an image link or album
         */
        handleImgurLink: function(url, urlInfo) {
            var retVal = defer(),
                urlInfo = urlInfo || urlParse(url),
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

            HttpUtil
                .get(url + '.json')
                .then(function(data) {
                    try {
                        var obj = JSON.parse(data.toString()),
                            out = [],
                            baseUrl = 'http' + (url.indexOf('https') === 0 ? 's' : '') + '://mediacru.sh';

                        if (_.has(obj, 'files') && _.isArray(obj.files)) {
                            if (obj.files.length === 1) {
                                out.push(baseUrl + obj.original);
                            } else {
                                _.each(obj.files, function(file) {
                                    out.push(baseUrl + file.original);
                                });
                            }
                            retVal.resolve(out);
                        } else {
                            throw new Error('Invalid server response');
                            retVal.reject(err);
                        }
                    } catch (err) {
                        retVal.reject(err);
                    }
                })
                .fail(function(err) {
                    retVal.reject(err);
                });

            return retVal.promise;
        },

        /**
         * Handles tumblr media
         */
        getTumblrImages: function(url, urlInfo) {
            var retVal = defer(),
                urlParts = urlMatcher.TUMBLR_POST.exec(url),
                urlInfo = urlInfo || urlParse(url),
                out = [];

            if (urlParts) {
                HttpUtil.get('http://api.tumblr.com/v2/blog/' + urlInfo.hostname + '/posts?id=' + urlParts[1] + '&api_key=' + config.tumblrKey).then(function(data) {
                    try {
                        data = JSON.parse(data);
                        if (_.has(data, 'response')) {
                            _.each(data.response.posts[0].photos, function(photo) {
                                out.push(photo.original_size.url);
                            });
                            retVal.resolve(out)
                        }
                    } catch (err) {
                        retVal.reject(err);
                    }
                });
            } else {
                retVal.reject(new Error('Invalid URL'));
            }

            return retVal.promise;
        },

        /**
         * Gets an image from a yande.re post
         */
        getYandereImage: function(url) {
            var retVal = defer();
            HttpUtil.get(url).then(function(data) {
                var match = urlMatcher.YANDERE_IMAGE.exec(data.toString());
                if (match) {
                    retVal.resolve([ match[1] ]);
                } else {
                    retVal.reject(new Error('Invalid yande.re post'));
                }
            }).fail(function(err) {
                retVal.reject(err);
            });
            return retVal.promise;
        },

        /**
         * Gets images from a minus album
         */
        getMinusAlbum: function(url) {
            var retVal = defer(),
                match = urlMatcher.MINUS_ALBUM.exec(url);

            if (match) {
                HttpUtil.get('http://minus.com/' + match[3]).then(function(data) {
                    var source = data.toString(),
                        startTok = 'var gallerydata = ',
                        endTok = '};',
                        start = source.indexOf(startTok),
                        end = start !== -1 ? source.indexOf(endTok, start) + 1 : -1,
                        out = [];

                    if (-1 !== start) {
                        start += startTok.length;
                        data = source.substring(start, end);
                        try {
                            data = JSON.parse(data);
                            if (_.has(data, 'items')) {
                                _.each(data.items, function(item) {
                                    var ext = item.name.split('.');
                                    ext = ext[ext.length - 1];
                                    out.push('http://i.minus.com/i' + item.id + '.' + ext);
                                });
                                retVal.resolve(out);
                            } else {
                                retVal.reject(new Error('Invalid response'));
                            }
                        } catch (err) {
                            retVal.reject(err);
                        }
                    }

                }).fail(function(err) {
                    retVal.reject(err);
                });
            }

            return retVal.promise;
        }

    };

module.exports = ImageResolver;