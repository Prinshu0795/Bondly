const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../utils/upload');
const {
  createPost,
  getPosts,
  deletePost,
  toggleLike,
  addComment,
} = require('../controllers/postController');

// Public: view feed
router.get('/', getPosts);

// Protected: create, delete, like, comment
router.post('/', auth, upload.single('image'), createPost);
router.delete('/:postId', auth, deletePost);
router.post('/:postId/like', auth, toggleLike);
router.post('/:postId/comments', auth, addComment);

module.exports = router;
