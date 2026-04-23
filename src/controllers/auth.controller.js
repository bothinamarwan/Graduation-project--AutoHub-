const User          = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler  = require('../utils/asyncHandler');

const attachSession = (req, user) => {
  if (req.session) {
    req.session.userId = user._id.toString();
    req.session.role   = user.role;
  }
};

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  const user  = await User.create({
    name, email, password, phone,
    role,
    authProvider: 'local',
    isProfileComplete: true,
  });

  const token = generateToken(user._id);
  attachSession(req, user);

  res.created({ user, token }, 'Account created successfully.');
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
    if (!user.isProfileComplete)
      return res.redirect(`${frontendURL}/auth/choose-role?token=${token}&userId=${user._id}`);
    return res.redirect(`${frontendURL}/auth/success?token=${token}`);
  } 
  
  // If no frontend URL is configured (e.g. testing phase), just return JSON
  res.success({ 
    user, 
    token, 
    nextStep: !user.isProfileComplete ? '/api/auth/google/set-role' : 'none' 
  }, 'Google Login successful. (No CLIENT_URL set for redirect)');
};

// POST /api/auth/google/set-role
const setRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { role, isProfileComplete: true },
    { new: true }
  );

  if (req.session) req.session.role = role;

  res.success({ user }, 'Role set successfully.');
});

module.exports = { register, login, logout, getMe, googleCallback, setRole };