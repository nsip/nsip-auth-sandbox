var ldap = require('ldapjs');
var client = ldap.createClient({url: 'ldap://localhost:389'});

exports.find = function(id, done) {
    var opts = {};

    opts.filter = '(entryUUID=' + id + ')';
    opts.attributes = [ '*', 'entryUUID' ];
    opts.scope = 'sub';

    client.search('dc=auth,dc=dev,dc=nsip,dc=edu,dc=au', opts, function(err, res) {
        res.on('searchEntry', function(entry) {
            return done(null, entry.object);
        });
//        return done(err, null);
    });
};

