/*
 * NSIP RP test sandbox
 */

var express = require('express');
var passport = require('passport');
var PersonaStrategy = require('passport-persona').Strategy;
var OAuthStrategy = require('passport-oauth').OAuthStrategy;
var InternalOAuthError = require('passport-oauth').InternalOAuthError;

var cel = require('connect-ensure-login');
var app = exports.app = express();
var db = require('./db'); // for now, use the same database as IdP

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'nsip-rp-sandbox' }));
    app.use(passport.initialize());
    app.use(passport.session());
});

/*
 * Just use an in-memory user database for now. Real RPs would use their
 * own directory or database.
 */
var users = {};

passport.serializeUser(function(user, done) {
    if (user && user.id) {
        users[user.id] = user;
        done(null, user.id);
    } else {
        done(null, false);
    }
});

passport.deserializeUser(function(id, done) {
/*
  db.users.find(id, function (err, user) {
    done(err, user);
  });
*/
    var user = users[id];

    done(null, user);
});

/*
 * OAuth
 */

OAuthStrategy.prototype.userProfile = function (token, tokenSecret, params, done) {
    this._oauth._performSecureRequest(token, tokenSecret, "GET",
                                      "http://auth-idp.dev.nsip.edu.au/api/userinfo", null, "",
                                      "application/json", function (err, body, res) {
        if (err) {
            return done(new InternalOAuthError('failed to fetch user profile', err));
        }

        try {
            return done(null, JSON.parse(body));
        } catch (err) {
            return done(err);
        }
    });
};

passport.use(new OAuthStrategy({
    requestTokenURL: 'http://auth-idp.dev.nsip.edu.au/oauth/request_token',
    accessTokenURL: 'http://auth-idp.dev.nsip.edu.au/oauth/access_token',
    userAuthorizationURL: 'http://auth-idp.dev.nsip.edu.au/dialog/authorize',
    consumerKey: '123-456-789',
    consumerSecret: 'shhh-its-a-secret',
    callbackURL: 'http://auth-rp.dev.nsip.edu.au/oauth/callback'
  },
  function(token, tokenSecret, profile, done) {
    if (profile && profile.emails) {
        var user = { id: profile.emails[0] };

        return done(null, user);
    } else {
        return done(null, false);
    }
  }
));

app.get('/oauth',
  passport.authenticate('oauth'));

app.get('/oauth/callback',
  passport.authenticate('oauth', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);

/*
 * Persona authentication form
 */

passport.use(new PersonaStrategy({
    audience: 'http://auth-rp.dev.nsip.edu.au'
  },
  function(email, done) {
    var user = { id: email };

    return done(null, user);
  }
));

app.post('/persona',
  passport.authenticate('persona', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);

/*
 * Login redirector - RP side
 */
app.get('/login', function(req, res) {
    var currentUser = "null";

    if (req.user) {
	currentUser = '"' + req.user.id + '"';
    }

var form = '<html><head><script src="https://login.persona.org/include.js"></script><script src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js"></script><script>navigator.id.watch({ loggedInUser: ' + currentUser + ', onlogin: function(assertion) { $.ajax({ type: "POST", url: "/persona", data: {assertion: assertion}, success: function(res, status, xhr) { window.location.replace("/rp"); }, error: function(xhr, status, err) { navigator.id.logout(); alert("Login failure: " + err); } }); }, onlogout: function() { $.ajax({ type: "GET", url: "/logout", success: function(res, status, xhr) { window.location.reload(); }, error: function(xhr, status, err) { alert("Logout failure: " + err); } }); } });function oauthRedirect() { window.open("/oauth"); }</script></head><body><button type="button" onclick="navigator.id.request()">Log In With Persona</button><button type="button" onclick="oauthRedirect()">Log In With OAuth 1.0</button></body></html>';
    res.send(form);
});

app.get('/logout', function(req, res) {
    req.session.destroy();
    res.send('<html>Logged out</html>');
});

app.get('/', function(req, res) {
    cel.ensureLoggedIn('/login');
    if (req.user && req.user.id) {
	res.send('<html><body>RP Welcome ' + req.user.id + '</body></html>');
    } else {
	res.send('<html><body>Not logged in.</body></html>');
    }
});
