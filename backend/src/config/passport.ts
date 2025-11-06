import passport from 'passport';
import { DatabaseService } from './database';
const Strategy = require('passport-ldapauth').Strategy;

// Configuration LDAP
const ldapOptions = {
  server: {
    url: process.env.LDAP_URL || 'ldap://localhost:389',
    bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=example,dc=com',
    bindCredentials: process.env.LDAP_BIND_PASSWORD || 'admin',
    searchBase: process.env.LDAP_SEARCH_BASE || 'dc=example,dc=com',
    searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})',
    searchAttributes: ['uid', 'sAMAccountName', 'cn', 'mail', 'sn', 'givenName', 'displayName', 'userPrincipalName'],
    tlsOptions: {
      rejectUnauthorized: false // Pour le développement uniquement
    }
  },
  usernameField: 'username',
  passwordField: 'password'
};

// Configure LDAP strategy
passport.use(new Strategy(ldapOptions, async (ldapUser: any, done: any) => {
  try {
    console.log('LDAP user object received:', JSON.stringify(ldapUser, null, 2));
    
    // Extract user information from LDAP
    const username = ldapUser.uid || ldapUser.sAMAccountName;
    const email = ldapUser.mail || ldapUser.userPrincipalName || `${username}@home.local`;
    const fullName = ldapUser.displayName || ldapUser.cn || `${ldapUser.givenName || ''} ${ldapUser.sn || ''}`.trim();
    const ldapDn = ldapUser.dn;

    console.log('Extracted username:', username);
    console.log('Extracted email:', email);
    console.log('Extracted fullName:', fullName);

    if (!username) {
      console.error('Username extraction failed from LDAP object');
      return done(null, false, { message: 'Username not found in LDAP response' });
    }

    // Check if user exists in database
    const existingUser = await DatabaseService.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    let user;
    if (existingUser.rows.length > 0) {
      // Update existing user
      const updateResult = await DatabaseService.query(
        `UPDATE users 
         SET email = $1, full_name = $2, ldap_dn = $3, updated_at = CURRENT_TIMESTAMP, last_login_at = CURRENT_TIMESTAMP
         WHERE username = $4
         RETURNING *`,
        [email, fullName, ldapDn, username]
      );
      user = updateResult.rows[0];
    } else {
      // Create new user
      const insertResult = await DatabaseService.query(
        `INSERT INTO users (username, email, full_name, ldap_dn, last_login_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING *`,
        [username, email, fullName, ldapDn]
      );
      user = insertResult.rows[0];
    }

    return done(null, user);
  } catch (error) {
    console.error('Error in LDAP authentication:', error);
    return done(error);
  }
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await DatabaseService.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return done(null, false);
    }
    done(null, result.rows[0]);
  } catch (error) {
    done(error);
  }
});

export default passport;
