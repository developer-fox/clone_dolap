
const express = require('express');
const mongoose = require('mongoose');
const userModel = require('../model/mongoose_models/user_model');
const { sendJsonWithTokens } = require('../services/response_sendjson');
const notice_get_filters = require('../model/data_helper_models/notice_get_filters');
const notice_get_sorting_parameters = require('../model/data_helper_models/notice_get_sorting_parameters');
const router = express.Router();
const filteringService = require("../services/filtering_service");
const sortingService = require("../services/sorting_service");
const socketManager = require("../services/socket_manager");
const socketServices = require("../services/socket_services")(socketManager.getIo());
const notification_types = require("../model/data_helper_models/notification_types");
const notificationModel = require("../model/api_models/notification_model");
const error_types = require('../model/api_models/error_types');
const error_handling_services = require('../services/error_handling_services');


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

router.post("/follow_user", async (req, res, next)=>{
  let user_id = req.body.user_id;
  if(!user_id) return next(new Error(error_handling_services(error_types.dataNotFound,"user id")));
  if(!mongoose.isValidObjectId(user_id)) return next(new Error(error_handling_services(error_types.invalidValue,user_id)));
  try {
	  const currentUser = await userModel.findById(req.decoded.id).select("follows follows_count username");
    if(currentUser.follows.includes(user_id)) return next(new Error(error_handling_services(error_types.logicalError,"you already following this user")));
    await currentUser.updateOne({$addToSet: {follows: user_id}, $inc: {follows_count: 1}});
    await userModel.findByIdAndUpdate(user_id,  {
      $addToSet: {followers: req.decoded.id},
      $inc: {followers_count: 1}
    })

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
    await userModel.findByIdAndUpdate(user_id,  {
      $pull: {followers: req.decoded.id},
      $inc: {followers_count: -1}
    })

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

module.exports= router;