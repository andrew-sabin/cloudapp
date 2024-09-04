const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const DOMAIN = '';

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${DOMAIN}/.well-known/jwks.json`,
    }),
  
    // Validate the audience and the issuer.
    issuer: `https://${DOMAIN}/`,
    algorithms: ['RS256'],
    onExpired: async (req, err) => {
        if (new Date() - err.inner.expiredAt < 5000) { return;}
        throw err;
      },
    credentialsRequired: true,
});

module.exports = checkJwt;