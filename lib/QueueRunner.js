var defer = require('q').defer,
    _ = require('underscore'),

    QueueRunner = function(options, callback) {
        this.delay = options.delay || 100;
        this.limiter = options.limiter || 50;
        this.callback = callback;
        this._queue = [];
        this._timer = null;
        this._active = 0;
    };

QueueRunner.prototype.add = function(action, data) {
    this._queue.push({ action: action, data: data });
};

/**
 * Tracks a promise to keep limit async operations
 */
QueueRunner.prototype.async = function(promise) {
    var retVal = defer(),
        that = this;

    this._active++;
    promise.then(function(result) {
        that._active--;
        retVal.resolve(result);
    }).fail(function(err) {
        that._active--;
        retVal.reject(err);
    });

    return retVal.promise;
};

QueueRunner.prototype.getQueueLength = function() {
    return this._queue.length;
};

QueueRunner.prototype.start = function() {
    this._timer = setTimeout(_.bind(this._processQueue, this), this.limiter);
};

QueueRunner.prototype.pause = function() {
    clearTimeout(this._timer);
};

QueueRunner.prototype._processQueue = function() {
    var item = null,
        queue = this._queue,
        limiter = this.limiter,
        callback = this.callback;

    while (queue.length > 0 && this._active < this.limiter) {
        item = queue.shift();
        callback(item);
    }

    this.start();

};

module.exports = QueueRunner;