var express = require('express'),
    _ = require('underscore'),
    handlebars = require('express3-handlebars').create({ 
        defaultLayout: 'main'
    }),
    db = require('./lib/db.js'),
    app = express(),

    images = require('./controllers/images');

console.log(app.routes);
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
global._db = db;

// Dev output
app.use(function(request, response, next) {
    console.log('[' + process.env.LISTEN_PORT + '] ' + request.path);
    response.set('X-ServedBy', process.env.LISTEN_PORT);
    next();
});

app.all('/images', images.api);

app.listen(process.env.LISTEN_PORT);
console.log('Listening on port ' + process.env.LISTEN_PORT);