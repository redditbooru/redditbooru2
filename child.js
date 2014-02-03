// This must be defined before any modules relying on it
global._db = require('./lib/db');

var express = require('express'),
    _ = require('underscore'),
    MongoStore = require('connect-mongo')(express),
    handlebars = require('express3-handlebars').create({
        defaultLayout: 'main'
    }),
    app = express(),

    config = require('./config'),
    index = require('./controllers/index'),
    images = require('./controllers/images');

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// Dev output
app.use(function(request, response, next) {
    response.set('X-ServedBy', process.env.LISTEN_PORT);
    next();
});

// Session management
app.use(express.cookieParser());
app.use(express.session({
    key: 'rb_sess',
    store: new MongoStore({
        url: config.MONGO_CONFIG.database
    }),
    cookie: {
        maxAge: 2592000000
    },
    secret: config.SESSION.secret
}));

app.all('/', index);

// API endpoints
app.all('/images', images.api);
app.all('/api/images', images.api);

app.listen(process.env.LISTEN_PORT);
console.log('Listening on port ' + process.env.LISTEN_PORT);