/**
 * Image collection
 */
(function(undefined) {

    RB.ImageCollection = Backbone.Collection.extend({

        model: RB.Image,

        // Params
        lastDate: 0,

        url: function(options) {
            console.log(options);
            return '/api/images/' + (this.lastDate > 0 ? '?afterDate=' + this.lastDate : '');
        },

        initialize: function() {
            var that = this;
            this.on('add', function(item) {
                that._checkLastDate.call(that, item);
            });

            this.on('reset', function(stuff) {
                that.lastDate = 0;
                _.each(that.models, function(item) {
                    console.log(item.attributes);
                    that._checkLastDate.call(that, item);
                });
            });

        },

        _checkLastDate: function(item) {
            var date = parseInt(item.attributes.dateCreated);
            if (date < this.lastDate || this.lastDate === 0) {
                this.lastDate = item.attributes.dateCreated;
            }
        }

    });

}());