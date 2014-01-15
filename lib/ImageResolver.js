/**
 * Resolves a URL to a list of images depending on the
 * source provider
 */
var http = require('http'),
    ImageResolver = {

        /**
         * Determins the image service and returns an array of URLs
         */
        getImageListFromUrl: function(url) {

        },

        /**
         * Resolves imgur links to an image link or album
         */
        handleImgurLink: function(url) {

        },

        /**
         * Gets a list of images in an imgur album
         */
        getImgurAlbum: function(url) {

        },

        /**
         * Handles mediacru.sh hosted media
         */
        getMediacrushImages: function(url) {

        },

        /**
         * Handles tumblr media
         */
        getTumblrImages: function(url) {

        },

        /**
         * Gets images from a minus album
         */
        getMinusAlbum: function(url) {

        }

    };

module.exports = ImageResolver;