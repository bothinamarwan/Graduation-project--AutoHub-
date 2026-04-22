const Dealer         = require('../models/Dealer');
const Post           = require('../models/Post');
const asyncHandler   = require('../utils/asyncHandler');
const { getFileUrl } = require('../utils/Imagehelper');
const { getPaginationParams, buildPagination } = require('../utils/Paginate');

// GET /api/dealers/me/profile
const getProfile = asyncHandler(async (req, res) => {
  let dealer = await Dealer.findOne({ user: req.user._id }).populate('user', 'name email avatar');

  if (!dealer) {
    dealer = await Dealer.create({ user: req.user._id, businessName: req.user.name, phone: req.user.phone || '' });
    dealer  = await dealer.populate('user', 'name email avatar');
  }

  res.success({ dealer });
});

// GET /api/dealers/:dealerId  (public)
const getPublicProfile = asyncHandler(async (req, res) => {
  const dealer = await Dealer.findOne({ user: req.params.dealerId })
    .populate('user', 'name email avatar');

  if (!dealer) return res.fail('Dealer not found.', 404);

  const posts = await Post.find({ dealer: req.params.dealerId, isActive: true })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  res.success({ dealer, posts });
});

// PUT /api/dealers/me/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { businessName, description, phone, whatsapp, city, address, googleMapsUrl, facebook, instagram, website } = req.body;

  const updates = {};
  if (businessName) updates.businessName = businessName;
  if (description)  updates.description  = description;
  if (phone)        updates.phone        = phone;
  if (whatsapp)     updates.whatsapp     = whatsapp;

  if (city || address || googleMapsUrl)
    updates.location = { city, address, googleMapsUrl };

  if (facebook || instagram || website)
    updates.socialLinks = { facebook, instagram, website };

  if (req.files?.logo)       updates.logo       = getFileUrl(req, req.files.logo[0]);
  if (req.files?.coverImage) updates.coverImage = getFileUrl(req, req.files.coverImage[0]);

  const dealer = await Dealer.findOneAndUpdate(
    { user: req.user._id },
    updates,
    { new: true, upsert: true, runValidators: true }
  ).populate('user', 'name email avatar');

  res.success({ dealer }, 'Dealer profile updated.');
});

// GET /api/dealers/me/posts
const getMyPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status } = req.query;

  const filter = { dealer: req.user._id };
  if (status === 'active')   filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  const [posts, total] = await Promise.all([
    Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Post.countDocuments(filter),
  ]);

  res.success({ posts }, 'Posts fetched.', 200, buildPagination(total, page, limit));
});

// GET /api/dealers/me/stats
const getStats = asyncHandler(async (req, res) => {
  const stats = await Post.aggregate([
    { $match: { dealer: req.user._id } },
    { $group: {
      _id:         null,
      totalPosts:  { $sum: 1 },
      activePosts: { $sum: { $cond: ['$isActive', 1, 0] } },
      totalLikes:  { $sum: '$likesCount' },
    }},
  ]);

  res.success(stats[0] || { totalPosts: 0, activePosts: 0, totalLikes: 0 });
});

module.exports = { getProfile, getPublicProfile, updateProfile, getMyPosts, getStats };