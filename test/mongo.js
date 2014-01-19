var expect = require('expect.js'),
    Mongo = require('../lib/mongo.js');

describe('mongo test suite', function() {

    var id = (new Date()).getTime(),
        title = 'This is a sketch',
        subtitle = 'Yes it is';

    it('should insert a document', function(done) {
        Mongo.sync('test', { id: id, title: title, subtitle: subtitle }).then(function(result) {
            expect(true).to.be.ok();
            done();
        }).fail(function(err) {
            console.log(err);
            expect(false).to.be.ok();
            done();
        });
    });

    it('should find the inserted document', function(done) {
        Mongo.find('test', { id: id }).then(function(result) {
            expect(result.length).to.be(1);
            expect(result[0].title).to.be(title);
            expect(result[0].subtitle).to.be(subtitle);
            done();
        });
    });

});