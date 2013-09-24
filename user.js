/**
 * Module dependencies.
 */
var passport = require('passport');

/*
 * Return authenticated user profile as a Portable Contacts object,
 * mapped from standard LDAP schema.
 */

exports.info = [
  passport.authenticate('token', { session: false }),
  function(req, res) {
    res.json({
        provider: 'nsip',
        id: req.user.entryUUID,
        displayName: req.user.cn,
        emails: [ req.user.uid ]
    });
  }
]
