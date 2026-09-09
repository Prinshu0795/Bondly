const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../utils/upload');
const {
  getUserProfile,
  updateProfileImages,
  toggleFollow,
  searchUsers
} = require('../controllers/userController');

// Search users
router.get('/search', auth, searchUsers);

// Get profile by username
router.get('/:username', auth, getUserProfile);

// Update profile/cover image
router.put('/upload-images', auth, upload.single('image'), updateProfileImages);

// Toggle follow
router.post('/:id/follow', auth, toggleFollow);

module.exports = router;
