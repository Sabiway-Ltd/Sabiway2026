// middleware/authForward.js

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.access_token;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    req.headers._token = authHeader.split(" ")[1];
  } else if (cookieToken) {
    req.headers._token = cookieToken;
  }

  next();
};
