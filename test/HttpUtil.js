var HttpUtil = require('../lib/HttpUtil.js'),
    expect = require('expect.js');

describe('HttpUtil test suite', function() {
    it('should return the file\'s contents', function(done) {
        HttpUtil.get('http://zombo.com/').then(function(data) {
            data = data.toString();
            expect(data.indexOf('ZOMBO')).to.not.be(-1);
            done();
        });
    });
});