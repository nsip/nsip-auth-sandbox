var express = require('express');
var app = express();

app
    .enable('trust proxy')
    .use(express.vhost('auth-rp.dev.nsip.edu.au', require('./rp').app))
    .use(express.vhost('auth-idp.dev.nsip.edu.au', require('./idp').app))
    .listen(80);

