const Contact = require('../models/Contact');

exports.submitContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Sabhi fields zaroori hain.'
      });
    }

    const contact = await Contact.create({ name, email, phone, message });

    res.status(201).json({
      success: true,
      message: 'Message bhej diya gaya. Hum jaldi sampark karenge.',
      data: { id: contact._id }
    });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};