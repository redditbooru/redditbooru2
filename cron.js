global._db = require('./lib/db.js');
var _ = require('underscore'),
    Source = require('./models/db/source.js'),
    Post = require('./models/db/post.js'),
    Image = require('./models/db/image.js'),
    ImagePost = require('./models/db/postimage.js'),
    Item = require('./models/cache/item.js'),
    reddit = require('./lib/reddit.js'),
    ImageResolver = require('./lib/ImageResolver.js'),
    mongo = require('./lib/mongo.js'),

    /**
     * Constants
     */
    ACTION_UPDATE = 'update',
    ACTION_CREATE = 'create',
    ACTION_GET_DATA = 'getData',
    TIMEOUT_GET_DATA = 60000, // Fetch reddit data once every two minutes
    TIMEOUT_GET_DATA_SHORT = 5000, // Amount of milliseconds to wait for the queue to ease up
    TIMEOUT_RUN_QUEUE = 100, // Queue should be checked every tenth of a second
    MAX_ACTIVE_ITEMS = 100, // Maximum number of items allowed to be in an active state before the queue can advance
    UPDATE_TIME_THRESHOLD = 600, // Maximum number of seconds to wait before updating a post
    UPDATE_SCORE_THRESHOLD = 10, // Score difference to kick off post update

    // Queue of things to act upon
    actionQueue = [],
    activeItems = 0,

    logActionComplete = function(logHead, message) {
        console.log(logHead + ' ' + message);
        activeItems--;
    },

    /**
     * Retrieves reddit data for later updates
     */
    getSourcesData = function() {

        activeItems++;
        Source.query([ { col: 'enabled', val: true }, { col: 'type', val: 'subreddit' } ]).then(function(rows) {
            logActionComplete('[main]', 'Finished retrieving list of active subs');
            _.each(rows, function(source) {

                // Throw the update into the queue
                actionQueue.push({
                    action: ACTION_GET_DATA,
                    data: {
                        source: source,
                        endpoint: source.name + '/new/'
                    }
                });

            });

        }).fail(function(err) {
            logActionComplete('[main]', 'Unable to get active subs: ' + err);
        });

        setTimeout(getSourcesData, TIMEOUT_GET_DATA);

    },

    getRedditData = function(subreddit, source, period) {
        var logHead = '[reddit/' + subreddit + ']';
        console.log(' -- Getting post data for ' + subreddit + ' -- ');

        activeItems++;
        reddit
            .getDataListing(subreddit, 100, period)
            .then(function(data) {

                logActionComplete(logHead, 'Finished fetching data for ' + subreddit);

                if (_.has(data, 'data') && _.has(data.data, 'children')) {
                    _.each(data.data.children, function(post) {
                        Post
                            .createFromRedditPost(post.data)
                            .then(function(post) {

                                // Check for an existing post with this reddit ID
                                activeItems++;
                                Post.query([ { col: 'externalId', val: post.externalId } ]).then(function(row) {
                                    if (!row.length) {
                                        logActionComplete(logHead, 'New post: ' + post.title + ' (' + post.externalId + ')');
                                        console.log('[  NEW  ] ' + post.title);
                                        post.sourceId = source.id;
                                        actionQueue.push({ action:ACTION_CREATE, data:post });
                                    } else {
                                        logActionComplete(logHead, 'Old post: ' + post.title + ' (' + post.externalId + ')');
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
                                logActionComplete(logHead, 'Error creating post from reddit data: ' + err);
                            });
                    });
                }

            }).fail(function(err) {
                logActionComplete(logHead, 'Unable to retrieve sub data: ' + err);
            });
    },

    assignImageToPost = function(postId, imageId, logHead) {
        activeItems++;
        (new ImagePost({ post_id: postId, image_id: imageId })).sync().then(function(result) {
            logActionComplete(logHead, 'Image ' + imageId + ' assigned successfully');
        }).fail(function(err) {
            logActionComplete(logHead, 'Error syncing image relationship for ' + imageId + ': ' + err);
        });
    },

    createPostEntry = function(item, logHead) {
        console.log(logHead + 'Inserting into database');
        activeItems++;
        item.data.sync().then(function(post) {
            logActionComplete(logHead, 'Insert succeeded. Resolving link to images');
            activeItems++;
            ImageResolver.getImageListFromUrl(post.link).then(function(images) {
                logActionComplete(logHead, '"' + post.link + '" resolved to ' + images.length + ' images');
                _.each(images, function(url) {
                    // Check to see if this image has been loaded already. We want to avoid dupes
                    activeItems++;
                    Image.query([ { col: 'url', val: url } ]).then(function(result) {
                        var imageObj = null;
                        if (!result.length) {
                            logActionComplete(logHead, 'Retrieving new image ' + url);
                            activeItems++;
                            Image.createFromUrl(url).then(function(image) {
                                logActionComplete(logHead, 'Image ' + url + ' loaded and processed');
                                activeItems++;
                                image.sync().then(function(image) {
                                    logActionComplete(logHead, 'Image ' + url + ' synced to database with ID ' + image.id);

                                    // Assign the image to the post
                                    assignImageToPost(post.id, image.id, logHead);

                                    // Create the cache item
                                    var item = Item.createItem(post, image);
                                    activeItems++;
                                    mongo.save('posts', item).then(function(result) {
                                        logActionComplete(logHead, 'Cache item created for ' + image.id);
                                    }).fail(function(err) {
                                        logActionComplete(logHead, 'Error syncing image to mongo cache: ' + err);
                                    });
                                }).fail(function(err) {
                                    logActionComplete(logHead, 'Unable to sync image: ' + err);
                                });
                            }).fail(function(err) {
                                logActionComplete(logHead, 'Error creating image from ' + url);
                            });
                        } else {
                            logActionComplete(logHead, 'Image repurposed from ' + result[0].id);
                            assignImageToPost(post.id, result[0].id, logHead);
                        }

                    }).fail(function(err) {
                        logActionComplete(logHead, 'Error looking up image URL ' + url + ': ' + err);
                    });
                });
            }).fail(function(err) {
                logActionComplete(logHead, 'Unable to get information for URL "' + post.link + '": ' + err);
            });
        }).fail(function(err) {
            logActionComplete(logHead, 'Error creating post: ' + err);
        });
    },

    updatePostEntry = function(item, logHead) {
        var time = Math.round(Date.now() / 1000);
        if (Math.abs(item.data.row.score - item.data.post.score) > UPDATE_SCORE_THRESHOLD || time > item.data.row.dateUpdated + UPDATE_TIME_THRESHOLD) {
            console.log(logHead + ' Updating existing item');
            item.data.row.score = item.data.post.score;
            item.data.row.dateUpdated = time;
            activeItems++;
            item.data.row.sync().then(function(result) {
                logActionComplete(logHead, 'Post updated');
            }).fail(function(err) {
                logActionComplete(logHead, 'Error updating post: ' + err);
            });
        }
    },

    /**
     * Acts on items in the action Queue
     */
    queueRunner = function() {
        if (actionQueue.length != 0 || activeItems != 0) {
            console.log('-- Processing queue (' + actionQueue.length + ' items, ' + activeItems + ' active) --');
        }
        while (actionQueue.length > 0 && activeItems < MAX_ACTIVE_ITEMS) {

            var item = actionQueue.shift();
            switch (item.action) {
                case ACTION_GET_DATA:
                    getRedditData(item.data.endpoint, item.data.source);
                    break;
                case ACTION_CREATE:
                    createPostEntry(item, '[' + item.data.externalId + '] ');
                    break;
                case ACTION_UPDATE:
                    // Update the database
                    updatePostEntry(item, '[' + item.data.post.externalId + ']');
                    break;
            }

        }

        // Revisit in a couple seconds
        setTimeout(queueRunner, TIMEOUT_RUN_QUEUE);

    };

getSourcesData();
queueRunner();