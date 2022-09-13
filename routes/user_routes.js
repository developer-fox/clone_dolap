
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
const error_types = require('../model/api_models/error_types');
const error_handling_services = require('../services/error_handling_services');

router.get("/get_user_info", async (req, res, next) =>{
  const user_id = req.body.user_id;
  if(!user_id) return next(new Error(error_handling_services(error_types.dataNotFound,"user id")));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error(error_handling_services(error_types.invalidValue,user_id)));
  try {
	  const user = await userModel.findById(user_id).select("username profile_description profile_photo last_seen is_validated saler_score followers_count follows_count sold_notices_count favorites_count is_credible_saler average_send_time notices_count ratings_count");
	  if(!user) return next(new Error(error_handling_services(error_types.dataNotFound,"user")));
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
  if(!user_id) return next(new Error(error_handling_services(error_types.dataNotFound,"user id")));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error(error_handling_services(error_types.invalidValue,user_id)));
  if(Number.isNaN(page)) return next(new Error(error_handling_services(error_types.invalidValue,page)));
  const noticesCount = await userModel.findById(user_id).select("notices_count");
  const pagesCount = Math.ceil(noticesCount.notices_count / 10);  
  if(page <= 0) return next(new Error(error_handling_services(error_types.invalidValue,page)));
  if(pagesCount> 0 && page> pagesCount ) return next(new Error(error_handling_services(error_types.invalidValue,page)));

  if(filters){
    Object.keys(filters).forEach(key=>{
      if(!notice_get_filters.includes(key)){
        return next(new Error(error_handling_services(error_types.invalidValue,key)));
      }
    })
  }

  if(sorting && !Object.values(notice_get_sorting_parameters).includes(sorting)){
    return next(new Error(error_handling_services(error_types.invalidValue,sorting)));
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

router.post("/follow_user", async (req, res, next)=>{
  let user_id = req.body.user_id;
  if(!user_id) return next(new Error(error_handling_services(error_types.dataNotFound,"user id")));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error(error_handling_services(error_types.invalidValue,user_id)));
  try {
	  const currentUser = await userModel.findById(req.decoded.id).select("follows follows_count username");
    if(currentUser.follows.includes(user_id)) return next(new Error(error_handling_services(error_types.logicalError,"you already following this user")));
    await currentUser.updateOne({$addToSet: {follows: user_id}, $inc: {follows_count: 1}});
    
    const notification = new notificationModel(
      "Yeni bir takipçin var!",
      `@${currentUser.username} seni takip etmeye başladı.`,
      notification_types.newFollower,
      new Date(),
      [{item_id:currentUser.id, item_type:"user"}]
    );

    socketServices.emitNotificationOneUser(notification, user_id);
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.post("/unfollow_user", async (req, res, next)=>{
  let user_id = req.body.user_id;
  if(!user_id) return next(new Error(error_handling_services(error_types.dataNotFound,"user id")));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error(error_handling_services(error_types.invalidValue,user_id)));
  try {
	  const currentUserFollowsList = await userModel.findById(req.decoded.id).select("follows follows_count");
    if(!currentUserFollowsList.follows.includes(user_id)) return next(new Error(error_handling_services(error_types.logicalError,"you already not following this user")));  
    await currentUserFollowsList.updateOne({$pull: {follows: user_id}, $inc: {follows_count: -1}});
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_follows", async (req, res, next)=>{
  try {
    const result = await userModel.findById(req.decoded.id).select("follows").populate("follows", "profile_photo notices_count sold_notices_count username");
    return res.send(sendJsonWithTokens(req,result.follows));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_followers", async (req, res, next)=>{
  try {
    const result = await userModel.findById(req.decoded.id).select("followers").populate("followers", "profile_photo notices_count sold_notices_count username");
    return res.send(sendJsonWithTokens(req,result.followers));
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

module.exports= router;