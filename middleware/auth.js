const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'yUKo5pa6a5s';

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).send('Access denied. No token provided.');
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send('Invalid token');
  }
};
