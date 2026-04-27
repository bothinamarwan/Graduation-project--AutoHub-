const User          = require('../models/User');
const Dealer        = require('../models/Dealer');
const generateToken = require('../utils/generateToken');
const asyncHandler  = require('../utils/asyncHandler');
const sendEmail     = require('../utils/sendEmail');
const crypto        = require('crypto');

const attachSession = (req, user) => {
  if (req.session) {
    req.session.userId = user._id.toString();
    req.session.role   = user.role;
  }
};


// POST /api/auth/register-user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const emailConfirmationToken = crypto.randomBytes(32).toString('hex');
  const emailConfirmationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  const user  = await User.create({
    name, email, password,
    role: 'user',
    authProvider: 'local',
    isProfileComplete: true,
    emailConfirmationToken,
    emailConfirmationExpires,
  });

  const confirmUrl = `${req.protocol}://${req.get('host')}/api/auth/confirm-email/${emailConfirmationToken}`;
  const message = `Please confirm your email by clicking the following link: \n\n ${confirmUrl}`;
  
  try {
    await sendEmail({
      to: user.email,
      subject: 'Email Confirmation',
      text: message,
    });
  } catch (error) {
    console.error('Email could not be sent:', error);
  }

  const token = generateToken(user._id);
  attachSession(req, user);

  res.created({ user, token }, 'User account created successfully. Please check your email to confirm your account.');
});

// POST /api/auth/register-dealer
const registerDealer = asyncHandler(async (req, res) => {
  const { name, email, password, location, phone, whatsapp, taxNumber } = req.body;

  const emailConfirmationToken = crypto.randomBytes(32).toString('hex');
  const emailConfirmationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  const user  = await User.create({
    name, email, password, phone,
    role: 'dealer',
    authProvider: 'local',
    isProfileComplete: true,
    emailConfirmationToken,
    emailConfirmationExpires,
  });

  // Create Dealer Profile
  const dealer = await Dealer.create({
    user: user._id,
    businessName: name, // Using full name as businessName
    location: { address: location },
    phone,
    whatsapp,
    taxNumber,
  });

  const confirmUrl = `${req.protocol}://${req.get('host')}/api/auth/confirm-email/${emailConfirmationToken}`;
  const message = `Please confirm your email by clicking the following link: \n\n ${confirmUrl}`;
  
  try {
    await sendEmail({
      to: user.email,
      subject: 'Email Confirmation',
      text: message,
    });
  } catch (error) {
    console.error('Email could not be sent:', error);
  }

  const token = generateToken(user._id);
  attachSession(req, user);

  res.created({ user, dealer, token }, 'Dealer account created successfully. Please check your email to confirm your account.');
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password)))
    return res.fail('Invalid email or password.', 401);

  if (user.authProvider === 'google')
    return res.fail('This account uses Google login. Please sign in with Google.', 400);

  const token = generateToken(user._id);
  user.password = undefined;
  attachSession(req, user);

  res.success({ user, token }, 'Login successful.');
});

// POST /api/auth/logout
const logout = (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.success({}, 'Logged out successfully.');
    });
  } else {
    res.success({}, 'Logged out successfully.');
  }
};

// GET /api/auth/me
const getMe = (req, res) =>
  res.success({ user: req.user });

// GET /api/auth/google/callback
const googleCallback = (req, res) => {
  const user  = req.user;
  const token = generateToken(user._id);
  attachSession(req, user);

  const frontendURL = process.env.CLIENT_URL;

  // If a frontend URL is configured, redirect the browser to the frontend
  if (frontendURL) {
    return res.redirect(`${frontendURL}/auth/success?token=${token}`);
  } 
  
  // If no frontend URL is configured (e.g. testing phase), just return JSON
  res.success({ 
    user, 
    token, 
    nextStep: 'none' 
  }, 'Google Login successful. (No CLIENT_URL set for redirect)');
};

// GET /api/auth/confirm-email/:token
const confirmEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    emailConfirmationToken: req.params.token,
    emailConfirmationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.fail('Invalid or expired token', 400);
  }

  user.isEmailConfirmed = true;
  user.emailConfirmationToken = undefined;
  user.emailConfirmationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.success({}, 'Email confirmed successfully');
});

module.exports = { registerUser, registerDealer, login, logout, getMe, googleCallback, confirmEmail };