var expect = require('expect.js'),
    Mongo = require('../lib/mongo.js');

describe('mongo test suite', function() {

    var id = (new Date()).getTime(),
        title = 'This is a sketch',
        subtitle = 'Yes it is',
        docsInserted = 0,

        fail = function(err) {
            console.log(err);
            expect(false).to.be.ok();
        };

    it('should insert a document', function(done) {
        Mongo.save('test', { id: id, title: title, subtitle: subtitle }).then(function(result) {
            expect(true).to.be.ok();
            docsInserted++;
            done();
        }).fail(fail);
    });

    it('should find the inserted document', function(done) {
        Mongo.find('test', { id: id }).then(function(result) {
            expect(result.length).to.be(1);
            expect(result[0].title).to.be(title);
            expect(result[0].subtitle).to.be(subtitle);
            done();
        }).fail(fail);
    });

    it('should sort multiple documents', function(done) {
        Mongo.save('test', { id: id + 10 }).then(function() {
            docsInserted++;
            Mongo.find('test', {}, { id: -1 }).then(function(results) {
                expect(results.length).to.be(2);
                expect(results[0].id).to.be(id + 10);
                done();
            });
        }).fail(fail);
    });

    it('should limit the number of documents returned', function(done) {
        Mongo.find('test', {}, null, 1).then(function(results) {
            expect(results.length).to.be(1);
            done();
        }).fail(fail);
    });

    it('should return the last result of the set', function(done) {
        Mongo.find('test', {}, { id: -1 }, 1, 1).then(function(results) {
            expect(results.length).to.be(1);
            expect(results[0].id).to.be(id);
            done();
        }).fail(fail);
    });

    it('should remove all documents', function(done) {
        Mongo.remove('test').then(function(result) {
            expect(result).to.be(docsInserted);
            done();
        }).fail(fail);
    });

});