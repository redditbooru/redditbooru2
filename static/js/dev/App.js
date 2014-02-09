/**
 * RedditBooru main app view (controller)
 */
(function(undefined) {

    RB.AppView = Backbone.View.extend({

        views: {},
        collections: {},

        initialize: function() {

            this.collections.sources = new RB.QueryOptionCollection();
            this.collections.sources.reset(window.sources);
            this.views.sources = new RB.QueryOptionsView($('#sources'), this.collections.sources);
            this.views.sources.on('update', _.bind(this._updateImageSources, this));

            this.collections.images = new RB.ImageCollection();
            this.collections.images.reset(window.startUp);
            this.views.images = new RB.ImageView($('#images'), this.collections.images);

        },

        _updateImageSources: function(item) {
            var sources = this.collections.sources.where({ checked: true }),
                updated = [];

            _.each(sources, function(item) {
                updated.push(item.attributes.value);
            });

            this.collections.images.setQueryOption('sources', updated.join(','));
        },

        // Router entry points
        search: function(query) {

        }

    });

    // Kick off execution
    var App = new RB.AppView();

}());