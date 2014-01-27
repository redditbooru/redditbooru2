global._db = require('../lib/db.js');
var expect = require('expect.js'),
    Image = require('../models/db/image');

describe('Image test suite', function() {
    it('should get similar images', function(done) {
        Image.queryByImage({
            imageUrl: 'http://i.imgur.com/TX487hA.jpg',
            sources: [ 1, 2 ],
            limit: 10
        }).then(function(results) {
            console.log(results);
            done();
        }).fail(function(err) {
            console.log(err);
            done();
        });
    });
});