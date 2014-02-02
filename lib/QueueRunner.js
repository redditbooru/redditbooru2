var defer = require('q').defer,
    _ = require('underscore'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,

    EVT_QUEUE_EMPTY = 'queueEmpty',
    EVT_PROCESS_ITEM = 'processItem',

    QueueRunner = function(options, callback) {
        this.delay = options.delay || 100;
        this.limiter = options.limiter || 50;
        this._queue = [];
        this._timer = null;
        this._active = 0;
        this._last = this.generateStateHash();
        this._isActive = false;
    };

util.inherits(QueueRunner, EventEmitter);

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

QueueRunner.prototype.generateStateHash = function() {
    return this._queue.length + '_' + this._active;
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

    if (this._last !== this.generateStateHash()) {
        console.log('Processing queue: ' + queue.length + ' items in queue, ' + this._active + ' active promises');
    }

    while (queue.length > 0 && this._active < this.limiter) {
        this._isActive = true;
        item = queue.shift();
        this.emit(EVT_PROCESS_ITEM, item);
    }

    if (queue.length === 0 && this._active === 0 && this._isActive) {
        this.emit(EVT_QUEUE_EMPTY);
        this._isActive = false;
    }
    this._last = this.generateStateHash();

    this.start();

};

module.exports = QueueRunner;