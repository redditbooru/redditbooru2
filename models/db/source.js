var _ = require('underscore'),
    util = require('util'),
    Dal = require('../../lib/dal.js'),
    Source = function(obj) {
        if (_.isObject(obj)) {
            Source.copyRowFromDb(this, obj);
        }
    };

// Database mapping
Source._dbTable = 'sources';
Source._primaryKey = 'id';
Source._dbMap = {
    id: 'source_id',
    name: 'source_name',
    baseUrl: 'source_baseurl',
    type: 'source_type',
    enabled: 'source_enabled',
    subdomain: 'source_subdomain',
    contentRating: 'source_content_rating'
};

_.extend(Source, Dal);

module.exports = Source;