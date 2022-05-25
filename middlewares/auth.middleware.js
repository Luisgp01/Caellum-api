// Authorization: Bearer dasjndlkjashdjkl.ahdkljashdfjkashdfkjashfjksdhfkjsdh.djhlasdjkash
const createError = require('http-errors')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const googleAuth = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();

  console.log(`User ${payload.name} verified`);

  const { sub, email, name, image } = payload;
  const userId = sub;
  return { userId, email, name, image };
};

module.exports = googleAuth;

module.exports.isNotAuthenticated = (req, res, next) => {
  const authorization = req.header('Authorization')

  if (!authorization) {
    next()
  } else {
    next(createError(401))
  }
}

module.exports.isAuthenticated = (req, res, next) => {
  const authorization = req.header('Authorization')

  // Check if header
  if (!authorization) {
    next(createError(401))
  } else {
    const [type, token] = authorization.split(' ')

    // Check if valid protocol
    if (type !== 'Bearer') {
      next(createError(401))
    } else {
      // Check token
      jwt.verify(
        token,
        process.env.JWT_SECRET || 'changeme',
        (err, decodedToken  ) => {
          if (err) {
            console.log(err);
            next(err)
          } else {
            req.currentUser = decodedToken.id
            next()
          }
        }
      )
    }
  }
}