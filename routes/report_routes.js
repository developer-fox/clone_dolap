
const express = require('express');
const user_model = require('../model/mongoose_models/user_model');
const { sendJsonWithTokens } = require('../services/response_sendjson');
const noticeReportModel = require('../model/mongoose_models/notice_report_model.js');
const router = express.Router();
const error_handling_services = require('../services/error_handling_services');
const user_report_reasons = require('../model/data_helper_models/user_report_reasons');
const user_report_model = require('../model/mongoose_models/user_report_model');
const error_types = require('../model/api_models/error_types');
const { ObjectId } = require("mongodb");
const { default: mongoose, isValidObjectId } = require("mongoose");
const feedback_reasons = require("../model/data_helper_models/feedback_reasons");
const feedback_subjects = require("../model/data_helper_models/feedback_subjects");
const feedback_model = require("../model/mongoose_models/feedback_model");


router.post("/send_feedback", async (req, res, next)=>{
  const feed_content = req.body.feedback_content;
  const feed_subject = req.body.feedback_subject;
  const feed_date = new Date();
  const feed_reason = req.body.feedback_reason;

  if(!Object.values(feedback_reasons).includes(feed_reason)){
    return next(new Error(error_handling_services(error_types.invalidValue,feed_reason)));
  }
  if(!Object.values(feedback_subjects).includes(feed_subject)){
    return next(new Error(error_handling_services(error_types.invalidValue,feed_subject)));
  }
  if(feed_content.length> 1400 || feed_content.length ==0){
    return next(new Error(error_handling_services(error_types.invalidValue,"feedback text length must low than 1400 and mustn't equal 0")));
  }

  const newFeedback = new feedback_model({
    feedback_reason: feed_reason,
    feedback_subject: feed_subject,
    feedback_content: feed_content,
    feedback_date: feed_date,
    user: req.decoded.id,
  });

  try {
    const result = await newFeedback.save();
    const savingFromUserSchema = await user_model.findByIdAndUpdate(req.decoded.id,{$addToSet: {feedbacks:  new ObjectId(result._id)}});
    return res.send(sendJsonWithTokens(req, error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_feedbacks", async (req, res, next)=>{
  const result = await user_model.findById(req.decoded.id).select("feedbacks").populate("feedbacks");
  return res.send(sendJsonWithTokens(req,result.feedbacks));
})

router.post("/report_notice" , async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const report_category = req.body.report_category;
  const report_detail = req.body.report_detail;

  if(!notice_id || !isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,"notice id")));
  if(!report_category) return next(new Error(error_handling_services(error_types.dataNotFound,report_category)));
  if(!report_detail) return next(new Error(error_handling_services(error_types.dataNotFound,"report detail")));

  const new_report = new noticeReportModel({
    notice: notice_id,
    reporter_user: req.decoded.id,
    report_category: report_category,
    report_detail: report_detail,
    report_date: new Date(),
  })

  try {
    const result =  await new_report.save();
    return res.send(sendJsonWithTokens(req, error_types.success));
  } catch (error) {
    return next(error);
  }

})

router.post("/report_user", async (req, res, next)=>{
  const reason = req.body.report_reason;
  const content = req.body.content;
  const user_id = req.body.user_id;

  if(!user_id) return next(new Error(error_handling_services(error_types.dataNotFound,"user id")));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error(error_handling_services(error_types.invalidValue,user_id)));
  if(!content) return next(new Error(error_handling_services(error_types.dataNotFound,"content")));
  if(!reason || !user_report_reasons.includes(reason)) return next(new Error(error_handling_services(error_types.invalidValue,reason)));
  try {
    const newReport = new user_report_model({
      date: new Date(),
      details: content,
      reported_user_id: user_id,
      reporter_user: req.decoded.id,
      reason: reason
    })
    const result = await newReport.save();
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
})


module.exports =router;