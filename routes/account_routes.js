
const express = require("express");
const { ObjectId } = require("mongodb");
const brandsList = require("../model/data_helper_models/brands.json");
const { default: mongoose, isValidObjectId } = require("mongoose");
const feedback_reasons = require("../model/data_helper_models/feedback_reasons");
const feedback_subjects = require("../model/data_helper_models/feedback_subjects");
const notice_sizes = require("../model/data_helper_models/notice_sizes");
const feedback_model = require("../model/mongoose_models/feedback_model");
const user_model = require("../model/mongoose_models/user_model");
const noticeModel = require("../model/mongoose_models/notice_model");
const validator = require("validator").default;
const { sendJsonWithTokens } = require("../services/response_sendjson");
const soldNoticeModel = require("../model/mongoose_models/sold_notice_model");
const offer_states = require("../model/data_helper_models/offer_states");
const get_similar_notices = require("../controllers/get_similar_notices");
const fileService = require("../services/file_services");
const router = express.Router();
const fs = require("fs");
const notice_states = require("../model/data_helper_models/notice_states");
const timeoutService = require("../services/timeout_services");
const notice_model = require("../model/mongoose_models/notice_model");
const mailServices = require("../services/mail_services");
const socketManager = require("../services/socket_manager")
const socketServices = require("../services/socket_services")(socketManager.getIo());
const notificationModel = require("../model/api_models/notification_model");
const notification_types = require("../model/data_helper_models/notification_types");
const notification_items_getter = require("../controllers/notification_items_getter");
const error_handling_services = require("../services/error_handling_services");
const error_types = require("../model/api_models/error_types");


router.get("/profile_info", async (req, res, next)=>{
  try {
	const user = await user_model.findById(req.decoded.id).select("profile_photo username phone_number email profile_description");
	return res.send(sendJsonWithTokens(req,user));
  } catch (error) {
    return next(error);  
  }
})

router.post("/change_profile_photo", fileService.updateUserImage,async (req, res, next)=>{
  const path = `https://${process.env.bucket_name}.s3.${process.env.region_name}.amazonaws.com/${req.profile_path}`;
  try {
	  const user = await user_model.findById(req.decoded.id).select("profile_photo");
	  if(!user) return next(new Error(error_handling_services(error_types.dataNotFound,"user")));
    await user.updateOne({
      $set: {profile_photo: path},
    },{new: true});

    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }  
})

router.delete("/delete_profile_photo",fileService.deleteUserProfilePhoto,async(req, res, next) =>{
  try {
    await user_model.findByIdAndUpdate(req.decoded.id,{
      $set: {profile_photo: "https://dolap-backend-bucket.s3.eu-west-2.amazonaws.com/blank-user.jpg",}
    });
    return res.send(sendJsonWithTokens(req, error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.post("/change_profile_info", async (req, res, next)=>{
  let supportedChangableDatas = ["email", "phone_number", "profile_description", "username", "profile_photo"];
  let newDatas = {};

  if(Object.keys(req.body).length === 0){
    return next(new Error(new Error(error_handling_services(error_types.dataNotFound,"body"))));
  }

  for(let key of Object.keys(req.body)){
    if(!supportedChangableDatas.includes(key)){
      return next(new Error(error_handling_services(error_types.invalidValue,key)));
    }
  }

  Object.keys(req.body).forEach((key)=>{
    switch (key) {
      case "email":
        if(!validator.isEmail(req.body.email)){
          return next(new Error(error_handling_services(error_types.invalidValue,key)));
        }
        newDatas.email = req.body.email;
        break;
      case "username":
        if(!validator.isLength(req.body.username, {min:6,  max: 18})){
          return next(new Error(error_handling_services(error_types.invalidValue,key)));
        }
        newDatas.username = req.body.username;
        break;
      case "phone_number":
        if(!validator.isMobilePhone(req.body.phone_number)){
          return next(new Error(error_handling_services(error_types.invalidValue,key)));
        }
        newDatas.phone_number = req.body.phone_number;
        break;
      case "profile_photo":
        if(validator.isEmpty(req.body.profile_photo)){
          return next(new Error(error_handling_services(error_types.invalidValue,key)));
        }
        newDatas.profile_photo = req.body.profile_photo;
        break;
      case "profile_description":
        if(validator.isEmpty(req.body.profile_description)){
          return next(new Error(error_handling_services(error_types.invalidValue,key)));
        }
        newDatas.profile_description = req.body.profile_description;
        break;
      default:
        return next(new Error(error_handling_services(error_types.invalidValue,key)));
    }
  })

  try {
    await user_model.findById(req.decoded.id, {$set: newDatas});
    return res.send(sendJsonWithTokens(req, error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_addresses", async (req, res, next)=>{
  try {
	const addresses = await user_model.findById(req.decoded.
  id).select("addresses");
  return res.send(sendJsonWithTokens(req, addresses));
} catch (error) {
	return next(error);
}
})

router.post("/add_address", async (req, res, next)=>{
  const new_address = {
    address_title : req.body.address_title ?? "undefined??",
    contact_informations : req.body.contact_informations ?? "undefined ??",
    address_informations : req.body.address_informations ?? "undefined ??",
  }
  try {
	  await user_model.findByIdAndUpdate(req.decoded.id, {$addToSet: {addresses: new_address}});
    return res.send(sendJsonWithTokens(req, error_types.success));
  } catch (error) {
	return next(error);
  }

})

router.get("/get_favorites/:page", async (req, res, next)=>{
  let page = req.params.page;

  try {
	  let favorites =  await user_model.findById(req.decoded.id).select("favorites -_id").populate("favorites", "title details.size price_details.saling_price photos is_sold favorites_count");

    const pageCount = Math.ceil(favorites.favorites.length/10);

    if(page > pageCount && pageCount> 0) return next(new Error(new Error(error_handling_services(error_types.invalidValue,pageCount.toString()))));
  
    let getFavoritesWithPagination = favorites.favorites.slice((page-1)*10, (page*10));
    return res.send(sendJsonWithTokens(req,{
      favorites: getFavoritesWithPagination,
      page_count : pageCount,
    }));
  } catch (error) {
    return next(error);
  }  
})

router.get("/get_coupons", async (req, res, next)=>{
  try {
    const coupons = await user_model.findOne(req.decoded.id).select("user_coupons").populate("user_coupons.coupon");

    return res.send(sendJsonWithTokens(req, {coupons: coupons._doc.user_coupons}));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_brands", async (req, res, next)=>{
  try {
	  const result = await user_model.findOne({email: req.decoded.email}).select("brands");
	  return res.send(sendJsonWithTokens(req, {brands: result._doc.brands}));
  } catch (error) {
    return next(error);
  }
})

router.post("/add_brands", async (req, res, next)=>{
  const new_brands= req.body.new_brands;
  if(!new_brands){
    return next(new Error(error_handling_services(error_types.invalidValue,new_brands)));
  }
    
  new_brands.forEach((element)=>{
    if(!Object.values(brandsList).includes(element)){
      return next(new Error(error_handling_services(error_types.invalidValue,element)));
    }
  })

  try {
	  const result = await user_model.updateOne({email: req.decoded.email}, {$push: {brands: new_brands}});
    console.log(result);
    return res.send(sendJsonWithTokens(req, error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.post("/add_sizes", async (req, res, next)=>{

  if(!req.body.sizes){
    return next(new Error(error_handling_services(error_types.invalidValue,"body of request")));
  }

  const top_sizes = Object.keys(notice_sizes);
  const medium_sizes = [];
  const bottom_sizes = [];

  top_sizes.forEach((e)=>{
    Object.keys(notice_sizes[e]).forEach(key=> medium_sizes.push(key));
  });

  for(let i=0; i<top_sizes.length; i++){
    for(let key of Object.keys(notice_sizes[top_sizes[i]])){
     bottom_sizes.push(Object.values(notice_sizes[top_sizes[i]][key]));
    }
  }

  req.body.sizes.forEach(element => {    
    let top_size = element.top_size;
	  let medium_size = element.medium_size;
	  let bottom_size = element.bottom_size;
    if(!top_size || !medium_size || !bottom_size){
      return next(new Error(error_handling_services(error_types.invalidValue,element,notice_s)));
    }

    if(!top_sizes.includes(top_size)){
	    return next(new Error(error_handling_services(error_types.invalidValue,top_size)));
	  }
	
	  if(!medium_sizes.includes(medium_size)){
	    return next(new Error(error_handling_services(error_types.invalidValue,medium_size)))
	  }
	  
	  if(!(bottom_sizes[medium_sizes.indexOf(medium_size)].includes(bottom_size))){
	    return next(new Error(error_handling_services(error_types.invalidValue,bottom_size)));
	  }
	
  });

  try {
	  const result = await user_model.findByIdAndUpdate(req.decoded.id, {$push: {sizes: req.body.sizes}});
    return res.send(sendJsonWithTokens(req, result));
  } catch (error) {
	  return next(error);
  }
})

router.get("/get_sizes_all", async (req, res, next)=>{
  const result = {
    woman: {
      woman_top_size: [],
      woman_bottom_size: [],
      woman_shoes_size:  [],
      woman_underwear_size:  [],
    },
    man: {
      man_top_size:  [],
      man_bottom_size:  [],
      man_shoes_size:  [],
    },
    baby: {
      baby_size: [],
      child_size: [],
      baby_shoes_size: [],
      child_shoes_size: [],
    },
  };
  try {
	  const datas = await user_model.findById(req.decoded.id).select("sizes");
	  for(let data of datas.sizes){
	    let i = data._doc;
	    result[i.top_size][i.medium_size].push(i.bottom_size);
	  }
    return res.send(sendJsonWithTokens(req, result));
  } catch (error) {
    return next(error);
  }
});

router.get("/get_sizes_spesific/:top_size/:medium_size", async (req, res, next)=>{
  let top_size = req.params.top_size;
  let medium_size= req.params.medium_size;

  if(!top_size || !medium_size){
    return next(new Error(error_handling_services(error_types.invalidValue,"size informations")));
  }

  try {
    const sizes = [];
    const result = await user_model.findById(req.decoded.id).select("sizes");

    for(let data of result.sizes){
      const i = data._doc;
      console.log(i);
      if(i.top_size == top_size && i.medium_size == medium_size){
        sizes.push(i);
      }
    }

    return res.send(sendJsonWithTokens(req, sizes));
  } catch (error) {
    return next(error);
  }

})

router.get("/get_taken_notices", async (req, res, next)=>{
  try {
    const result = await user_model.findById(req.decoded.id).select("taken_notices");
    return res.send(sendJsonWithTokens(req,result));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_home_notices/:page/:refresh",async (req, res, next)=>{
  const page= req.params.page;
  const refresh = req.params.refresh;

  const selectItems = "favorites_count details.brand profile_photo price_details.saling_price is_featured";
  if (refresh) {
	  try {
	    const userLookedNotices = await user_model.findById(req.decoded.id).select("user_looked_notices");
	
      const result = [];
	    userLookedNotices.user_looked_notices.forEach(async (notice_id)=> {
	      const similarNotices = await get_similar_notices(notice_id,"_id",3,page);
        result.push(...similarNotices);
	    });
	
      let currentIndex = result.length,  randomIndex;

      // While there remain elements to shuffle.
      while (currentIndex != 0) {
    
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
    
        // And swap it with the current element.
        [result[currentIndex], result[randomIndex]] = [
          result[randomIndex], result[currentIndex]];
      }
    
      await userLookedNotices.updateOne({$set: {homepage_notices: result.map(notice=>{
        return notice._id;
      })}});

	  } catch (error) {
	    return next(error);
	  }
	
  }
  try {
    const populatedResult = await user_model.findOne(req.decoded.id).select("homepage_notices").populate({
      path: "homepage_notices",
      select: selectItems,
      options: {
        limit: 10,
        skip: (page -1)*10,
      }
    })
	  return res.send(sendJsonWithTokens(req, {
	    notices: populatedResult.homepage_notices
	  }));
  } catch (error) {
    return next(error);
  }

})

router.post("/stand_out", async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,notice_id)));

  try {
	  const notice = await noticeModel.findById(notice_id).select("saler_user is_featured").populate("saler_user","own_use_trending");
    
    if(!notice) return next(new Error(error_handling_services(error_types.dataNotFound,"notice")));
    if(notice.saler_user != req.decoded.id) return next(new Error(error_handling_services(error_types.authorizationError,"you are not saler of this notice")));
    if(notice.is_featured) return next(new Error(error_handling_services(error_types.logicalError,"this notice is already featured")));
    if(notice.saler_user.own_use_trending === 0) return next(new Error(error_handling_services(error_types.logicalError,"you have not any trending justification")));

    await user_model.findByIdAndUpdate(req.decoded.id,{
      $inc: {own_use_trending: -1}
    });

    await notice.updateOne({
      $set: {
        is_featured: true,
      },
      $set: {
        feature_expire_time: new Date(new Date().setDate(new Date().getDate() +1))
      }
    });
    timeoutService.deleteStandOut(notice_id);
  } catch (error) {
    return next(error);
  }
})

router.get("/get_notifications", async(req, res, next)=>{
  try {
	  const user = await user_model.findById(req.decoded.id).select("notifications");
	  let notifications = user.notifications.sort(function(a,b){
	    return  Date.parse(b.notification_date) - (a.notification_date); 
	  });

    const result = [];
    for await (let n of notifications) {
      const items = await notification_items_getter(n.notification_items);
      let data = {
        Notification_title: n.Notification_title,
        _id: n._id,
        Notification_subtitle: n.Notification_subtitle,
        notification_date: n.notification_date,
        notification_category: n.notification_category,
        is_seen: n.is_seen,
        notification_items: items
      };
      result.push(data);
    }

    return res.send(sendJsonWithTokens(req,result));
  } catch (error) {
    return next(error);
  }




})

router.get("/get_related_accounts/:page", async (req, res, next)=>{
  try {
    const page = req.params.page;
    if(Number.isNaN(Number.parseInt(page)) || Number.parseInt(page)<= 0) return next(new Error(error_handling_services(error_types.invalidValue,"page number")));
	  const currentUser = await user_model.findById(req.decoded.id).select("most_favorite_category_for_looking");
	  const accounts = await user_model.find({most_favorite_category_for_saling: currentUser.most_favorite_category_for_looking}).skip((page -1)*10).limit(10).select("username profile_photo ratings_count saler_score").populate({
      path: "notices",
      select: "profile_photo favorites_count details.brand price_details.saling_price",
      limit: 5
    });
    return res.send(sendJsonWithTokens(req,accounts));
  } catch (error) {
    return next(error);
  }

})

module.exports = router;