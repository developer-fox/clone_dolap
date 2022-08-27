
const mongoose = require('mongoose');

const noticeReportModel = new mongoose.Schema({
  notice: { type: mongoose.SchemaTypes.ObjectId, required: true, ref: "notice"},
  reporter_user : { type: mongoose.SchemaTypes.ObjectId, required: true, ref: "user"},
  report_category : { type: String, required: true, },
  report_detail : { type: String, required: true, },
  report_date : { type: Date, required: true, },
  report_state: { type: String, default: "pending"},
})

module.exports = mongoose.model("notice_report", noticeReportModel, "notice_reports");