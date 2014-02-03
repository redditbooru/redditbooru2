/**
 * QueryOptions view
 */
(function(undefined) {

    RB.QueryOptionsView = Backbone.View.extend({

        collection: null,
        $el: null,
        template: RB.Templates.queryOptionItems,

        events: {
            'change .queryOption': 'handleQueryOptionChange'
        },

        initialize: function($el, collection) {
            this.collection = collection;
            this.$el = $el;
            this.name = $el.attr('id');
            this.render();
        },

        render: function() {
            var tplData = {
                type: 'checkbox',
                items: this.collection.toJSON(),
                name: this.name
            };
            //this.$el.html(this.template(tplData));
        },

        handleQueryOptionChange: function(evt) {
            console.log(evt);
        }

    });

}());