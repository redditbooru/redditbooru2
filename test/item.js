var expect = require('expect.js'),
    Item = require('../models/cache/item.js');

// TODO - don't rely on production data

describe('Item cache model test suite', function() {
    it('should return the 25 latest results', function(done) {
        Item.query().then(function(results) {
            expect(results.length).to.be(25);
            done();
        });
    });

    it('should find return only posts with keyword', function(done) {
        var keyword = 'madoka';
        Item.query({ keywords: keyword }).then(function(results) {
            expect(results.length).to.not.be(0);
            for (var i = 0, count = results.length; i < count; i++) {
                expect(results[i].keywords).to.contain(keyword);
            }
            done();
        });
    });

    it('should only return posts from a single source (number)', function(done) {
        Item.query({ sources: 1 }).then(function(results) {
            expect(results.length).to.not.be(0);
            for (var i = 0, count = results.length; i < count; i++) {
                expect(results[i].sourceId).to.be(1);
            }
            done();
        });
    });

    it('should return items from multiple sources (array)', function(done) {
        var sources = [ 15, 17 ];
        Item.query({ sources: sources }).then(function(results) {
            expect(results.length).to.not.be(0);
            for (var i = 0, count = results.length; i < count; i++) {
                expect(sources).to.contain(results[i].sourceId);
            }
            done();
        });
    });

    it('should return items from multiple sources (string)', function(done) {
        var sources = [ 15, 17 ];
        Item.query({ sources: sources.join(',') }).then(function(results) {
            expect(results.length).to.not.be(0);
            for (var i = 0, count = results.length; i < count; i++) {
                expect(sources).to.contain(results[i].sourceId);
            }
            done();
        });
    });

    it('should return items within date range', function(done) {
        var minDate = 1390521600,
            maxDate = minDate + 7200;
        Item.query({ minDate: minDate, maxDate: maxDate }).then(function(results) {
            expect(results.length).to.not.be(0);
            for (var i = 0, count = results.length; i < count; i++) {
                expect(results[i].date).to.be.within(minDate, maxDate);
            }
            done();
        });
    });

});