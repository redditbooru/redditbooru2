var _ = require('underscore'),
    Source = require('../models/db/source'),
    Item = require('../models/cache/item'),
    Response = require('../lib/Response');

    ENTRIES_PER_PAGE = 5;

module.exports = function(req, res) {
    var response = new Response(req, res);
    Source.query([ { col: 'enabled', val: true }, { col: 'type', val: 'subreddit' } ]).then(function(sources) {
        Item.query({ sources: [ 1 ] }).then(function(images) {
            response.render('index', { sources: sources, images: JSON.stringify(images) });
        });
    });

};