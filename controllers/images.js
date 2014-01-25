var Item = require('../models/cache/item'),
    Response = require('../lib/Response');

exports.api = function(req, res) {
    var response = new Response(req, res),
        q = req.query,
        options = {
            keywords: q.keywords || null,
            sources: q.sources || 1, // default to awwnime; don't want to be serving up porn to everybody by default
            postId: q.postId || null,
            externalId: q.externalId || null,
            limit: q.limit || 25
        },
        retVal = null,
        start = Date.now();

    res.set('Content-Type', 'text/javascript');

    Item.query(options).then(function(results) {
        response.writeJSON(results, true);
    }).fail(function(err) {
        response.writeJSON({ err: true, msg: err }, true);
    });    
};