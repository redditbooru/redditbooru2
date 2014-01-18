var ImageResolver = require('../lib/ImageResolver.js'),
    expect = require('expect.js');

describe('ImageResolver test suite', function() {
   
    describe('imgur tests', function() {

        it('unassuming link should come back untouched', function(done) {
            var image = 'http://dxprog.com/myimage.png';
            ImageResolver.getImageListFromUrl(image).then(function(images) {
                expect(images.length).to.not.be(0);
                expect(images[0]).to.be(image);
                done();
            });
        });

        it('i.imgur.com should add .jpg to single image link', function(done) {
            ImageResolver.getImageListFromUrl('http://i.imgur.com/2dYfYlM').then(function(images) {
                expect(images.length).to.not.be(0);
                expect(images[0]).to.be('http://i.imgur.com/2dYfYlM.jpg');
                done();
            });
        });

        it('imgur.com should add .jpg to single image link', function(done) {
            ImageResolver.getImageListFromUrl('http://imgur.com/2dYfYlM').then(function(images) {
                expect(images.length).to.not.be(0);
                expect(images[0]).to.be('http://imgur.com/2dYfYlM.jpg');
                done();
            });
        });

        it('should return comma delimited imgur list as array of links', function(done) {
            ImageResolver.getImageListFromUrl('http://imgur.com/w8h6R,OEais,uiprU').then(function(images) {
                expect(images.length).to.be(3);
                expect(images[0]).to.be('http://imgur.com/w8h6R.jpg');
                expect(images[1]).to.be('http://imgur.com/OEais.jpg');
                expect(images[2]).to.be('http://imgur.com/uiprU.jpg');
                done();
            });
        });

        it('should resolve an imgur album to an array of URLs', function(done) {
            ImageResolver.getImageListFromUrl('http://imgur.com/a/hiwIT').then(function(images) {
                expect(images.length).to.be(13);
                // We'll randomly sample the images instead of testing all 13
                expect(images[0]).to.be('http://i.imgur.com/DppEJyE.jpg');
                expect(images[4]).to.be('http://i.imgur.com/ugRQAVk.jpg');
                expect(images[11]).to.be('http://i.imgur.com/xYmWQe6.jpg');
                done();
            }).fail(function(error) {
                expect(error).to.be(true);
                done();
            });
        });

    });

    describe('mediacru.sh tests', function() {
        it('should get a single image', function(done) {
            ImageResolver.getImageListFromUrl('https://mediacru.sh/uq82_GroAzNA').then(function(images) {
                expect(images.length).to.be(1);
                expect(images[0]).to.be('https://mediacru.sh/uq82_GroAzNA.png');
                done();
            });
        });
    });

    describe('tumblr tests', function() {
        it('should get images from the post', function(done) {
            ImageResolver.getImageListFromUrl('http://openhentai.tumblr.com/post/66312652243/i-think-she-should-be-renamed-to-sex-maniac-with').then(function(images) {
                expect(images.length).to.be(1);
                expect(images[0]).to.be('http://24.media.tumblr.com/51d2151753679b4b0aed3d82eb570650/tumblr_mvwzi3LtKo1r6e7z3o1_1280.jpg');
                done();
            });
        });
    });

});