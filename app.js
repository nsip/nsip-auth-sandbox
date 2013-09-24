var express = require('express');

var app = express();
var passport = require('passport');

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'nsip-auth-sandbox' }));
    app.use(passport.initialize());
    app.use(passport.session());
});

require('./idp')(app, passport);
require('./rp')(app, passport);

app.listen(80);

