/**
 * Query option
 */
(function(undefined) {

    RB.QueryOption = Backbone.Model.extend({
        defaults: function() {
            return {
                title: '',
                value: '',
                checked: false
            };
        },

        initialize: function(data) {
            this.title = _.has('title', data);
            this.value = _.has('value', data);
        }

    });

}());