var _ = require('underscore'),
    Image = require('../models/db/image.js'),

    ENTRIES_PER_PAGE = 5;

module.exports = function(app, request, response) {

    var image = Image.query(
        [ { col: 'postId', val: '15' } ],
        { postId: 'DESC' },
        10
    ).then(function(rows) {
        console.log(rows);
    });

    response.end();

};