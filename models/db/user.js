var _ = require('underscore'),
    defer = require('q').defer,
    Dal = require('../../lib/dal.js'),
    User = function(obj) {
        if (_.isObject(obj)) {
            User.copyRowFromDb(this, obj);
        }
    };

User.getByUserName = function(name) {
    var retVal = defer();

    User
        .query([{ col: 'name', val: name }])
        .then(function(rows) {
            if (rows.length === 0) {
                // create user
                retVal.resolve(0);
            } else {
                retVal.resolve(parseInt(rows[0].id, 10));
            }
        })
        .fail(function(err) {
            retVal.reject(err);
        });

    return retVal.promise;
};

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

_.extend(User, Dal);

module.exports = User;