
const mongoose = require('mongoose');
const userReportSchema = new mongoose.Schema({
  reason: {type: String, required: true},
  details: {type: String, required: true},
  reported_user_id: {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "user"},
  reporter_user: {type: mongoose.SchemaTypes.ObjectId, required: true, ref: "user"},
  date: {type: mongoose.SchemaTypes.Date, required: true},
})


module.exports = mongoose.model("user_report",userReportSchema, "user_reports");