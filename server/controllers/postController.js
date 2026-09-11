const Post = require('../models/Post');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

exports.createPost = async (req, res) => {
  try {
    const text = req.body.text?.trim() || '';
    let imageUrl = '';
    let imagePublicId = '';

    if (req.file) {
      let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream(
            { folder: 'bondly/posts' },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };
      
      const result = await streamUpload(req);
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    if (!text && !imageUrl) {
      return res.status(400).json({ success: false, message: 'Post must contain at least text or an image' });
    }

    let post = await Post.create({
      author: {
        userId: req.user._id,
        username: req.user.username,
      },
      text,
      imageUrl,
      imagePublicId,
    });

    post = await post.populate('author.userId', 'profilePicture badges');

    res.status(201).json({ success: true, post });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error creating post' });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const tab = req.query.tab || 'All Post';

    let filter = {};

    if (tab === 'For You') {
      let userId = null;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
        } catch(e) {}
      }
      
      if (userId) {
        const User = require('../models/User');
        const currentUser = await User.findById(userId);
        if (currentUser && currentUser.following && currentUser.following.length > 0) {
          filter = { 'author.userId': { $in: currentUser.following } };
        }
      }
    }

    let pipeline = [];
    if (Object.keys(filter).length > 0) {
      pipeline.push({ $match: filter });
    }

    if (tab === 'Most Liked') {
      pipeline.push({ $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } });
      pipeline.push({ $sort: { likesCount: -1, createdAt: -1 } });
    } else if (tab === 'Most Commented') {
      pipeline.push({ $addFields: { commentsCount: { $size: { $ifNull: ["$comments", []] } } } });
      pipeline.push({ $sort: { commentsCount: -1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Get total posts count for pagination
    let countPipeline = [...pipeline, { $count: 'totalPosts' }];
    const countResult = await Post.aggregate(countPipeline);
    const totalPosts = countResult.length > 0 ? countResult[0].totalPosts : 0;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    let posts = await Post.aggregate(pipeline);

    // Populate author.userId fields
    posts = await Post.populate(posts, { path: 'author.userId', select: 'profilePicture badges' });

    res.json({
      success: true,
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching posts' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own posts' });
    }

    // Clean up uploaded image if it exists
    if (post.imagePublicId) {
      cloudinary.uploader.destroy(post.imagePublicId).catch(() => {});
    } else if (post.imageUrl) {
      const imagePath = path.join(__dirname, '..', post.imageUrl);
      fs.unlink(imagePath, () => {}); // silent fail if file missing
    }

    await Post.findByIdAndDelete(req.params.postId);
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error deleting post' });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const existingIndex = post.likes.findIndex((l) => l.userId.toString() === userId);

    if (existingIndex !== -1) {
      // Unlike — use atomic $pull
      await Post.updateOne(
        { _id: post._id },
        { $pull: { likes: { userId: req.user._id } } }
      );
      return res.json({
        success: true,
        likesCount: post.likes.length - 1,
        likedByCurrentUser: false,
      });
    } else {
      // Like — use atomic $addToSet to prevent duplicates
      await Post.updateOne(
        { _id: post._id },
        { $addToSet: { likes: { userId: req.user._id, username: req.user.username } } }
      );
      return res.json({
        success: true,
        likesCount: post.likes.length + 1,
        likedByCurrentUser: true,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error toggling like' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const comment = {
      userId: req.user._id,
      username: req.user.username,
      text: text.trim(),
      createdAt: new Date(),
    };

    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $push: { comments: comment } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Return the newly added comment (last in array)
    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      comment: newComment,
      commentsCount: post.comments.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error adding comment' });
  }
};
