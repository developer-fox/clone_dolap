

const noticeModel = require('../model/mongoose_models/notice_model');
const brands = require('../model/data_helper_models/brands.json');
const useCases = require('../model/data_helper_models/notice_use_cases');
const colors = require('../model/data_helper_models/colors');
const cargo_sizes = require('../model/data_helper_models/cargo_sizes');
const cargo_payers = require('../model/data_helper_models/cargo_payers');
const user_model = require('../model/mongoose_models/user_model');
const { sendJsonWithTokens } = require('../services/response_sendjson');
const { isValidObjectId } = require('mongoose');
const express = require("express");
const mailServices = require("../services/mail_services");
const router = express.Router();
const socketManager = require("../services/socket_manager");
const socketServices = require("../services/socket_services")(socketManager.getIo());
const notification_types = require("../model/data_helper_models/notification_types");
const notificationModel = require("../model/data_helper_models/notification_model");

router.post("/add_comment",  async (req, res, next)=>{

  const notice_id = req.body.notice_id;
  const content = req.body.content;

  if(!notice_id) return next(new Error("notice id cannot be empty"));

  if(!isValidObjectId(notice_id)){
    return next(new Error("invalid notice id data"));
  }

  if(!content || content.length<1){
    return next(new Error("content cannot be empty"));
  }
  
  try {
	  const notice = await noticeModel.findById(notice_id).select("details price_details notice_questions").populate("saler_user","email");
    if(!notice._id){
      return next(new Error("notice not found"));
    }
    notice.notice_questions.push({
	    question: {
	        date: new Date(),
	        user: req.decoded.id,
	        content: content,
	    },
	    }
	  );
	  await notice.save();

    const user = await user_model.findById(req.decoded.id).select("username");
    mailServices.newCommentMail(notice.saler_user.email,user.username, notice.profile_photo,notice.details.brand, notice.price_details.saling_price, content, notice.details.category.detail_category,"http://localhost:3200/");
    
    const notification = new notificationModel(
      `${notice.details.brand} marka ${notice.details.category.detail_category} ürününe yorum yapıldı!`,
      `@${user.username} yorum yaptı: ${content}`,
      notification_types.comment,
      new Date(),
      [{item_id:user.id, item_type:"user"}, {item_id:notice.id, item_type:"notice"}],
    );
    socketServices.emitNotificationOneUser(notification,notice.saler_user.id);

    return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }

});

router.post("/add_answer",  async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const comment_id = req.body.comment_id;
  const content = req.body.content;

  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(!comment_id) return next(new Error("comment id cannot be empty"));
  if(!isValidObjectId(comment_id)) return next(new Error("invalid comment id"));
  if(!content || content.length<1) return next(new Error("content cannot be empty"));

  try {
	  const notice = await noticeModel.findById(notice_id).populate();
	  if(!notice) return next(new Error("notice not found"));
	  const comment = notice.notice_questions.id(comment_id);
	  if(!comment) return next(new Error("comment not found"));
	  comment.answers.push( { 
	    date: new Date(),
	    user: req.decoded.id,
	    content: content,
	  })
	  await notice.save();
    const user = await user_model.findById(req.decoded.id).select("username");
    const commenter_user = await user_model.findById(comment.question.user).select("email");
    if(!commenter_user) return next(new Error("user not found"));
    if(!user) return next(new Error("user not found"));
    mailServices.newAnswerMail(commenter_user.email, user.username, notice.profile_photo, notice.details.brand, notice.details.category.detail_category, "http://localhost:3200/pug");

    const notification = new notificationModel(
      `@${user.username} soruna yorumuna cevap verdi!`,
      `"${content}"`,
      notification_types.comment,
      new Date(),
      [{item_id:user.id, item_type:"user"}, {item_id:notice.id, item_type:"notice"}],
    );
    socketServices.emitNotificationOneUser(notification,commenter_user.id);
	  return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_comments", async (req, res, next)=>{
  const notice_id = req.body.notice_id;

  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));

  try {
    const comments = await noticeModel.findById(notice_id).select("notice_questions -_id");
    if(!comments) return next(new Error("invalid comments taken"));
    return res.send(sendJsonWithTokens(req, comments));
  } catch (error) {
    return next(error);
  }

})

router.delete("/delete_comment",  async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const comment_id = req.body.comment_id;
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(!comment_id) return next(new Error("comment id cannot be empty"));
  if(!isValidObjectId(comment_id)) return next(new Error("invalid comment id"));

  try {
    const notice = await noticeModel.findById(notice_id).select("notice_questions");
    const comment = notice.notice_questions.id(comment_id);
    if(comment.question.user != req.decoded.id) return next(new Error("authorization fail"));
    const result = await noticeModel.findByIdAndUpdate(notice_id, {$pull: {
      notice_questions: {"_id": comment_id},
    }});
    return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }
})

router.delete("/delete_answer", async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const comment_id = req.body.comment_id;
  const answer_id = req.body.answer_id;
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(!comment_id) return next(new Error("comment id cannot be empty"));
  if(!isValidObjectId(comment_id)) return next(new Error("invalid comment id"));
  if(!answer_id) return next(new Error("answer id cannot be empty"));
  if(!isValidObjectId(answer_id)) return next(new Error("invalid answer id"));

  try {
	  const notice = await noticeModel.findById(notice_id).select("notice_questions");
    if(!notice) return next(new Error("notice not found"));
    const answer = notice.notice_questions.id(comment_id).answers.id(answer_id);
    if(!answer) return next(new Error("answer not found"));
    if(answer.user != req.decoded.id) return next(new Error("authorization fail"));
    answer.remove();
    await notice.save();
    return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }


})


module.exports = router;