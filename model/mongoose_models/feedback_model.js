
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.SchemaTypes.ObjectId, 
    required: true,
    ref: "user"
  },
  feedback_reason: {type: String, required: true},
  feedback_subject: {type: String, required: true},
  feedback_content: {type: String, required: true},
  feedback_date: {type: Date, required: true},
})


module.exports = mongoose.model("feedback",feedbackSchema, "feedbacks");