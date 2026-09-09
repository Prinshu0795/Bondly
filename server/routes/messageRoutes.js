const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getConversations, getMessages, sendMessage } = require('../controllers/messageController');

// Get all conversations for current user
router.get('/conversations', auth, getConversations);

// Get messages with a specific user
router.get('/:userId', auth, getMessages);

// Send message to a specific user
router.post('/:userId', auth, sendMessage);

module.exports = router;
