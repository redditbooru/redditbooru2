var defer = require('q').defer,
    _ = require('underscore'),
    db = global._db,
    Dal = function(copy) {
        if (typeof copy === 'object') {
            console.log(this._dbMap);
        }
    };

Dal.copyRowFromDb = function(obj, row) {
    var _map = _.invert(this._dbMap);
    _.each(row, _.bind(function(value, key) {
        if (_.has(_map, key)) {
            obj[_map[key]] = value;
        }
    }, this));
}

Dal.getById = function() {

};

Dal.query = function(conditions, sort, limit, offset) {
    var query = 'SELECT * FROM `' + this._dbTable + '`',
        where = [],
        qSort = [],
        params = {},
        promise = defer(),
        that = this;

    if (_.isArray(conditions)) {
        _.each(conditions, function(item) {
            var oper = item.oper || '=';
            if (_.has(that._dbMap, item.col)) {
                where.push('`' + that._dbMap[item.col] + '` ' + oper + ' :' + item.col);
                params[item.col] = item.val;
            }
        });
        query += ' WHERE ' + where.join(' AND ');
    }

    if (_.isObject(sort)) {
        _.each(sort, function(value, key) {
            if (_.has(that._dbMap, key)) {
                qSort.push('`' + that._dbMap[key] + '` ' + value);
            }
        });
        query += ' ORDER BY ' + qSort.join(', ');
    }

    if (_.isNumber(limit)) {
        query += ' LIMIT ' + limit;
        if (_.isNumber(offset)) {
            query += ', ' + offset;
        }
    }

    db
        .query(query, params)
        .then(function(rows) {
            var retVal = [];
            _.each(rows, function(item) {
                retVal.push(new that(item));
            });
            promise.resolve(retVal);
        })
        .fail(function(err) {
            promise.reject(err);
        });

    return promise.promise;

};

/**
 * Inserts or updates a record in the database
 */
Dal.prototype.sync = function(forceInsert) {

    var retVal = defer(),
        method = forceInsert || !this.id ? 'INSERT' : 'UPDATE',
        params = [],
        columns = [],
        query = '',
        classDef = this.constructor;

    _.each(classDef._dbMap, _.bind(function(col, prop) {
        if (this[prop] && prop !== classDef._dbPrimaryKey) {
            params[prop] = this[prop];
            columns.push(col);
        }
    }, this));

    if (method === 'INSERT') {
        query = 'INSERT INTO `' + classDef._dbTable + '` (`' + columns.join('`,`') + '`) VALUES (:' + _.keys(params).join(', :') + ')';
    } else {
        var keys = _.keys(params);
        query = 'UPDATE `' + classDef._dbTable + '` SET ';
        for (var i = 0, count = columns.length; i < count; i++) {
            columns[i] = '`' + columns[i] + '` = :' + keys[i];
        }
        params[classDef._dbPrimaryKey] = this[classDef._dbPrimaryKey];
        query += columns.join(', ') + ' WHERE `' + classDef._dbMap[classDef._dbPrimaryKey] + '` = :' + classDef._dbPrimaryKey;
    }

    db
        .query(query, params)
        .then(_.bind(function(result) {
            if (method === 'INSERT') {
                this[classDef._dbPrimaryKey] = result;
                retVal.resolve(this);
            } else {
                this.resolve(true);
            }
        }, this))
        .fail(function(err) {
            retVal.reject(err);
        });

    return retVal.promise;

};

module.exports = Dal;