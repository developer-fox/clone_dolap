
const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
  notification_category: {type: String, required: true},
  Notification_title: {type: String, required: true},
  Notification_subtitle: {type: String, required: true},
  notification_date: {type: Date, required: true},
  is_seen: {type: Boolean, default: false},
  notification_items: [{
    type: {
      item_id: mongoose.SchemaTypes.ObjectId,
      item_type: String
    },
  }],
});