const express = require('express');
const userModel = require('../model/mongoose_models/user_model');
const brands = require('../model/data_helper_models/brands.json');
const useCases = require('../model/data_helper_models/notice_use_cases');
const colors = require('../model/data_helper_models/colors');
const cargo_sizes = require('../model/data_helper_models/cargo_sizes');
const cargo_payers = require('../model/data_helper_models/cargo_payers');
const user_model = require('../model/mongoose_models/user_model');
const { sendJsonWithTokens } = require('../services/response_sendjson');
const { isValidObjectId } = require('mongoose');
const noticeReportModel = require('../model/mongoose_models/notice_report_model.js');
const couponStates = require('../model/data_helper_models/coupon_states.js');
const fs = require("fs");
const commentsRouter = require("./comment_routes");
const notice_states = require('../model/data_helper_models/notice_states');
const get_similar_notices = require('../controllers/get_similar_notices');
const offer_states = require('../model/data_helper_models/offer_states');
const router = express.Router();
const fileService = require('../services/file_services');
const timeoutService = require('../services/timeout_services');
const mailServices = require('../services/mail_services');
const socketManager = require("../services/socket_manager");
const socketServices = require("../services/socket_services")(socketManager.getIo());
const notification_types = require("../model/data_helper_models/notification_types");
const notificationModel = require("../model/api_models/notification_model");
const getUserMostFavoriteCategories = require("../controllers/get_user_most_favorite_categories");
const error_handling_services = require('../services/error_handling_services');
const error_types = require('../model/api_models/error_types');


router.post("/add_notice", async (req, res, next)=>{

  if(!req.body.data.title || req.body.data.title.length < 5){
    return next(new Error(error_handling_services(error_types.invalidValue,"title")));
  }
  if(!req.body.data.description){
    return next(new Error(error_handling_services(error_types.invalidValue,"description")));
  }

  if(!req.body.data.category || Object.keys(req.body.data.category).length<4){
    return next(new Error(error_handling_services(error_types.invalidValue,"category")));
  }

  if(!req.body.data.brand || !Object.values(brands).includes(req.body.data.brand)){
    return next(new Error(error_handling_services(error_types.invalidValue,"brand")));
  }

  if(!req.body.data.use_case || !Object.values(useCases).includes(req.body.data.use_case)){
    return next(new Error(error_handling_services(error_types.invalidValue,"use case")));
  }
  if(!req.body.data.color || !colors.includes(req.body.data.color)){
    return next(new Error(error_handling_services(error_types.invalidValue,"color")));
  }
  if( req.body.data.category.top_category != "Elektronik" &&  !req.body.data.size){
    return next(new Error(error_handling_services(error_types.invalidValue,"size")));
  }

  if(!(req.body.data.size_of_cargo) || (( req.body.data.size_of_cargo != cargo_sizes.large.title) && (req.body.data.size_of_cargo != cargo_sizes.medium.title) && (req.body.data.size_of_cargo != cargo_sizes.small.title))){
    return next(new Error(error_handling_services(error_types.invalidValue,"cargo size")));
  }

  if(!req.body.data.payer_of_cargo || !Object.values(cargo_payers).includes(req.body.data.payer_of_cargo)){
    return next(new Error(error_handling_services(error_types.invalidValue,"cargo payer")));
  }

  if(!req.body.data.price_details || !req.body.data.price_details.buying_price || !req.body.data.price_details.saling_price  || !req.body.data.price_details.selling_with_offer){
    return next(new Error(error_handling_services(error_types.invalidValue,"price informations")));
  }

  const newNotice = new noticeModel({
    title: req.body.data.title,
    description: req.body.data.description,
    details: {
      category: req.body.data.category,
      brand: req.body.data.brand,
      use_case: req.body.data.use_case,
      color: req.body.data.color,
      size: req.body.data.size,
      size_of_cargo: req.body.data.size_of_cargo,
    },
    payer_of_cargo: req.body.data.payer_of_cargo,
    price_details: {
      buying_price: req.body.data.price_details.buying_price,
      saling_price: req.body.data.price_details.saling_price,
      selling_with_offer: req.body.data.price_details.selling_with_offer,
      initial_price: req.body.data.price_details.saling_price,
    },
    saler_user: req.decoded.id,
    created_date: new Date(),
  });

  try {
    const access = await newNotice.save();

    const user = await userModel.findById(req.decoded.id).select("followers username");

    for await(let follower of user.followers){
      const notification = new notificationModel(
        `@${user.username} yeni bir ürün ekledi.`,
        `Takip ettiğin @${user.username}, dolabına yeni bir ürün ekledi!`,
        notification_types.followingUserAddedNewNotice,
        new Date(),
        [{item_id: newNotice.id, item_type: "notice",},],
      )
      socketServices.emitNotificationOneUser(notification,follower);  
    }
    
    const result = await user_model.findByIdAndUpdate(req.decoded.id, {$addToSet: {notices: access._id}, $inc: {notices_count: 1},},{new: true});
    
    await user_model.findByIdAndUpdate(req.decoded.id, {
      $set: {most_favorite_category_for_saling: await getUserMostFavoriteCategories.forSaling(req.decoded.id)}
    });  
    return res.send(sendJsonWithTokens(req, error_types.success));
  } catch (error) {
    return next(error);
  }

})

router.post("/create_notice_photos/:notice_id",fileService.requestPathsAddMiddleware, fileService.uploadNoticeImages,async (req, res, next)=>{
  const paths = req.paths.map(path => {
    return `https://${process.env.bucket_name}.s3.${process.env.region_name}.amazonaws.com/${path}`;
  });
  try {
    const notice = await noticeModel.findById(req.notice_id).select("photos profile_photo");
    await notice.updateOne({
      $push: {photos: paths},
      $set: {profile_photo: paths[0]},
    });
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.post("/update_notice_photos/:notice_id",fileService.requestPathsAddMiddleware, fileService.deleteNoticeImagesMiddleware,fileService.updateNoticeImages,async(req, res, next)=>{
  const paths = req.paths.map(path => {
    return `https://${process.env.bucket_name}.s3.${process.env.region_name}.amazonaws.com/${path}`;
  });
  try {
    const notice = await noticeModel.findById(req.notice_id).select("photos profile_photo");
    await notice.updateOne({
      $set: {profile_photo: paths[0], photos: paths},
    });
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.post("/price_cut" ,async(req, res, next)=>{
  const notice_id = req.body.notice_id;
  let new_price = req.body.new_price;
  new_price = Number.parseFloat(new_price);
  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,notice_id)));
  if(Number.isNaN(new_price)) return next(new Error(error_handling_services(error_types.invalidValue,"cutted price")));
  try {
	  const notice = await noticeModel.findById(notice_id).select("saler_user price_details.saling_price stars state is_updated favorited_users profile_photo details.brand details.size details.category.detail_category price_details.initial_price").populate("favorited_users","email");
    if(!notice) return next(new Error(error_handling_services(error_types.dataNotFound,"notice")));
    if(notice.saler_user != req.decoded.id) return next(new Error(error_handling_services(error_types.authorizationError,"the saler of this notice is not you")));
    if(notice.state != notice_states.takable) return next(new Error(error_handling_services(error_types.logicalError,"this notice is not takable")));
    if(notice.price_details.saling_price <= new_price) return next(new Error(error_handling_services(error_types.invalidValue,new_price)));

    const percent  = ((notice.price_details.initial_price - new_price)/notice.price_details.initial_price)*100;
    let stars = 0;
    if(percent < 20 && percent >= 10 ){
      stars = 2;
    }
    else if(percent < 10 && percent >= 5  ){
      stars = 1;
    }
    else if(percent >= 20){
      stars = 3;
    }
    else if(percent < 5 ){
      stars = 1;
    }

    let not = await noticeModel.findByIdAndUpdate(notice_id, {
      $set: {
        "price_details.saling_price": new_price,
        is_updated: true,
        stars: stars
      },
    }, {new: true}).select("price_details.saling_price");

    for await(let user of notice.favorited_users){
      mailServices.priceCutEmail(user.email, notice.profile_photo, notice.details.brand, notice.details.category.detail_category, notice.price_details.saling_price, not.price_details.saling_price, notice.details.size, "http://localhost:3200/render");
      const notification = new notificationModel(
        `Beğendiğin ürünün fiyatı düştü!`,
        `${notice.details.brand} marka ${notice.details.category.detail_category} ürününün fiyatı ${notice.price_details.saling_price} TL'den ${not.price_details.saling_price} TL'ye düştü.`,
        notification_types.priceCut,
        new Date(),
        [{item_id: notice.id,item_type: "notice"}]
      );
      socketServices.emitNotificationOneUser(notification, user.id);
    }

    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
	  return next(error);
  }
});

module.exports = router;