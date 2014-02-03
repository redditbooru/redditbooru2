/**
 * RedditBooru main app view
 */
(function(undefined) {

    RB.AppView = Backbone.View.extend({

        views: {},
        collections: {},

        initialize: function() {

            this.collections.sources = new RB.QueryOptionCollection();
            this.collections.sources.reset(window.sources)
            this.views.sources = new RB.QueryOptionsView($('#sources'), this.collections.sources);

            this.collections.images = new RB.ImageCollection();
            this.collections.images.reset(window.startUp);
            this.views.images = new RB.ImageView($('#images'), this.collections.images);

        }

    });

    // Kick off execution
    var App = new RB.AppView();

}());