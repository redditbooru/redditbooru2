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

        it('should resolve an imgur album to an array of images', function(done) {
            ImageResolver.getImageListFromUrl('http://imgur.com/a/hiwIT').then(function(images) {
                expect(images.length).to.be(13);
                done();
            });
        });

    });

});