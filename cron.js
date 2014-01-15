global._db = require('./lib/db.js');
var _ = require('underscore'),
    Source = require('./models/db/source.js'),
    Post = require('./models/db/post.js'),
    Image = require('./models/db/image.js'),
    reddit = require('./lib/reddit.js'),

    /**
     * Constants
     */
    ACTION_UPDATE = 'update',
    ACTION_CREATE = 'create',

    // Queue of things to act upon
    actionQueue = [],

    /**
     * Retrieves reddit data for later updates
     */
    getRedditData = function() {

        Source.query([ { col: 'enabled', val: true }, { col: 'type', val: 'subreddit' } ]).then(function(rows) {

            _.each(rows, function(source) {

                reddit
                    .getDataListing(source.name)
                    .then(function(data) {
                        
                        if (_.has(data, 'data') && _.has(data.data, 'children')) {
                            _.each(data.data.children, function(post) {
                                Post
                                    .createFromRedditPost(post.data)
                                    .then(function(post) {
                                        
                                        // Check for an existing post with this reddit ID
                                        Post.query([ { col: 'externalId', val: post.externalId } ]).then(function(row) {
                                            if (!row.length) {
                                                post.sync().then(function() {
                                                    actionQueue.push({ action:ACTION_CREATE, data:post });
                                                });
                                            } else {
                                                actionQueue.push({ 
                                                    action:ACTION_UPDATE,
                                                    data:{
                                                        post: post,
                                                        row: row[0]
                                                    }
                                                });
                                            }
                                        });

                                    })
                                    .fail(function(err) {
                                        console.log(err);
                                    });
                            });
                        }

                    });

            });

        });
    
    },

    /**
     * Acts on items in the action Queue
     */
    queueRunner = function() {

        while (actionQueue.length > 0) {

            var item = actionQueue.shift();
            switch (item.action) {
                case ACTION_CREATE:
                case ACTION_UPDATE:
                    // Update the database
                    item.data.post.id = item.data.row.id;
                    item.data.row.sync();
                    break;
            }

        }

        // Revisit in a couple seconds
        setTimeout(queueRunner, 2000);

    };

getRedditData();
queueRunner();