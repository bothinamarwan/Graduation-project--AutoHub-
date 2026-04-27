
const User = require('../models/User');
const SavedPost = require('../models/SavedPost');
const Like  = require('../models/Like');
const Post                          = require('../models/Post');
const asyncHandler= require('../utils/asyncHandler');
const { getFileUrl }  = require('../utils/Imagehelper');
const { getPaginationParams, buildPagination } = require('../utils/Paginate');

// GET /api/users/profile
const getProfile = asyncHandler(async (req, res) => {
  res.success({ user: req.user });
});

// PUT /api/users/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const updates = {};
  if (name)     updates.name   = name;
  if (phone)    updates.phone  = phone;
  if (req.file) updates.avatar = getFileUrl(req, req.file);

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.success({ user }, 'Profile updated.');
});

// PUT /api/users/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.fail('Both passwords are required.');

  if (req.user.authProvider === 'google')
    return res.fail('Google accounts cannot change password here.');

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword)))
    return res.fail('Current password is incorrect.', 401);

  user.password = newPassword;
  await user.save();
  res.success({}, 'Password changed successfully.');
});

// GET /api/users/saved-posts
const getSavedPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  const [saved, total] = await Promise.all([
    SavedPost.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'post',
        match: { isActive: true },
        populate: { path: 'dealer', select: 'name phone avatar' },
      }),
    SavedPost.countDocuments({ user: req.user._id }),
  ]);

  const posts = saved.map((s) => s.post).filter(Boolean);
  res.success({ posts }, 'Saved posts fetched.', 200, buildPagination(total, page, limit));
});

// POST /api/users/save-post/:postId  (toggle)
const savePost = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.postId, isActive: true });
  if (!post) return res.fail('Post not found.', 404);

  const existing = await SavedPost.findOne({ user: req.user._id, post: req.params.postId });

  if (existing) {
    await existing.deleteOne();
    return res.success({ saved: false }, 'Post removed from saved.');
  }

  await SavedPost.create({ user: req.user._id, post: req.params.postId });
  res.success({ saved: true }, 'Post saved successfully.');
});

// GET /api/users/liked-posts
const getLikedPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  const [liked, total] = await Promise.all([
    Like.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'post',
        match: { isActive: true },
        populate: { path: 'dealer', select: 'name phone avatar' },
      }),
    Like.countDocuments({ user: req.user._id }),
  ]);

  const posts = liked.map((l) => l.post).filter(Boolean);
  res.success({ posts }, 'Liked posts fetched.', 200, buildPagination(total, page, limit));
});

module.exports = { getProfile, updateProfile, changePassword, getSavedPosts, savePost, getLikedPosts };