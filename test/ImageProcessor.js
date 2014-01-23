var ImageProcessor = require('../lib/ImageProcessor.js'),
    expect = require('expect.js');

describe('ImageProcessor test suite', function() {
    it('getFileExtensionFromBuffer', function() {
        var pngBuffer = new Buffer([ 0x89, 0x50, 0x4e, 0x47 ]),
            jpegBuffer = new Buffer([ 0xff, 0xd8 ]),
            gif89Buffer = new Buffer('GIF89a'),
            gif87Buffer = new Buffer('GIF87a'),
            nonImageBuffer = new Buffer('ID3');

        expect(ImageProcessor.getFileExtensionFromBuffer(pngBuffer)).to.be('png');
        expect(ImageProcessor.getFileExtensionFromBuffer(jpegBuffer)).to.be('jpg');
        expect(ImageProcessor.getFileExtensionFromBuffer(gif89Buffer)).to.be('gif');
        expect(ImageProcessor.getFileExtensionFromBuffer(gif87Buffer)).to.be('gif');
        expect(ImageProcessor.getFileExtensionFromBuffer(nonImageBuffer)).to.not.be.ok();

    });
});