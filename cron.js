global._db = require('./lib/db.js');
var _ = require('underscore'),
    fs = require('fs'),

    Source = require('./models/db/source.js'),
    Post = require('./models/db/post.js'),
    Image = require('./models/db/image.js'),
    ImagePost = require('./models/db/postimage.js'),
    Item = require('./models/cache/item.js'),
    reddit = require('./lib/reddit.js'),
    ImageResolver = require('./lib/ImageResolver.js'),
    mongo = require('./lib/mongo.js'),
    QueueRunner = require('./lib/QueueRunner'),

    /**
     * Constants
     */
    ACTION_UPDATE = 'update',
    ACTION_CREATE = 'create',
    ACTION_GET_DATA = 'getData',
    TIMEOUT_GET_DATA = 60000, // Fetch reddit data once every two minutes
    TIMEOUT_GET_DATA_SHORT = 5000, // Amount of milliseconds to wait for the queue to ease up
    TIMEOUT_RUN_QUEUE = 100, // Queue should be checked every tenth of a second
    MAX_ACTIVE_ITEMS = 50, // Maximum number of items allowed to be in an active state before the queue can advance
    UPDATE_TIME_THRESHOLD = 600, // Maximum number of seconds to wait before updating a post
    UPDATE_SCORE_THRESHOLD = 10, // Score difference to kick off post update

    // The queue runner object
    queueRunner = null,
    async = null, // shorthand for queueRunner.async

    // This is a list of new items being worked on that can be used to save data integrity in case of a failure
    newPosts = [],

    _log = fs.createWriteStream('out.log', { flags:'a' }),

    log = function(logHead, message) {
        _log.write(logHead + ' ' + message + '\n');
        console.log(logHead + ' ' + message);
    },

    async = function(promise) {
        return queueRunner.async(promise);
    },

    /**
     * Retrieves reddit data for later updates
     */
    getSourcesData = function() {

        Source.query([ { col: 'enabled', val: true }, { col: 'type', val: 'subreddit' } ]).then(function(rows) {
            log('[main]', 'Finished retrieving list of active subs');
            _.each(rows, function(source) {

                // Throw the update into the queue
                queueRunner.add(ACTION_GET_DATA, {
                    source: source,
                    endpoint: source.name + '/new/'
                });

            });

        }).fail(function(err) {
            log('[main]', 'Unable to get active subs: ' + err);
        });

    },

    getRedditData = function(subreddit, source, period) {
        var logHead = '[reddit/' + subreddit + ']';
        log(logHead, 'Getting data from reddit');

        async(reddit.getDataListing(subreddit, 100, period)).then(function(data) {

            log(logHead, 'Finished fetching data for ' + subreddit);

            if (_.has(data, 'data') && _.has(data.data, 'children')) {
                _.each(data.data.children, function(post) {
                    var author = post.data.author;
                    async(Post.createFromRedditPost(post.data)).then(function(post) {

                        // Check for an existing post with this reddit ID
                        async(Post.query([ { col: 'externalId', val: post.externalId } ])).then(function(row) {
                            if (!row.length) {
                                log(logHead, 'New post: ' + post.title + ' (' + post.externalId + ')');
                                post.sourceId = source.id;
                                queueRunner.add(ACTION_CREATE, { post: post, source: source, author: author });
                            } else {
                                log(logHead, 'Old post: ' + post.title + ' (' + post.externalId + ')');
                                queueRunner.add(ACTION_UPDATE, { post: post, row: row[0] });
                            }
                        });

                    })
                    .fail(function(err) {
                        log(logHead, 'Error creating post from reddit data: ' + err);
                    });
                });
            }

        }).fail(function(err) {
            log(logHead, 'Unable to retrieve sub data: ' + err);
        });
    },

    assignImageToPost = function(postId, imageId, logHead) {
        async((new ImagePost({ post_id: postId, image_id: imageId })).sync()).then(function(result) {
            log(logHead, 'Image ' + imageId + ' assigned successfully');
        }).fail(function(err) {
            log(logHead, 'Error syncing image relationship for ' + imageId + ': ' + err);
        });
    },

    createPostEntry = function(item, logHead) {
        var source = item.data.source,
            author = item.data.author;
        item.data = item.data.post;
        log(logHead, 'Inserting into database');

        async(item.data.sync()).then(function(post) {
            log(logHead, 'Insert succeeded. Resolving link to images');
            async(ImageResolver.getImageListFromUrl(post.link)).then(function(images) {
                log(logHead, '"' + post.link + '" resolved to ' + images.length + ' images');
                _.each(images, function(url) {
                    // Check to see if this image has been loaded already. We want to avoid dupes
                    async(Image.query([ { col: 'url', val: url } ])).then(function(result) {
                        var imageObj = null;
                        if (!result.length) {
                            log(logHead, 'Retrieving new image ' + url);
                            async(Image.createFromUrl(url)).then(function(image) {
                                log(logHead, 'Image ' + url + ' loaded and processed');
                                async(image.sync()).then(function(image) {
                                    log(logHead, 'Image ' + url + ' synced to database with ID ' + image.id);

                                    // Assign the image to the post
                                    assignImageToPost(post.id, image.id, logHead);

                                    // Create the cache item
                                    var item = Item.createItem(post, image, source, author);
                                    async(mongo.save('posts', item)).then(function(result) {
                                        log(logHead, 'Cache item created for ' + image.id);
                                    }).fail(function(err) {
                                        log(logHead, 'Error syncing image to mongo cache: ' + err);
                                    });
                                }).fail(function(err) {
                                    log(logHead, 'Unable to sync image: ' + err);
                                });
                            }).fail(function(err) {
                                log(logHead, 'Error creating image from ' + url + ': ' + err);
                            });
                        } else {
                            log(logHead, 'Image repurposed from ' + result[0].id);
                            assignImageToPost(post.id, result[0].id, logHead);
                        }

                    }).fail(function(err) {
                        log(logHead, 'Error looking up image URL ' + url + ': ' + err);
                    });
                });
            }).fail(function(err) {
                log(logHead, 'Unable to get information for URL "' + post.link + '": ' + err);
            });
        }).fail(function(err) {
            log(logHead, 'Error creating post: ' + err);
        });
    },

    updatePostEntry = function(item, logHead) {
        var time = Math.round(Date.now() / 1000);
        if (Math.abs(item.data.row.score - item.data.post.score) > UPDATE_SCORE_THRESHOLD || time > item.data.row.dateUpdated + UPDATE_TIME_THRESHOLD) {
            log(logHead, ' Updating existing item');
            item.data.row.score = item.data.post.score;
            item.data.row.dateUpdated = time;
            item.data.row.keywords = item.data.post.keywords;

            async(item.data.row.sync()).then(function(result) {
                log(logHead, 'Post updated');
            }).fail(function(err) {
                log(logHead, 'Error updating post: ' + err);
            });
        }
    },

    /**
     * Acts on items in the action Queue
     */
    queueRunnerCallback = function(item) {

        switch (item.action) {
            case ACTION_GET_DATA:
                getRedditData(item.data.endpoint, item.data.source);
                break;
            case ACTION_CREATE:
                createPostEntry(item, '[' + item.data.post.externalId + '] ');
                break;
            case ACTION_UPDATE:
                // Update the database
                updatePostEntry(item, '[' + item.data.post.externalId + ']');
                break;
        }

    };

queueRunner = new QueueRunner({ delay: TIMEOUT_RUN_QUEUE, limiter: MAX_ACTIVE_ITEMS });
queueRunner.on('processItem', queueRunnerCallback);
queueRunner.on('queueEmpty', function() {
    process.exit();
});

getSourcesData();
queueRunner.start();

process.on('exit', function() {
    log('[main]', 'Shutting down');
    _log.close();
});

process.on('uncaughtException', function(err) {
    log('[main]', 'Uncaught exception');
    log('[main]', err.stack);
});