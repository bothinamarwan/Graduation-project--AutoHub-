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

  const user  = await User.create({
    name, email, password,
    role: 'user',
    authProvider: 'local',
    isProfileComplete: true,
  });

  const token = generateToken(user._id);
  attachSession(req, user);

  res.created({ user, token }, 'User account created successfully.');
});


// POST /api/auth/register-dealer
const registerDealer = asyncHandler(async (req, res) => {
  const { name, email, password, location, phone, whatsapp, taxNumber } = req.body;

  const user  = await User.create({
    name, email, password, phone,
    role: 'dealer',
    authProvider: 'local',
    isProfileComplete: true,
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

  const token = generateToken(user._id);
  attachSession(req, user);

  res.created({ user, dealer, token }, 'Dealer account created successfully.');
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

  // Use the frontend URL passed in the state parameter, or fallback to environment variables
  let frontendURL = req.query.state || process.env.CLIENT_URL || 'http://localhost:5173';

  // Security check: only allow redirecting to known origins to prevent Open Redirect attacks
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://autohubb-phi.vercel.app',
    process.env.CLIENT_URL
  ].filter(Boolean);

  if (!allowedOrigins.includes(frontendURL)) {
    frontendURL = process.env.CLIENT_URL || 'http://localhost:5173';
  }

  if (frontendURL) {
    return res.redirect(`${frontendURL}/?token=${token}`);
  }
  
  // If no frontend URL is configured (e.g. testing phase), just return JSON
  res.success({ 
    user, 
    token, 
    nextStep: 'none' 
  }, 'Google Login successful. (No CLIENT_URL set for redirect)');
};

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.fail('There is no user with that email', 404);
  }

  // Get reset OTP
  const otp = user.getResetPasswordOTP();
  await user.save({ validateBeforeSave: false });

  const message = `Your password reset code is: ${otp}\n\nThis code will expire in 10 minutes.`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset OTP',
      text: message,
    });

    res.success({}, 'Email sent');
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return res.fail(`Email could not be sent: ${err.message}`, 500);
  }
});

// PUT /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.fail('Please provide email, otp, and new password', 400);
  }

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  const user = await User.findOne({
    email: email.toLowerCase(),
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.fail('Invalid OTP or email', 400);
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Log user in by sending token
  const token = generateToken(user._id);
  attachSession(req, user);

  res.success({ token }, 'Password reset successfully');
});

module.exports = { registerUser, registerDealer, login, logout, getMe, googleCallback, forgotPassword, resetPassword };