const Post = require('../models/Post');
const fs = require('fs');
const path = require('path');

exports.createPost = async (req, res) => {
  try {
    const text = req.body.text?.trim() || '';
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

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

    const [posts, totalPosts] = await Promise.all([
      Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('author.userId', 'profilePicture badges'),
      Post.countDocuments(),
    ]);

    res.json({
      success: true,
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (err) {
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
    if (post.imageUrl) {
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
