const Message = require('../models/Message');
const User = require('../models/User');

// Get all recent conversations for the current user
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    // Find all users the current user is following or followers (or just all messages to find unique conversation partners)
    // A simple approach is to find all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }]
    }).sort({ createdAt: -1 });

    const conversationPartners = new Map();

    messages.forEach((msg) => {
      const partnerId = msg.sender.toString() === currentUserId.toString() 
        ? msg.receiver.toString() 
        : msg.sender.toString();
        
      if (!conversationPartners.has(partnerId)) {
        conversationPartners.set(partnerId, msg);
      }
    });

    const partnerIds = Array.from(conversationPartners.keys());
    const partners = await User.find({ _id: { $in: partnerIds } }).select('username profilePicture badges');

    const conversations = partners.map(partner => ({
      user: partner,
      lastMessage: conversationPartners.get(partner._id.toString()),
    })).sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get message history with a specific user
exports.getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const receiverId = req.params.userId;
    const senderId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text: text.trim()
    });

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
