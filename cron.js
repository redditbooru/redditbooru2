global._db = require('./lib/db.js');
var _ = require('underscore'),
    Source = require('./models/db/source.js'),
    Post = require('./models/db/post.js'),
    Image = require('./models/db/image.js'),
    ImagePost = require('./models/db/postimage.js'),
    Item = require('./models/cache/item.js'),
    reddit = require('./lib/reddit.js'),
    ImageResolver = require('./lib/ImageResolver.js'),
    mongo = require('./lib/mongo.js');

    /**
     * Constants
     */
    ACTION_UPDATE = 'update',
    ACTION_CREATE = 'create',
    TIMEOUT_GET_DATA = 60000, // Fetch reddit data once every minute
    TIMEOUT_RUN_QUEUE = 5000, // Queue should be checked every five seconds

    // Queue of things to act upon
    actionQueue = [],

    /**
     * Retrieves reddit data for later updates
     */
    getSourcesData = function() {

        Source.query([ { col: 'enabled', val: true }, { col: 'type', val: 'subreddit' } ]).then(function(rows) {

            _.each(rows, function(source) {

                getRedditData(source.name + '/new', source);
                getRedditData(source.name + '/top/', source, 'all');

            });

        });

        setTimeout(getSourcesData, TIMEOUT_GET_DATA);

    },

    getRedditData = function(subreddit, source, period) {
        console.log(' -- Getting post data for ' + subreddit + ' -- ');

        reddit
            .getDataListing(subreddit, 100, period)
            .then(function(data) {

                console.log(' -- Finished fetching data for ' + subreddit + ' -- ');

                if (_.has(data, 'data') && _.has(data.data, 'children')) {
                    _.each(data.data.children, function(post) {
                        Post
                            .createFromRedditPost(post.data)
                            .then(function(post) {

                                // Check for an existing post with this reddit ID
                                Post.query([ { col: 'externalId', val: post.externalId } ]).then(function(row) {
                                    if (!row.length) {
                                        console.log('[  NEW  ] ' + post.title);
                                        post.sourceId = source.id;
                                        actionQueue.push({ action:ACTION_CREATE, data:post });
                                    } else {
                                        console.log('[UPDATED] ' + post.title);
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
    },

    assignImageToPost = function(postId, imageId, logHead) {
        (new ImagePost({ post_id: postId, image_id: imageId })).sync().then(function(result) {
            console.log(logHead + 'Image ' + imageId + ' assigned successfully');
        }).fail(function(err) {
            console.log(logHead + 'Error syncing image relationship for ' + imageId + ': ' + err);
        });
    },

    /**
     * Acts on items in the action Queue
     */
    queueRunner = function() {
        console.log('-- Processing queue (' + actionQueue.length + ' items) --');
        while (actionQueue.length > 0) {

            var item = actionQueue.shift(),
                logHead;
            switch (item.action) {
                case ACTION_CREATE:
                    logHead = '[' + item.data.externalId + '] ';
                    console.log(logHead + 'Inserting into database');
                    item.data.sync().then(function(post) {
                        ImageResolver.getImageListFromUrl(post.link).then(function(images) {
                            _.each(images, function(url) {
                                // Check to see if this image has been loaded already. We want to avoid dupes
                                Image.query([ { col: 'url', val: url } ]).then(function(result) {
                                    var imageObj = null;
                                    if (0 === result.length) {
                                        Image.createFromUrl(url).then(function(image) {
                                            console.log(logHead + 'Image ' + url + ' loaded and processed');
                                            image.sync().then(function(image) {
                                                console.log(logHead + 'Image ' + url + ' synced to database with ID ' + image.id);

                                                // Assign the image to the post
                                                assignImageToPost(post.id, image.id, logHead);

                                                // Create the cache item
                                                var item = Item.createItem(post, image);
                                                mongo.save('posts', item).then(function(result) {
                                                    console.log(logHead + 'Cache item created for ' + image.id);
                                                }).fail(function(err) {
                                                    console.log(logHead + 'Error syncing image to mongo cache: ' + err);
                                                });
                                            });
                                        }).fail(function(err) {
                                            console.log(logHead + 'Error creating image from ' + url);
                                        });
                                    } else {
                                        console.log(logHead + 'Image repurposed from ' + result[0].id);
                                        assignImageToPost(post.id, result[0].id, logHead);
                                    }

                                }).fail(function(err) {
                                    console.log(logHead + 'Error looking up image URL ' + url + ': ' + err);
                                });
                            });
                        });
                    }).fail(function(err) {
                        console.log(logHead + 'Error creating post: ' + err);
                    });
                    break;
                case ACTION_UPDATE:
                    // Update the database
                    item.data.post.id = item.data.row.id;
                    item.data.row.sync();
                    break;
            }

        }

        // Revisit in a couple seconds
        setTimeout(queueRunner, TIMEOUT_RUN_QUEUE);

    };

getSourcesData();
queueRunner();