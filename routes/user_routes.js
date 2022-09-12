
const express = require('express');
const mongoose = require('mongoose');
const userModel = require('../model/mongoose_models/user_model');
const { sendJsonWithTokens } = require('../services/response_sendjson');
const user_report_reasons = require('../model/data_helper_models/user_report_reasons');
const user_report_model = require('../model/mongoose_models/user_report_model');
const soldNoticesModel = require('../model/mongoose_models/sold_notice_model');
const notice_get_filters = require('../model/data_helper_models/notice_get_filters');
const notice_get_sorting_parameters = require('../model/data_helper_models/notice_get_sorting_parameters');
const router = express.Router();
const filteringService = require("../services/filtering_service");
const sortingService = require("../services/sorting_service");
const socketManager = require("../services/socket_manager");
const socketServices = require("../services/socket_services")(socketManager.getIo());
const notification_types = require("../model/data_helper_models/notification_types");
const notificationModel = require("../model/data_helper_models/notification_model");

router.get("/get_user_info", async (req, res, next) =>{
  const user_id = req.body.user_id;
  if(!user_id) return next(new Error("user id cannot be empty"));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error("invalid user id"));
  try {
	  const user = await userModel.findById(user_id).select("username profile_description profile_photo last_seen is_validated saler_score followers_count follows_count sold_notices_count favorites_count is_credible_saler average_send_time notices_count ratings_count");
	  if(!user) return next(new Error("user not found"));
	  return res.send(sendJsonWithTokens(req, user));
  } catch (error) {
    return next(error);
  }
});

router.get("/get_user_notices/:page", async (req, res, next)=>{
  const page = Number.parseInt(req.params.page);
  const user_id= req.body.user_id;
  const filters = req.body.filters;
  const sorting = req.body.sort;
  if(!user_id) return next(new Error("user id cannot be empty"));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error("invalid user id"));
  if(Number.isNaN(page)) return next(new Error("page information must be integer"));
  const noticesCount = await userModel.findById(user_id).select("notices_count");
  const pagesCount = Math.ceil(noticesCount.notices_count / 10);  
  if(page <= 0) return next(new Error("invalid page number"));
  if(pagesCount> 0 && page> pagesCount ) return next(new Error("invalid page number"));

  if(filters){
    Object.keys(filters).forEach(key=>{
      if(!notice_get_filters.includes(key)){
        return next(new Error("undefined filter parameter"));
      }
    })
  }

  if(sorting && !Object.values(notice_get_sorting_parameters).includes(sorting)){
    return next(new Error("undefined sorting parameter"));
  }

  try {
	  const notices = await userModel.findById(user_id).select("notices").populate({
      path: "notices",
      select: "profile_photo favorites_count details.brand price_details.saling_price created_date",
    });

    let result = notices.notices;
    if(filters){
      result = filteringService(notices.notices,filters);
    }

    if(sorting){
      result = sortingService(result,sorting)
    }


    return res.send(sendJsonWithTokens(req, {
	    notices: result.slice((page-1)*10, (page*10)),
	    pages_count: pagesCount,
	  }));
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

  if(!sold_notice_id) return next(new Error("notice id cannot be empty"));
  if(!mongoose.isValidObjectId(sold_notice_id)) return next(new Error("invalid notice id"));
  if(!user_id) return next(new Error("user id cannot be empty"));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error("invalid user id"));
  if(content) content = content.trim();

  if(Number.isNaN(Number.parseFloat(communication_rate))) return next(new Error("communication rate must be integer"));
  if(Number.isNaN(Number.parseFloat(validity_rate))) return next(new Error("validity rate must be integer"));
  if(Number.isNaN(Number.parseFloat(packing_rate))) return next(new Error("packing rate must be integer"));

  if(communication_rate<0 ||communication_rate> 5) return next(new Error("invalid rate value"));
  if(validity_rate<0 ||validity_rate> 5) return next(new Error("invalid rate value"));
  if(packing_rate<0 ||packing_rate> 5) return next(new Error("invalid rate value"));

  try {
    const rater_user = await userModel.findById(req.decoded.id).select("username");
    let total_rating = (communication_rate + validity_rate + packing_rate)/3;
    const notice = await soldNoticesModel.findById(sold_notice_id).select("notice saler_user buyer_user payment_total.amount").populate("notice","profile_photo title");
    if(!notice) return next(new Error("notice not found"));
    const user = await userModel.findById(user_id).select("username profile_photo saler_score ratings");
    if(!user) return next(new Error("user not found"));
    if(notice.saler_user != user._id) return next(new Error("wrong saler information"));
    if(notice.buyer_user != req.decoded.id) return next(new Error("wrong buyer user"));

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
    return res.send(sendJsonWithTokens(req,processMessage));
  } catch (error) {
    return next(error);
  }
});

router.post("/answer_the_rating", async (req, res, next) =>{
  const rating_id = req.body.rating_id;
  const content = req.body.content;
  if(!rating_id) return next(new Error("rating id cannot be empty"));
  if(!mongoose.isValidObjectId(rating_id)) return next(new Error("invalid rating id"));
  if(!content || content.length<1) return next(new Error("content cannot be empty/null"));
  try {
	  const ratings = await userModel.findById(req.decoded.id).select("ratings username");
    const currentUser = ratings;
	  const rating = ratings.ratings.id(rating_id);
    if(!rating) return next(new Error("rating not found"));
    if(rating.saler_answer) return next(new Error("you cant add a new answer"));

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
    return res.send(sendJsonWithTokens(req,"successfuly"));
	
  } catch (error) {
    return next(error);
  }

})

router.get("/get_user_ratings/:page", async (req, res, next)=>{
  const user_id = req.body.user_id;
  const page = req.params.page;

  if(!user_id) return next(new Error("user id cannot be empty"));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error("invalid user id"));
  if(Number.isNaN(Number.parseFloat(page))) return next(new Error("page parameter must be a number"));

  if(page <= 0) return next(new Error("invalid page number"));

  const ratings = await userModel.findById(user_id).select("ratings _id").populate("ratings.rating_notice","profile_photo title price_details.saling_price");

  const result = ratings.ratings.map(rating => {
    delete rating._doc.rater_user;
    return rating; 
  });

  const pagesCount = Math.ceil(result.length / 15);  

  return res.send(sendJsonWithTokens(req,{
    ratings: result.slice((page-1)*15, (page*15)),
    page_count: pagesCount
  }));

})

router.post("/follow_user", async (req, res, next)=>{
  let user_id = req.body.user_id;
  if(!user_id) return next(new Error("user id cannot be empty"));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error("invalid user id"));
  try {
	
	  const currentUser = await userModel.findById(req.decoded.id).select("follows follows_count username");
	  if(!currentUser) return next(new Error("an error detected"));
    if(currentUser.follows.includes(user_id)) return next(new Error("you already following this user "));
    await currentUser.updateOne({$addToSet: {follows: user_id}, $inc: {follows_count: 1}});
    
    const notification = new notificationModel(
      "Yeni bir takipçin var!",
      `@${currentUser.username} seni takip etmeye başladı.`,
      notification_types.newFollower,
      new Date(),
      [{item_id:currentUser.id, item_type:"user"}]
    );

    socketServices.emitNotificationOneUser(notification, user_id);
    return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }

})

router.post("/unfollow_user", async (req, res, next)=>{
  let user_id = req.body.user_id;
  if(!user_id) return next(new Error("user id cannot be empty"));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error("invalid user id"));
  try {
	
	  const currentUserFollowsList = await userModel.findById(req.decoded.id).select("follows follows_count");
	  if(!currentUserFollowsList) return next(new Error("an error detected"));
    if(!currentUserFollowsList.follows.includes(user_id)) return next(new Error("you already not follow this user"));
  
    await currentUserFollowsList.updateOne({$pull: {follows: user_id}, $inc: {follows_count: -1}});

    return res.send(sendJsonWithTokens(req,"successfuly"));

  } catch (error) {
    return next(error);
  }

})

router.get("/get_follows", async (req, res, next)=>{
  try {
    const result = await userModel.findById(req.decoded.id).select("follows").populate("follows", "profile_photo notices_count sold_notices_count username");
    if(!result) return next(new Error("an error detected when data getting"));
    return res.send(sendJsonWithTokens(req,result.follows));
  } catch (error) {
    return next(error);
  }

})

router.get("/get_followers", async (req, res, next)=>{
  try {
    const result = await userModel.findById(req.decoded.id).select("followers").populate("followers", "profile_photo notices_count sold_notices_count username");
    if(!result) return next(new Error("an error detected when data getting"));
    return res.send(sendJsonWithTokens(req,result.followers));
  } catch (error) {
    return next(error);
  }

})

router.post("/report_user", async (req, res, next)=>{
  const reason = req.body.report_reason;
  const content = req.body.content;
  const user_id = req.body.user_id;

  if(!user_id) return next(new Error("user id cannot be empty"));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error("invalid user id"));
  if(!content) return next(new Error("content cannot be empty"));
  if(!reason || !user_report_reasons.includes(reason)) return next(new Error("invalid report reason"));
  
  try {
    const newReport = new user_report_model({
      date: new Date(),
      details: content,
      reported_user_id: user_id,
      reporter_user: req.decoded.id,
      reason: reason
    })

    const result = await newReport.save();
    if(!result._id) return next(new Error("error detected when report sending"));
    return res.send(sendJsonWithTokens(req,"successfuly"));

  } catch (error) {
    return next(error);
  }

})

module.exports= router;