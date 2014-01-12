global._db = require('./lib/db.js');
var _ = require('underscore'),
    Source = require('./models/db/source.js'),
    Post = require('./models/db/post.js'),
    Image = require('./models/db/image.js'),
    reddit = require('./lib/reddit.js');

Source.query([ { col: 'enabled', val: true }, { col: 'type', val: 'subreddit' } ]).then(function(rows) {

    _.each(rows, function(source) {

        reddit
            .getDataListing(source.name)
            .then(function(data) {
                
                if (_.has(data, 'data') && _.has(data.data, 'children')) {
                    _.each(data.data.children, function(post) {
                        Post
                            .createFromRedditPost(post.data)
                            .then(function(blah) {
                                console.log(blah);
                            })
                            .fail(function(err) {
                                console.log(err);
                            });
                    });
                }

            });

    });

});