var expect = require('expect.js'),
    Post = require('../models/db/post.js');

describe('Post helper test suite', function() {
    it('should strip generic words, special chars from a title', function() {
        var title = '"What do you mean my uniform\'s cute? You must be cray cray!" [Original]',
            keywords = 'uniform cute cray original';
        expect(Post.getKeywords(title)).to.be(keywords);
    });
});