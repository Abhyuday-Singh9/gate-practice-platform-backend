const { verifyAccessTokenFromHeader } = require("../shared/auth/authService");

async function authenticate(req, _res, next) {
  try {
    const { payload, user } = await verifyAccessTokenFromHeader(req.headers.authorization);

    req.auth = payload;
    req.user = user;

    return next();
  } catch (error) {
    return next(error);
  }
}

async function optionalAuthenticate(req, _res, next) {
  try {
    if (!req.headers.authorization) {
      return next();
    }

    const { payload, user } = await verifyAccessTokenFromHeader(req.headers.authorization);

    req.auth = payload;
    req.user = user;

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { authenticate, optionalAuthenticate };
