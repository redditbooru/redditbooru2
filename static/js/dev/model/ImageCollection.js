/**
 * Image collection
 */
(function(undefined) {

    RB.ImageCollection = Backbone.Collection.extend({

        model: RB.Image,

        // Params
        sources: [ 1 ],
        lastDate: 0,

        url: function(options) {
            console.log(options);
            return '/api/images/' + (this.lastDate > 0 ? '?afterDate=' + this.lastDate : '');
        },

        initialize: function() {
            var that = this;
            this.on('add', function(item) {
                var date = parseInt(item.attributes.dateCreated);
                if (date < that.lastDate || that.lastDate === 0) {
                    that.lastDate = item.attributes.dateCreated;
                }
            });
        }

    });

}());