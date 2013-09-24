module.exports = function(app, passport) {

var LDAPStrategy = require('passport-ldapauth').Strategy;
var PersonaStrategy = require('passport-persona').Strategy;
var cel = require('connect-ensure-login');

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
 * Persona authentication form
 */

passport.use(new PersonaStrategy({
    audience: 'http://auth.dev.nsip.edu.au'
  },
  function(email, done) {
    var user = { uid: email };
    return done(null, user);
  }
));

app.post('/rp/persona',
  passport.authenticate('persona', {
    successRedirect: '/rp',
    failureRedirect: '/rp/login'
  })
);

/*
 * Login redirector - RP side
 */
app.get('/rp/login', function(req, res) {
    var currentUser = "null";

    if (req.user) {
	currentUser = '"' + req.user.uid + '"';
    }

var form = '<html><head><script src="https://login.persona.org/include.js"></script><script src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js"></script><script>navigator.id.watch({ loggedInUser: ' + currentUser + ', onlogin: function(assertion) { $.ajax({ type: "POST", url: "/rp/persona", data: {assertion: assertion}, success: function(res, status, xhr) { window.location.replace("/rp"); }, error: function(xhr, status, err) { navigator.id.logout(); alert("Login failure: " + err); } }); }, onlogout: function() { $.ajax({ type: "GET", url: "/rp/logout", success: function(res, status, xhr) { window.location.reload(); }, error: function(xhr, status, err) { alert("Logout failure: " + err); } }); } });</script></head><body><button type="button" onclick="navigator.id.request()">Log In With Persona</button></body></html>';
    res.send(form);
});

app.get('/rp/logout', function(req, res) {
    req.session.destroy();
    res.send('<html>Logged out</html>');
});

app.get('/rp', function(req, res) {
    cel.ensureLoggedIn('/rp/login');
    if (req.user) {
	res.send('<html><body>RP Welcome ' + req.user.uid + '</body></html>');
    } else {
	res.send('<html><body>Not logged in.</body></html>');
    }
});

}
