const User = require('../models/User');
const Post = require('../models/Post');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .select('-password')
      .populate('followers', 'username profilePicture badges')
      .populate('following', 'username profilePicture badges');
      
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Also fetch their posts
    const posts = await Post.find({ 'author.userId': user._id })
      .sort({ createdAt: -1 })
      .populate('author.userId', 'profilePicture badges');
      
    const likedPosts = await Post.find({ 'likes.userId': user._id })
      .sort({ createdAt: -1 })
      .populate('author.userId', 'profilePicture badges');
      
    const commentedPosts = await Post.find({ 'comments.userId': user._id })
      .sort({ createdAt: -1 })
      .populate('author.userId', 'profilePicture badges');
    
    res.json({ success: true, user, posts, likedPosts, commentedPosts });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update profile or cover picture
exports.updateProfileImages = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { type } = req.body; // 'profile' or 'cover'
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    if (type !== 'profile' && type !== 'cover') {
      return res.status(400).json({ success: false, message: 'Invalid image type. Expected profile or cover.' });
    }

    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          { folder: 'bondly/profiles' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req);

    if (type === 'profile') {
      if (user.profilePicturePublicId) {
        cloudinary.uploader.destroy(user.profilePicturePublicId).catch(() => {});
      }
      user.profilePicture = result.secure_url;
      user.profilePicturePublicId = result.public_id;
    } else if (type === 'cover') {
      if (user.coverPicturePublicId) {
        cloudinary.uploader.destroy(user.coverPicturePublicId).catch(() => {});
      }
      user.coverPicture = result.secure_url;
      user.coverPicturePublicId = result.public_id;
    }

    await user.save();

    res.json({ success: true, user, message: 'Image updated successfully' });
  } catch (error) {
    console.error('Error updating images:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Follow / Unfollow User
exports.toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: "You can't follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({ 
      success: true, 
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing 
    });
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Search Users
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ success: true, users: [] });
    }
    
    // Search by username ignoring case
    const users = await User.find({ 
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user._id } // exclude self
    })
    .select('username profilePicture badges')
    .limit(10);
    
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
