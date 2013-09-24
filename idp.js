/*
 * NSIP IdP test sandbox
 */

var express = require('express');
var passport = require('passport');
var LDAPStrategy = require('passport-ldapauth').Strategy;
var cel = require('connect-ensure-login');
var app = exports.app = express();

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'nsip-idp-sandbox' }));
    app.use(passport.initialize());
    app.use(passport.session());
});

/*
 * In-memory mapping of users to user information
 */
var users = {};

passport.serializeUser(function(user, done) {
    users[user.uid] = user;
    done(null, user.uid);
});

passport.deserializeUser(function(id, done) {
    var user = users[id];
    done(null, user);
});

/*
 * LDAP authentication form
 */
var OPTS = {
    server: {
      url: 'ldap://localhost:389',
      searchBase: 'dc=auth,dc=dev,dc=nsip,dc=edu,dc=au',
      searchFilter: '(uid={{username}})'
    }
};

passport.use(new LDAPStrategy(OPTS));

app.get('/ldap', function(req, res) {
    res.send('<form action="/ldap" method="post"><div><label>Username:</label><input type="text" name="username"/></div><div><label>Password:</label><input type="password" name="password"/></div><div><input type="submit" value="Log In"/></div></form>');
});

app.post('/ldap',
  passport.authenticate('ldapauth', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);

/*
 * Login redirector - IdP side
 */
app.get('/login',
  function(req, res) {
    res.redirect('/ldap');
  });

/*
 * Homepage
 */
app.get('/idp', function(req, res) {
    cel.ensureLoggedIn('/login');
    if (req.user) {
	res.send('<html><body>IdP Welcome ' + req.user.uid + '</body></html>');
    } else {
	res.send('<html><body>Not logged in.</body></html>');
    }
});

