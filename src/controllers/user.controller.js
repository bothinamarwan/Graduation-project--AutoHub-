// const asynchandler = require('express-async-handler'); //async function catch errors without try catch
// const User = require('../models/User');
// const generateToken = require('../utilities/generateToken');//jwt token generation utility
// const user = require('../models/User');
// ///////////////////User Registration Controller/////////////////////
// const registerUser = asynchandler(async(req, res) => {
//     // controller func. async bec we use await
//     const { username, email, password, role } = req.body; //distructing , bring data from req.body and store them in this const's
//     const userExists = await User.findOne({ email }); //chick if there is user has same mail
//     if (userExists) {
//         res.status(400); //bad req there is user problem 
//         throw new Error('User already exists'); //error stop runing the code (throw with async handler)
//     }
//     const user = await User.create({ //insert new user in db
//         username,
//         email,
//         password,
//         role :role || 'user'
//     })
//     if (user){
//         //201 = created return user data and JWT directly loggedin after reg.
//         res.status(201).json({
//             _id: user._id,
//             username: user.username,
//             email: user.email,
//             role: user.role,
//             token: generateToken(user._id)

//         })

//     } 
//     else {
//         res.status(400)
//         throw new Error("invalid user data")
//     }


// });   
// module.exports={registerUser}
// //once server response new user front store token in cookies or localStorage
// /*if someone stole user token he can act like original user in account hacker can stole token from 
// localstorage so front most store the token in http only cookie*/

// /////////////////////////////////userlogin//////////////////////
// const loginUser = asynchandler(async (req,res) => {
//     const {email,password} = req.body
//     const user = await User.findOne({email})
//     if (user && (await user.matchPassword(password))){
//         res.json({
//             _id: user._id,
//             username: user.username,
//             email: user.email,
//             role: user.role,
//             token: generateToken(user._id)
//         })
//     }
//     else{
//         res.status(401)
//         throw new Error('invalid email or password')
//     }
// }) 
// ///////////////////////get profile/////////////////
// const getuserprofile = asynchandler(async (req,res) => {
//     const user = await User.findById(req.user._id)
//     if(user){
//         res.json({
//             _id: user._id,
//              username: user.username,
//             email: user.email,
//             role: user.role
//         })
       
//     }
//      else{
//             res.status(404)
//             throw new Error ('user not found')
//         }
    
// })
// ///////////////////update profile///////////////////
// const updateuserprofile = asynchandler(async (req,res) => {
//     const user = await User.findById(req.user._id)
//     if (user){
//         user.username = req.body.username || user.username
//         user.email = req.body.email || user.email
//         if(req.body.password) user.password = req.body.password
//         user.role = req.body.role || user.role
//       const updateduser = await user.save()
//     res.json({
//         _id: updateduser._id,
//         username: updateduser.username,
//         email : updateduser.email,
//         role: updateduser.role,
//         token: generateToken(updateduser._id)
//     })
//     }
//     else{
//         res.status(404)
//         throw new Error('user not found')
//     }   
// })
// //////////////////////////////////delete user profile///////////
// const deleteuserprofile = asynchandler(async (req,res) => {
//     const user = await User.findById(req.user._id)
//     if (user){
//         await user.remove()
//         res.json({message: 'your account has been deleted successfully'})
//     }
//     else {
//         res.status(404)
//         throw new Error ('user not found')
//     }
    
// })
// module.exports = {
//     registerUser,
//     loginUser,
//     getuserprofile,
//     updateuserprofile,
//     deleteuserprofile
// }

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