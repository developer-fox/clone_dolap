
const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
  notification_category: {type: String, required: true},
  Notification_title: {type: String, required: true},
  Notification_subtitle: {type: String, required: true},
  notification_date: {type: Date, required: true},
  is_seen: {type: Boolean, default: false},
  notification_relating_id: {type: mongoose.SchemaTypes.ObjectId, required: false},
});