var util = require('util'),
    Dal = require('../../lib/dal.js'),
    Post = function(db) {
        this.id = 0;
        this.sourceId = 0;
        this.userId = 0;
        this.externalId = '';
        this.dateCreated = 0;
        this.dateModified = 0;
        this.title = '';
        this.keywords = '';
        this.link = '';
        this.score = 0;
        this.processed = false;
        this.visible = false;
        this.meta = {};
        this._db = db;
    };

util.inherits(util, Dal);

module.exports = Post;