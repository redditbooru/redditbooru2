/**
 * Image view
 */
(function(undefined) {

    var $window = $(window),

        // This number helps determine the total number of columns there should be per row
        AVERAGE_COLUMN_WIDTH = 300,

        // The number of pixels between each image
        IMAGE_GUTTER = 20;

    RB.ImageView = Backbone.View.extend({

        templates: {
            imagesRow: RB.Templates.imagesRow,
            moreRow: RB.Templates.moreRow
        },

        collection: null,

        events: {

        },

        initialize: function($el, collection) {
            this.collection = collection;
            this.$el = $el;
            this.calculateWindowColumns();
            $window.on('ImageView.resize', _.bind(this.calculateWindowColumns, this));
        },

        render: function() {

            var count = 0,
                itemsToRender = new RB.ImageCollection(),
                out = '';

            this.collection.each(function(item) {
                itemsToRender.push(item);
                count++;
                if (count === this.columns) {
                    out = out.concat(this._drawColumn(itemsToRender));
                    itemsToRender.reset();
                    count = 0;
                }
            }, this);

            if (count > 0) {
                out = out.concat(this._drawColumn(itemsToRender));
            }

            out = out.concat(this.templates.moreRow());

            this.$el.html(out);

        },

        /**
         * Calculates how many columns there should be and redraws if there's been a change
         */
        calculateWindowColumns: function() {
            var oldColumnCount = this.columns;
            this.width = this.$el.width();
            this.columns = Math.floor(this.width / AVERAGE_COLUMN_WIDTH);
            if (this.columns !== oldColumnCount) {
                this.width -= this.columns * IMAGE_GUTTER;
                this.render();
            }
            // console.log(this.columns);
        },

        _drawColumn: function(images) {

            var widthRatioSum = 0;

            // We're going to make some view specific changes to the data,
            // so serialize a bland copy for us to edit and pipe to the template
            images = images.toJSON();

            // Now we loop through each image in the row, get it's width to height ratio,
            // and sum them all together for later
            _.each(images, function(image) {
                image.widthHeightRatio = image.width / image.height;
                widthRatioSum += image.widthHeightRatio;
            });

            // Using the sum we just got, we'll figure out what percentage of the total
            // width each image should get
            _.each(images, function(image) {
                image.viewWidth = Math.round(image.widthHeightRatio / widthRatioSum * this.width);
            }, this);

            // Finally, render and return the template
            return this.templates.imagesRow(images);

        }

    });

}());