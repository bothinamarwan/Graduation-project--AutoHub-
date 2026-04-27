const Post           = require('../models/Post');
const Like           = require('../models/Like');
const asyncHandler   = require('../utils/asyncHandler');
const { getFileUrls } = require('../utils/Imagehelper');
const { getPaginationParams, buildPagination } = require('../utils/Paginate');

// GET /api/posts
const getAllPosts = asyncHandler(async (req, res) => {
  const { brand, model, bodyType, condition, minPrice, maxPrice, search } = req.query;
  const { page, limit, skip } = getPaginationParams(req.query);

  const filter = { isActive: true };
  if (brand)              filter.brand     = new RegExp(brand, 'i');
  if (model)              filter.model     = new RegExp(model, 'i');
  if (bodyType)           filter.bodyType  = bodyType;
  if (condition)          filter.condition = condition;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) filter.$text = { $search: search };

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate('dealer', 'name phone avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter),
  ]);

  res.success({ posts }, 'Posts fetched.', 200, buildPagination(total, page, limit));
});

// GET /api/posts/:id
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, isActive: true })
    .populate('dealer', 'name phone avatar email')
    .populate('vehicleRef');

  if (!post) return res.fail('Post not found.', 404);
  res.success({ post });
});

// POST /api/posts
const createPost = asyncHandler(async (req, res) => {
  const { title, description, brand, model, bodyType, year, mileage, price, currency, condition, color, transmission, fuelType, contactPhone, paymentOptions } = req.body;

  const images = getFileUrls(req, req.files);
  
  // Format paymentOptions as array if it's a string
  let parsedPaymentOptions = [];
  if (paymentOptions) {
    parsedPaymentOptions = Array.isArray(paymentOptions) ? paymentOptions : paymentOptions.split(',').map(o => o.trim());
  }

  const post = await Post.create({
    dealer: req.user._id,
    title, description, brand, model, bodyType,
    year:    year    ? Number(year)    : undefined,
    mileage: mileage ? Number(mileage) : undefined,
    price: Number(price), currency, condition, color, transmission, fuelType,
    contactPhone: contactPhone || req.user.phone,
    paymentOptions: parsedPaymentOptions,
    images,
  });

  res.created({ post }, 'Post created successfully.');
});

// PUT /api/posts/:id
const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, dealer: req.user._id });
  if (!post) return res.fail('Post not found or not authorized.', 404);

  const allowed = ['title','description','brand','model','bodyType','year','mileage','price','condition','color','transmission','fuelType','contactPhone'];
  allowed.forEach((f) => { if (req.body[f] !== undefined) post[f] = req.body[f]; });

  if (req.files?.length) post.images = [...post.images, ...getFileUrls(req, req.files)];

  await post.save();
  res.success({ post }, 'Post updated.');
});

// DELETE /api/posts/:id
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, dealer: req.user._id });
  if (!post) return res.fail('Post not found or not authorized.', 404);

  post.isActive = false;
  await post.save();
  res.success({}, 'Post deleted.');
});

// POST /api/posts/:id/like  (toggle)
const likePost = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, isActive: true });
  if (!post) return res.fail('Post not found.', 404);

  const existing = await Like.findOne({ user: req.user._id, post: post._id });

  if (existing) {
    await existing.deleteOne();
    await Post.findByIdAndUpdate(post._id, { $inc: { likesCount: -1 } });
    return res.success({ liked: false, likesCount: post.likesCount - 1 }, 'Post unliked.');
  }

  await Like.create({ user: req.user._id, post: post._id });
  await Post.findByIdAndUpdate(post._id, { $inc: { likesCount: 1 } });
  res.success({ liked: true, likesCount: post.likesCount + 1 }, 'Post liked.');
});

// GET /api/posts/dealer/my-posts
const getMyPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  const [posts, total] = await Promise.all([
    Post.find({ dealer: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Post.countDocuments({ dealer: req.user._id }),
  ]);

  res.success({ posts }, 'Posts fetched.', 200, buildPagination(total, page, limit));
});

module.exports = { getAllPosts, getPostById, createPost, updatePost, deletePost, likePost, getMyPosts };