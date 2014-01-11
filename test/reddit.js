var assert = require('assert'),
    reddit = require('../lib/reddit.js');

describe('reddit lib', function() {
    describe('getDataListing', function() {
        it('should return an object', function(done) {
            reddit
                .getDataListing('r/awwnime')
                .then(function(data) {
                    assert.equal('object', typeof data);
                    done();
                })
                .fail(function() {
                    assert.fail('object', 'fail');
                    done();
                });
        });

        it('should return failure', function(done) {
            reddit
                .getDataListing('http://www.google.com/?q=lkajsdf983251230-9,,,34l3.&&&???@@@93%%45%^*(*#@#!)%&#$(*)$@%<>[]###f;d\\\%2')
                .fail(function() {
                    assert.ok(true);
                    done();
                });
        });

    });
});