const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * verifyToken
 * 
 * Requirement: "Every protected route checks JWT first, then session as fallback"
 * 
 * Logic:
 * 1. Try to get token from Authorization header (Bearer)
 * 2. If present, verify JWT.
 * 3. If no JWT or invalid, check req.session.userId (Session fallback)
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  let token;
  let userId;

  // 1. Try JWT
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (error) {
      // If JWT exists but is invalid, we don't immediately fail, 
      // we check session next. If we wanted to fail strictly on invalid JWT, 
      // we would throw here. But requirement says "fallback".
    }
  }

  // 2. Try Session fallback if no userId from JWT
  if (!userId && req.session && req.session.userId) {
    userId = req.session.userId;
  }

  if (!userId) {
    return res.fail('Not authorized, please login.', 401);
  }

  const user = await User.findById(userId).select('-password');
  if (!user) {
    return res.fail('User not found.', 404);
  }

  req.user = user;
  next();
});

/**
 * isDealer
 * Restricts access to dealers only.
 */
const isDealer = (req, res, next) => {
  if (req.user && req.user.role === 'dealer') {
    next();
  } else {
    res.fail('Access denied: Dealers only.', 403);
  }
};

/**
 * isUser
 * Restricts access to standard users only.
 */
const isUser = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    next();
  } else {
    res.fail('Access denied: Users only.', 403);
  }
};

module.exports = {
  verifyToken,
  protect: verifyToken, // alias for backward compatibility if needed
  isDealer,
  dealerOnly: isDealer, // alias
  isUser,
  userOnly: isUser,    // alias
};
