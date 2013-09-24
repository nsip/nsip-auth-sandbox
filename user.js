/**
 * Module dependencies.
 */
var passport = require('passport')

exports.info = [
  passport.authenticate('token', { session: false }),
  function(req, res) {
    res.json({ user_id: req.user.entryUUID, name: req.user.name })
  }
]
