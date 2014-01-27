var Response = function(req, res) {
    this._start = Date.now();
    this._res = res;
    this._req = req;
};

Response.prototype.writeJSON = function(obj, end) {
    this._res.jsonp(obj);
    console.log(end);
    if (end) {
        this.end();
    }
};

Response.prototype.write = function(obj, end) {
    
};

Response.prototype.render = function(template, data) {
    
};

Response.prototype.end = function() {
    this._res.end();
    console.log(this._req.originalUrl + ' served in ' + ((Date.now() - this._start) / 1000) + 's');
};

module.exports = Response;