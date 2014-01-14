var _ = require('underscore'),
    defer = require('q').defer,
    util = require('util'),
    Dal = require('../../lib/dal.js'),
    User = function(obj) {
        if (_.isObject(obj)) {
            User.copyRowFromDb(this, obj);
        }
    };

// Inherit Dal
util.inherits(User, Dal);
_.extend(User, Dal);

// Database mapping
User._dbTable = 'users';
User._primaryKey = 'id';
User._dbMap = {
    id: 'user_id',
    name: 'user_name',
    redditId: 'user_reddit_id',
    token: 'user_token',
    dateCreated: 'user_date_created',
    linkKarma: 'user_link_karma',
    commentKarma: 'user_comment_karma',
    hasAvatar: 'user_avatar'
};

/**
 * Looks up the user in the database and returns it.
 * If not found, the record is created and returned
 */
User.getByUserName = function(name) {
    var retVal = defer();

    User
        .query([{ col: 'name', val: name }])
        .then(function(rows) {
            if (rows.length === 0) {
                var user = new User();
                user.name = name;
                user.sync().then(function() {
                    retVal.resolve(user.id);
                });
            } else {
                retVal.resolve(parseInt(rows[0].id, 10));
            }
        })
        .fail(function(err) {
            retVal.reject(err);
        });

    return retVal.promise;
};

module.exports = User;