/**
 * Fake DB wrapper for testing
 */
global._db = {
    query: function(query, params) {
        var retVal = require('q').defer();

        // Fake some async
        setTimeout(function() {
            retVal.resolve([
                {
                    db_query: query,
                    db_params: params
                }
            ]);
        }, 1);

        return retVal.promise;
    }
};

var _ = require('underscore'),
    expect = require('expect.js'),
    Dal = require('../lib/dal.js'),
    DalModel = function(obj) {
        if (_.isObject(obj)) {
            DalModel.copyRowFromDb(this, obj);
        }
    };

DalModel._dbTable = 'null';
DalModel._dbMap = {
    query: 'db_query',
    params: 'db_params'
};

_.extend(DalModel, Dal);

describe('DB wrapper tests', function() {
    it('should return two columns with the parameters passed', function(done) {
        var query = 'THIS IS THE QUERY',
            params = 'THESE ARE THE PARAMS';
        global._db.query(query, params).then(function(rows) {
            expect(rows.length).to.be(1);
            expect(rows[0].db_query).to.be(query);
            expect(rows[0].db_params).to.be(params);
            done();
        });
    });
});

describe('Dal test suite', function() {

    describe('copyRowFromDb', function() {
        it('should map column names to object properites', function() {
            var obj = {},
                row = {
                    db_query: 'QUERY',
                    db_params: 'PARAMS'
                };
            DalModel.copyRowFromDb(obj, row);
            expect(_.has(obj, 'query')).to.be.ok();
            expect(obj.query).to.be(row.db_query);
            expect(_.has(obj, 'params')).to.be.ok();
            expect(obj.params).to.be(row.db_params);
        });
    });

    describe('query', function() {
        it('should query everything when given no params', function(done) {
            DalModel.query().then(function(rows) {
                expect(rows[0].query).to.be('SELECT * FROM `null`');
                done();
            });
        });

        it('should handle a conditional', function(done) {
            DalModel.query([ { col: 'query', val: 'value' } ]).then(function(rows) {
                expect(rows[0].query).to.be('SELECT * FROM `null` WHERE `db_query` = :query');
                done();
            });
        });

        it('should handle multiple conditions', function(done) {
            DalModel.query([ { col: 'query', val: 'value' }, { col: 'params', val: 'params' } ]).then(function(rows) {
                expect(rows[0].query).to.be('SELECT * FROM `null` WHERE `db_query` = :query AND `db_params` = :params');
                done();
            });
        });

    });
});