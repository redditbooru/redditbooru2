var express = require('express'),
    _ = require('underscore'),
    hbhelpers = require('./lib/handlebars_helpers.js'),
    handlebars = require('express3-handlebars').create({ 
        defaultLayout: 'main',
        helpers:hbhelpers
    }),
    db = require('./lib/db.js'),
    app = express();

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
global._db = db;

app.all('*', function(request, response) {

    var controller = null,
        path = request.path.split('/')[1],
        error = false;

    console.log('[' + process.env.LISTEN_PORT + '] ' + request.path);

    response.set('X-ServedBy', process.env.LISTEN_PORT);

    try {
        path = path.length === 0 ? 'index' : path;
        controller = require('./controllers/' + path + '.js');
        if (_.isFunction(controller)) {
            controller(app, request, response);
        } else {
            error = true;
        }
    } catch (e) {
        error = true;
        console.log('An error occurred: ', e);
    }

    if (error) {
        response.render('error', { message:'Sorry, we couldn\'t find that page' });
    }

});

app.listen(process.env.LISTEN_PORT);
console.log('Listening on port ' + process.env.LISTEN_PORT);