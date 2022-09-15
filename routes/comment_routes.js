
const noticeModel = require('../model/mongoose_models/notice_model');
const user_model = require('../model/mongoose_models/user_model');
const { sendJsonWithTokens } = require('../services/response_sendjson');
const { isValidObjectId } = require('mongoose');
const express = require("express");
const mailServices = require("../services/mail_services");
const router = express.Router();
const socketManager = require("../services/socket_manager");
const socketServices = require("../services/socket_services")(socketManager.getIo());
const notification_types = require("../model/data_helper_models/notification_types");
const notificationModel = require("../model/api_models/notification_model");
const error_handling_services = require('../services/error_handling_services');
const error_types = require('../model/api_models/error_types');
const mongoose = require('mongoose');
const userModel = require('../model/mongoose_models/user_model');
const soldNoticesModel = require('../model/mongoose_models/sold_notice_model');



router.post("/add_comment",  async (req, res, next)=>{

  const notice_id = req.body.notice_id;
  const content = req.body.content;

  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));

  if(!isValidObjectId(notice_id)){
    return next(new Error(error_handling_services(error_types.invalidValue,"notice id")));
  }

  if(!content || content.length<1){
    return next(new Error(error_handling_services(error_types.invalidValue,"content")));
  }
  
  try {
	  const notice = await noticeModel.findById(notice_id).select("details price_details notice_questions").populate("saler_user","email");
    if(!notice._id){
      return next(new Error(error_handling_services(error_types.dataNotFound,"notice")));
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

    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }

});

router.post("/add_answer",  async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const comment_id = req.body.comment_id;
  const content = req.body.content;

  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,"notice id")));
  if(!comment_id) return next(new Error(error_handling_services(error_types.dataNotFound,"comment id")));
  if(!isValidObjectId(comment_id)) return next(new Error(error_handling_services(error_types.invalidValue,"comment id")));
  if(!content || content.length<1) return next(new Error(error_handling_services(error_types.dataNotFound,"content")));

  try {
	  const notice = await noticeModel.findById(notice_id).populate();
	  if(!notice) return next(new Error(error_handling_services(error_types.dataNotFound,"notice")));
	  const comment = notice.notice_questions.id(comment_id);
	  if(!comment) return next(new Error(error_handling_services(error_types.dataNotFound,"comment")));
	  comment.answers.push( { 
	    date: new Date(),
	    user: req.decoded.id,
	    content: content,
	  })
	  await notice.save();
    const user = await user_model.findById(req.decoded.id).select("username");
    const commenter_user = await user_model.findById(comment.question.user).select("email");
    if(!commenter_user) return next(new Error(error_handling_services(error_types.dataNotFound,"commenter user")));
    if(!user) return next(new Error(error_handling_services(error_types.dataNotFound,"user")));
    mailServices.newAnswerMail(commenter_user.email, user.username, notice.profile_photo, notice.details.brand, notice.details.category.detail_category, "http://localhost:3200/pug");

    const notification = new notificationModel(
      `@${user.username} soruna yorumuna cevap verdi!`,
      `"${content}"`,
      notification_types.comment,
      new Date(),
      [{item_id:user.id, item_type:"user"}, {item_id:notice.id, item_type:"notice"}],
    );
    socketServices.emitNotificationOneUser(notification,commenter_user.id);
	  return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_comments", async (req, res, next)=>{
  const notice_id = req.body.notice_id;

  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,"notice id")));

  try {
    const comments = await noticeModel.findById(notice_id).select("notice_questions");
    if(!comments) return next(new Error(error_handling_services(error_types.dataNotFound,"comments")));
    return res.send(sendJsonWithTokens(req, comments));
  } catch (error) {
    return next(error);
  }

})

router.delete("/delete_comment",  async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const comment_id = req.body.comment_id;
  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,"notice id")));
  if(!comment_id) return next(new Error(error_handling_services(error_types.dataNotFound,"comment id")));
  if(!isValidObjectId(comment_id)) return next(new Error(error_handling_services(error_types.invalidValue,"comment id")));

  try {
    const notice = await noticeModel.findById(notice_id).select("notice_questions");
    const comment = notice.notice_questions.id(comment_id);
    if(comment.question.user != req.decoded.id) return next(new Error(error_handling_services(error_types.authorizationError,"you cannot delete this comment")));
    const result = await noticeModel.findByIdAndUpdate(notice_id, {$pull: {
      notice_questions: {"_id": comment_id},
    }});
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.delete("/delete_answer", async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const comment_id = req.body.comment_id;
  const answer_id = req.body.answer_id;
  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,"notice id")));
  if(!comment_id) return next(new Error(error_handling_services(error_types.dataNotFound,"comment id")));
  if(!isValidObjectId(comment_id)) return next(new Error(error_handling_services(error_types.invalidValue,"comment id")));
  if(!answer_id) return next(new Error(error_handling_services(error_types.dataNotFound,"answer id")));
  if(!isValidObjectId(answer_id)) return next(new Error(error_handling_services(error_types.invalidValue,"answer id")));

  try {
	  const notice = await noticeModel.findById(notice_id).select("notice_questions");
    if(!notice) return next(new Error("notice not found"));
    const answer = notice.notice_questions.id(comment_id).answers.id(answer_id);
    if(!answer) return next(new Error("answer not found"));
    if(answer.user != req.decoded.id) return next(new Error("authorization fail"));
    answer.remove();
    await notice.save();
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }

})

router.post("/add_rating", async(req, res, next) => {
  const sold_notice_id = req.body.sold_notice_id;
  const user_id = req.body.user_id;
  let content = req.body.content;
  const communication_rate = req.body.communication_rate;
  const validity_rate = req.body.validity_rate;
  const packing_rate = req.body.packing_rate;

  if(!sold_notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"sold notice id")));
  if(!mongoose.isValidObjectId(sold_notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,sold_notice_id)));
  if(!user_id) return next(new Error(error_handling_services(error_types.dataNotFound,"user id")));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error(error_handling_services(error_types.invalidValue,user_id)));
  if(content) content = content.trim();

  if(Number.isNaN(Number.parseFloat(communication_rate))) return next(new Error(error_handling_services(error_types.invalidValue,communication_rate)));
  if(Number.isNaN(Number.parseFloat())) return next(new Error(error_handling_services(error_types.invalidValue,validity_rate)));
  if(Number.isNaN(Number.parseFloat(packing_rate))) return next(new Error(error_handling_services(error_types.invalidValue,packing_rate)));

  if(communication_rate<0 ||communication_rate> 5) return next(new Error(error_handling_services(error_types.invalidValue,communication_rate)));
  if(validity_rate<0 ||validity_rate> 5) return next(new Error(error_handling_services(error_types.invalidValue,validity_rate)));
  if(packing_rate<0 ||packing_rate> 5) return next(new Error(error_handling_services(error_types.invalidValue,packing_rate)));

  try {
    const rater_user = await userModel.findById(req.decoded.id).select("username");
    let total_rating = (communication_rate + validity_rate + packing_rate)/3;
    const notice = await soldNoticesModel.findById(sold_notice_id).select("notice saler_user buyer_user payment_total.amount").populate("notice","profile_photo title");
    if(!notice) return next(new Error(error_handling_services(error_types.dataNotFound,"notice")));
    const user = await userModel.findById(user_id).select("username profile_photo saler_score ratings");
    if(!user) return next(new Error(error_handling_services(error_types.dateNotFound,"user")));
    if(notice.saler_user != user._id) return next(new Error(error_handling_services(error_types.invalidValue,"saler user")));
    if(notice.buyer_user != req.decoded.id) return next(new Error(error_handling_services(error_types.authorizationError,"you cannot rate this notice")));

    const result = await user.updateOne({
      $addToSet: {ratings: {
        rater_user: req.decoded.id,
        rating_notice: notice,
        rate_date: new Date(),
        rating_content: content,
        total_rating: total_rating,
        rating_details: {
        communication_rate: communication_rate,
        validity_rate: validity_rate,
        packing_rate: packing_rate
        }
      }}, 
      $inc:{ratings_count: 1},
      $set: {saler_score: (((user.saler_score)*(user.ratings_count)) + total_rating)/(user.ratings_count +1)}
    },);
    const processMessage = result.acknowledged ? "successfuly": "rating sending failed";
    const notification = new notificationModel(
      "Profilin hakkında değerlendirme yapıldı.",
      `@${rater_user.username} değerlendirme yaptı: ${content}`,
      notification_types.rating,
      new Date(),
      [{item_id:req.decoded.id, item_type:"user"},
      {item_id: notice.id, item_type:"sold_notice"}]
    );
    socketServices.emitNotificationOneUser(notification, user_id);
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
});

router.post("/answer_the_rating", async (req, res, next) =>{
  const rating_id = req.body.rating_id;
  const content = req.body.content;
  if(!rating_id) return next(new Error(error_handling_services(error_types.dataNotFound,"rating id")));
  if(!mongoose.isValidObjectId(rating_id)) return next(new Error(error_handling_services(error_types.invalidValue,rating_id)));
  if(!content || content.length<1) return next(new Error(error_handling_services(error_types.dataNotFound,"content")));
  try {
	  const ratings = await userModel.findById(req.decoded.id).select("ratings username");
    const currentUser = ratings;
	  const rating = ratings.ratings.id(rating_id);
    if(!rating) return next(new Error(error_handling_services(error_types.dataNotFound,"rating")));
    if(rating.saler_answer) return next(new Error(error_handling_services(error_types.logicalError,"you already answered this rating")));

    rating.saler_answer = content;
    await ratings.save();
    const notification = new notificationModel(
      "Değerlendirmene cevap verildi.",
      `@${currentUser.username} değerlendirmene yanıt verdi: ${content}`,
      notification_types.rating,
      new Date(),
      [{item_id:currentUser.id, item_type:"user"}, 
      {item_id: rating.rating_notice, item_type: "sold_notice"}]
    );
    socketServices.emitNotificationOneUser(notification, rating.rater_user);
    return res.send(sendJsonWithTokens(req,error_types.success));
	
  } catch (error) {
    return next(error);
  }

})

router.get("/get_user_ratings/:page", async (req, res, next)=>{
  const user_id = req.body.user_id;
  const page = req.params.page;

  if(!user_id) return next(new Error(error_handling_services(error_types.dataNotFound,"user id")));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error(error_handling_services(error_types.invalidValue,user_id)));
  if(Number.isNaN(Number.parseFloat(page))) return next(new Error(error_handling_services(error_types.invalidValue,page)));

  if(page <= 0) return next(new Error(error_handling_services(error_types.invalidValue,page)));

  const ratings = await userModel.findById(user_id).select("ratings _id").populate("ratings.rating_notice","profile_photo title price_details.saling_price");

  const result = ratings.ratings.map(rating => {
    delete rating._doc.rater_user;
    return rating; 
  });

  return res.send(sendJsonWithTokens(req,{
    ratings: result.slice((page-1)*15, (page*15)),
  }));

})



module.exports = router;