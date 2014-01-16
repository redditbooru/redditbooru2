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

    it('should download with faked referer', function(done) {
        HttpUtil.get('http://i1.pixiv.net/img125/img/komone_ushio/37592434_m.jpg', true).then(function(data) {
            expect(data).to.not.be(null);
            done();
        }).fail(function() {
            expect(false).to.be(true);
        });
    });

});