/**
 * Image collection
 */
(function(undefined) {

    RB.ImageCollection = Backbone.Collection.extend({

        model: RB.Image,

        initialize: function() {
            console.log('Image collection init');
        }

    });

}());