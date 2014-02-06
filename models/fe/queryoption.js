var Source = require('../db/source'),

    QueryOption = function(item) {
        if (item instanceof Source) {
            this._fromSource(item);
        }
    };

QueryOption.prototype._fromSource = function(item) {
    this.title = item.name;
    this.value = item.id;
    this.checked = false;
    this.name = 'source';
};

QueryOption.fromSources = function(sources) {
    var retVal = [];
    sources.forEach(function(item) {
        retVal.push(new QueryOption(item));
    });
    return retVal;
};

module.exports = QueryOption;