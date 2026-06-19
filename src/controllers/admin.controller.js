const User = require('../models/User');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const { getPaginationParams, buildPagination } = require('../utils/Paginate');

/**
 * getStats
 * GET /api/admin/stats
 * Retrieves administrative dashboard statistics (users, dealers, post counts by status).
 */
const getStats = asyncHandler(async (req, res) => {
  const [userCount, dealerCount, totalUsers] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'dealer' }),
    User.countDocuments()
  ]);

  const postStats = await Post.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const postCounts = { pending: 0, approved: 0, rejected: 0, total: 0 };
  postStats.forEach(item => {
    if (item._id && item._id in postCounts) {
      postCounts[item._id] = item.count;
      postCounts.total += item.count;
    }
  });

  res.success({
    users: {
      standardUsers: userCount,
      dealers: dealerCount,
      totalUsers: totalUsers
    },
    posts: postCounts
  }, 'Admin statistics retrieved successfully.');
});

/**
 * getModerationPosts
 * GET /api/admin/posts
 * Retrieves posts for moderation, with optional status and text filters.
 */
const getModerationPosts = asyncHandler(async (req, res) => {
  const { status, brand, model, search } = req.query;
  const { page, limit, skip } = getPaginationParams(req.query);

  const filter = { isActive: true };
  if (status) filter.status = status;
  if (brand) filter.brand = new RegExp(brand, 'i');
  if (model) filter.model = new RegExp(model, 'i');
  if (search) filter.$text = { $search: search };

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate('dealer', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter)
  ]);

  res.success(
    { posts },
    'Moderation posts fetched.',
    200,
    buildPagination(total, page, limit)
  );
});

/**
 * updatePostStatus
 * PATCH /api/admin/posts/:id/status
 * Updates the moderation status (approved/rejected/pending) of a dealer post.
 */
const updatePostStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.fail('Invalid status. Must be pending, approved, or rejected.', 400);
  }

  const post = await Post.findById(id).populate('dealer', 'name email');
  if (!post) {
    return res.fail('Post not found.', 404);
  }

  post.status = status;
  await post.save();

  res.success({ post }, `Post status successfully updated to '${status}'.`);
});

/**
 * updateUserRole
 * PATCH /api/admin/users/:id/role
 * Updates a user's role (user, dealer, admin) and prevents self-demotion.
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Prevent self-demotion
  if (req.user._id.toString() === id) {
    return res.fail('You cannot change your own role.', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    return res.fail('User not found.', 404);
  }

  user.role = role;
  await user.save();

  res.success({ user }, `User role updated successfully to '${role}'.`);
});

module.exports = {
  getStats,
  getModerationPosts,
  updatePostStatus,
  updateUserRole
};
