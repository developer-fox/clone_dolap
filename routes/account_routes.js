
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
const socket_model = require("../model/mongoose_models/socket_model");
const notification_schema = require("../model/mongoose_models/notification_schema");
const notificationModel = require("../model/data_helper_models/notification_model");
const notification_types = require("../model/data_helper_models/notification_types");


router.get("/get_profile_info", async (req, res, next)=>{
  try {
	const user = await user_model.findById(req.decoded.id).select("profile_photo username phone_number email profile_description");
	return res.send(sendJsonWithTokens(req,user));
  } catch (error) {
    return next(error);  
  }
})

router.post("/change_profile_photo", fileService.updateUserImage,async (req, res, next)=>{
  const path =   `${process.env.URL}/docs/user*${req.filePath.split("/")[2]}`;
  try {
	  const user = await user_model.findById(req.decoded.id).select("profile_photo profile_photo_replace_count");
	  if(!user) return next(new Error("user not found"));
    if(user.profile_photo != ""){
      await fs.rm(user.profile_photo, {recursive: true},err => {
	      if (err) {
	        throw err
	      }
	    });
    }
    await user.updateOne({
      $set: {profile_photo: path},
      $inc: {profile_photo_replace_count: 1}
    },{new: true});

    return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }  
})

router.delete("/delete_profile_photo",async(req, res, next) =>{

  try {
    const user = await user_model.findById(req.decoded.id).select("profile_photo profile_photo_replace_count");
    if(!user) return next(new Error("user not found"));
    if(user.profile_photo == "") return next(new Error("user already not have profile image"));

    await fs.rm(user.profile_photo, {recursive: true},err => {
      if (err) {
        throw err
      }
    });
    
    await user.updateOne({
      $set: {profile_photo: "",}
    });
    return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }

})

router.post("/change_profile_info", async (req, res, next)=>{
  let supportedChangableDatas = ["email", "phone_number", "profile_description", "username", "profile_photo"];
  let newDatas = {};

  if(Object.keys(req.body).length === 0){
    return next(new Error("not detected any change request"));
  }

  for(let key of Object.keys(req.body)){
    if(!supportedChangableDatas.includes(key)){
      return next(new Error("unsupported data change activity request"));
    }
  }

  Object.keys(req.body).forEach((key)=>{
    switch (key) {
      case "email":
        if(!validator.isEmail(req.body.email)){
          return next(new Error("invalid email type"));
        }
        newDatas.email = req.body.email;
        break;
      case "username":
        if(!validator.isLength(req.body.username, {min:6,  max: 18})){
          return next(new Error("invalid username type"));
        }
        newDatas.username = req.body.username;
        break;
      case "phone_number":
        if(!validator.isMobilePhone(req.body.phone_number)){
          return next(new Error("invalid phone number"));
        }
        newDatas.phone_number = req.body.phone_number;
        break;
      case "profile_photo":
        if(validator.isEmpty(req.body.profile_photo)){
          return next(new Error("invalid photo name"));
        }
        newDatas.profile_photo = req.body.profile_photo;
        break;
      case "profile_description":
        if(validator.isEmpty(req.body.profile_description)){
          return next(new Error("invalid profile description"));
        }
        newDatas.profile_description = req.body.profile_description;
        break;
      default:
        return next("undefined error");
    }
  })

  try {
    var result = await user_model.findOneAndUpdate({email: req.decoded.email}, {$set: newDatas});
    return res.send(sendJsonWithTokens(req, "successfuly"));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_addresses", async (req, res, next)=>{
  try {
	const addresses = await user_model.findOne({email: req.decoded.email}).select("addresses");
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
	  const result = await user_model.findByIdAndUpdate(req.decoded.id, {$addToSet: {addresses: new_address}});
    return res.send(sendJsonWithTokens(req, "successfuly"));
  } catch (error) {
	return next(error);
  }

})

router.get("/get_favorites/:page", async (req, res, next)=>{
  let page = req.params.page;

  try {
	  let favorites =  await user_model.findById(req.decoded.id).select("favorites -_id").populate("favorites", "title details.size price_details.saling_price photos is_sold favorites_count");

    const pageCount = Math.ceil(favorites.favorites.length/10);

    if(page > pageCount && pageCount> 0) return next(new Error("page parameter cant be big than pages count"));
  
    let getFavoritesWithPagination = favorites.favorites.slice((page-1)*10, (page*10));
    return res.send(sendJsonWithTokens(req,{
      favorites: getFavoritesWithPagination,
      page_count : pageCount,
    }));
  } catch (error) {
    return next(error);
  }  
})

router.post("/add_to_favorites", async (req, res, next)=>{
  let idToBeAdded = req.body.new_favorite_notice_ids;
  if(!idToBeAdded || idToBeAdded.length === 0) {
    return next(new Error("invalid notice id(s)"));
  }

  const user = await user_model.findById(req.decoded.id).select("favorites");
  if(!user) return next(new Error("user not found"));
  
  for(id of idToBeAdded) {
    if(!mongoose.isValidObjectId(id)){
      return next(new Error("invalid notice id(s)"));
    }
    if(user.favorites.includes(id)){
      return next(new Error("this notice is already in your favorites"));
    } 
  }

  idToBeAdded.forEach(async(item)=>{
    await notice_model.findByIdAndUpdate(item, {
      $addToSet: {
        favorited_users: req.decoded.id
      },
      $inc: {favorites_count: 1}
    });
  });
  try {
	  let process = await user_model.findByIdAndUpdate(req.decoded.id, {$push: {favorites: idToBeAdded}, $inc: {favorites_count: idToBeAdded.length}});
    return res.send(sendJsonWithTokens(req, "notices successfuly added to favorites"));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_coupons", async (req, res, next)=>{
  try {
    const coupons = await user_model.findOne({email: req.decoded.email}).select("user_coupons -_id").populate("user_coupons.coupon");

    return res.send(sendJsonWithTokens(req, {coupons: coupons._doc.user_coupons}));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_brands", async (req, res, next)=>{
  try {
	  const result = await user_model.findOne({email: req.decoded.email}).select("brands -_id");
	  return res.send(sendJsonWithTokens(req, {brands: result._doc.brands}));
  } catch (error) {
    return next(error);
  }
})

router.post("/add_brands", async (req, res, next)=>{
  const new_brands= req.body.new_brands;
  if(!new_brands){
    return next(new Error("Invalid brands information"));
  }
    
  new_brands.forEach((element)=>{
    if(!Object.values(brandsList).includes(element)){
      return next(new Error(`undefined brand ${element}`));
    }
  })

  try {
	  const result = await user_model.updateOne({email: req.decoded.email}, {$push: {brands: new_brands}});
    console.log(result);
    return res.send(sendJsonWithTokens(req, "new brands added succesfuly"));
  } catch (error) {
    return next(error);
  }
})

router.post("/add_sizes", async (req, res, next)=>{

  if(!req.body.sizes){
    return next(new Error("Invalid json type"));
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
      return next(new Error("invalid size category(es)"));
    }

    if(!top_sizes.includes(top_size)){
	    return next(new Error("undefined size category(top)"));
	  }
	
	  if(!medium_sizes.includes(medium_size)){
	    return next(new Error("undefined size category(medium)"))
	  }
	  
	  if(!(bottom_sizes[medium_sizes.indexOf(medium_size)].includes(bottom_size))){
	    return next(new Error("undefined size(bottom)"));
	  }
	
  });

  try {
	  const result = await user_model.findOneAndUpdate({email: req.decoded.email}, {$push: {sizes: req.body.sizes}});
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
	  const datas = await user_model.findOne({email: req.decoded.email}).select("sizes -_id");
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
    return next(new Error("top body and medium body are not nullable"));
  }

  try {
    const sizes = [];
    const result = await user_model.findById(req.decoded.id).select("sizes -_id");

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

router.get("/get_saling_offers", async (req, res, next)=>{
  try {
    const datas = await user_model.findById(req.decoded.id).select("notices").populate("notices","_id offers");

    let offers = [];
    datas.notices.forEach((item) => {
      offers.push(...item.offers);
    });

    return res.send(sendJsonWithTokens(req,{saling_offers: offers}));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_buying_offers", async (req, res, next)=>{
  try {
    const datas = await user_model.findById(req.decoded.id).select("buying_offers -_id");
    return res.send(sendJsonWithTokens(req,datas));
  } catch (error) {
    return next(error);
  }
})

router.post("/decline_offer", async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const offer_id = req.body.offer_id;
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(!offer_id) return next(new Error("offer id cannot be empty"));
  if(!isValidObjectId(offer_id)) return next(new Error("invalid offer id"));

  try {
    const notice = await noticeModel.findById(notice_id).select("saler_user offers profile_photo details.brand details.category.detail_category");
    if(!notice) return next(new Error("notice not found"));
    if(notice.saler_user != req.decoded.id) return next(new Error("bad authorization: you cant this action"));

    const offer = notice.offers.id(offer_id);
    if(!offer) return next(new Error("offer not found"));
    if(offer.offer_state == offer_states.declined) return next(new Error("the offer already declined"));
    offer["offer_state"] = offer_states.declined;
    await notice.save();
    const proposer = await user_model.findById(offer.proposer).select("buying_offers email");
    const user = await user_model.findById(req.decoded.id).select("username");

    let buyerOffer;
    proposer.buying_offers.forEach((offer) => {
      if(offer.notice == notice_id.toString()) {
        buyerOffer = offer;
      }
    });
    if(!buyerOffer) return next(new Error("offer not found"));
    buyerOffer["state"] = offer_states.declined;
    await proposer.save();
    mailServices.declinedOfferMail(proposer.email, user.username, notice.profile_photo, notice.details.brand, notice.details.category.detail_category, "http://localhost:3200/render");
    const notification = new notificationModel(
      "Teklifin reddedildi",
      `@${user.username} ${notice.details.category.detail_category} kategorisindeki ${notice.details.brand} marka ürüne verdiğin ${buyerOffer.price} TL'lik teklifi reddetti`,
      notification_types.offer,
      new Date(),
      notice.id
    );
    socketServices.emitNotificationOneUser(notification,proposer.id);

    return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }
})

router.post("/send_saling_offer", async (req, res, next) => {
  const notice_id = req.body.notice_id;
  const offer_id = req.body.offer_id;
  const buyer_id = req.body.buyer_id;
  const price = req.body.price;
  if(!price) return next(new Error("price cannot be empty"));
  if(Number.isNaN(Number.parseFloat(price))) return next(new Error("price must be an number"));
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(!offer_id) return next(new Error("offer id cannot be empty"));
  if(!isValidObjectId(offer_id)) return next(new Error("invalid offer id"));
  if(!buyer_id) return next(new Error("buyer id cannot be empty"));
  if(!isValidObjectId(buyer_id)) return next(new Error("invalid buyer id"));

  try {
    const notice = await noticeModel.findById(notice_id).select("offers saler_user profile_photo details.brand details.category.detail_category");
    if(!notice) return next(new Error("notice not found"));
    if(notice.saler_user != req.decoded.id) return next(new Error("you cant sale offer for this notice"));
    const saler = await user_model.findById(req.decoded.id).select("username");
	  const buyer = await user_model.findById(buyer_id).select("buying_offers gotten_buying_offers email");
    if(!buyer) return next(new Error("user not found"));


    for(let offer of buyer.gotten_buying_offers){
      if(offer.notice == notice_id){
        return next(new Error("already sended an offer"));
      }
    }

    for(let offer of buyer.buying_offers){
      if(offer.notice == notice_id){
        if(offer.state != offer_states.declined){
          return next(new Error("you cannot send saling offer"));
        }
      }
    }

        await buyer.updateOne({
          $addToSet: {
            gotten_buying_offers: {
              remaining_time: new Date(new Date().setDate(new Date().getDate() +1)),
              price: price,
              notice: notice_id,
            }
          }
        });
        await notice.updateOne({
          $addToSet: {
            offers: {
              proposer: buyer.id,
              remaining_time: new Date(new Date().setDate(new Date().getDate() +1)),
              offer_price: price,
              offer_type: "sale",
            }
          }
        })
        timeoutService.deleteOffer(notice_id,req.decoded.id, buyer_id);
        mailServices.newSalingOffer(buyer.email, saler.username, notice.profile_photo, notice.details.brand, price, notice.details.category.detail_category, "http://localhost:3200/render");

        const notification = new notificationModel(
          `Yeni bir satış teklifin var!`,
          `@${saler.username}, ${notice.detail.brand} marka ürünü için sana özel ${price} TL'lik teklif verdi.`,
          notification_types.offer,
          new Date(),
          notice.id,
        )
        socketServices.emitNotificationOneUser(notification,buyer.id);
        return res.send(sendJsonWithTokens(req, "successfuly"));

  } catch (error) {
    return next(error);
  }

})

router.post("/accept_offer", async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const offer_id = req.body.offer_id;
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(!offer_id) return next(new Error("offer id cannot be empty"));
  if(!isValidObjectId(offer_id)) return next(new Error("invalid offer id"));

  try {
    const notice = await noticeModel.findById(notice_id).select("saler_user offers profile_photo details.brand details.category.detail_category");
    if(!notice) return next(new Error("notice not found"));
    if(notice.saler_user != req.decoded.id) return next(new Error("bad authorization: you cant this action"));

    const offer = notice.offers.id(offer_id);
    if(!offer) return next(new Error("offer not found"));
    if(offer.offer_state == offer_states.accepted) return next(new Error("the offer already accepted"));
    if(offer.offer_state == offer_states.expired) return next(new Error("this offer is expired"));
    if(offer.offer_state == offer_states.declined) return next(new Error("this offer is declined"));
    offer["offer_state"] = offer_states.accepted;
    await notice.save();
    const proposer = await user_model.findById(offer.proposer).select("buying_offers email");
    const saler = await user_model.findById(req.decoded.id).select("username");
    let buyerOffer; 
    proposer.buying_offers.map((offer) => {
      if(offer.notice == notice_id){
        buyerOffer = offer;
      }
    });

    if(!buyerOffer) return next(new Error("offer not found"));
    buyerOffer["state"] = offer_states.accepted;
    await proposer.save();
    timeoutService.deleteOffer(notice_id, proposer.id);
    mailServices.acceptOfferMail(proposer.email,saler.username,buyerOffer.price, notice.profile_photo, notice.details.brand, notice.details.category.detail_category,"http://localhost:3200/render");

    const notification = new notificationModel(
      "Teklifin kabul edildi!",
      `@${saler.username}, ${notice.details.brand} marka ${notice.details.category.detail_category} ürünü için yaptığın teklifi kabul etti.`,
      notification_types.offer,
      new Date(),
      notice_id
    );

    socketServices.emitNotificationOneUser(notification,proposer.id);
    return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }
})

router.post("/accept_saling_offer", async(req, res, next) => {
  const notice_id = req.body.notice_id;
  const offer_id = req.body.offer_id;
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(!offer_id) return next(new Error("offer id cannot be empty"));
  if(!isValidObjectId(offer_id)) return next(new Error("invalid offer id"));

  try {
    const user = await user_model.findById(req.decoded.id).select("gotten_buying_offers username")
    let offer; 

    for await(let g_offer of user.gotten_buying_offers){
      console.log(g_offer);
      if(g_offer._id == offer_id){
        offer = g_offer; 
      }
    }

    if(!offer) return next(new Error("offer not found"));
    if(offer.state == offer_states.accepted) return next(new Error("the offer already accepted"));
    if(offer.state == offer_states.expired) return next(new Error("this offer is expired"));
    if(offer.state == offer_states.declined) return next(new Error("this offer is declined"));
    offer["state"] = offer_states.accepted;
    await user.save();
    const notice = await noticeModel.findById(notice_id).select("saler_user profile_photo details.brand details.category.detail_category offers").populate("saler_user","email");

    notice.offers.forEach( async offer => {
      if(offer.proposer == offer.proposer && offer.offer_state == offer_states.pending && offer.offer_type == "sale"){
        offer.offer_state = offer_states.accepted;
        await notice_model.findOneAndUpdate({"_id": notice_id, "offers._id": offer._id}, {$set:{
          "offers.$": offer
        }});
      }
    });
    // 
    timeoutService.deleteSalingAcceptedOffer(notice.id,notice.saler_user.id, req.decoded.id);
    mailServices.acceptSaleOfferMail(notice.saler_user.email, user.username, offer.price, notice.profile_photo, notice.details.brand, notice.details.category.detail_category, "http://localhost:3200/render");

    const notification = new notificationModel(
      "Satış teklifin kabul edildi!",
      `@${user.username} ${ details.brand} marka ${details.category.detail_category} ürünün için verdiğin ${offer.price} TL'lik teklifi kabul etti.`,
      notification_types.offer,
      new Date(),
      notice.id,
    )
    socketServices.emitNotificationOneUser(notification,notice.saler_user.id);
    return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }
})

router.post("/decline_saling_offer", async(req, res, next) => {
  const notice_id = req.body.notice_id;
  const offer_id = req.body.offer_id;
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(!offer_id) return next(new Error("offer id cannot be empty"));
  if(!isValidObjectId(offer_id)) return next(new Error("invalid offer id"));

  try {
    const user = await user_model.findById(req.decoded.id).select("gotten_buying_offers username")
    let offer; 

    for await(let g_offer of user.gotten_buying_offers){
      console.log(g_offer);
      if(g_offer._id == offer_id){
        offer = g_offer; 
      }
    }

    if(!offer) return next(new Error("offer not found"));
    if(offer.state == offer_states.accepted) return next(new Error("the offer is accepted"));
    if(offer.state == offer_states.expired) return next(new Error("this offer is expired"));
    if(offer.state == offer_states.declined) return next(new Error("this offer is already declined"));
    offer["state"] = offer_states.declined;
    await user.save();
    const notice = await noticeModel.findById(notice_id).select("saler_user profile_photo details.brand details.category.detail_category offers").populate("saler_user","email");

    notice.offers.forEach( async offer => {
      if(offer.proposer == offer.proposer && offer.offer_state == offer_states.pending && offer.offer_type == "sale"){
        offer.offer_state = offer_states.declined;
        await notice_model.findOneAndUpdate({"_id": notice_id, "offers._id": offer._id}, {$set:{
          "offers.$": offer
        }});
      }
    });
    mailServices.declineSaleOfferMail(notice.saler_user.email, user.username, notice.profile_photo, notice.details.brand, notice.details.category.detail_category, "http://localhost:3200/render");
    

    const notification = new notificationModel(
      "Satış teklifin kabul reddedildi",
      `@${user.username} ${ details.brand} marka ${details.category.detail_category} ürünün için verdiğin ${offer.price} TL'lik teklifi reddetti.`,
      notification_types.offer,
      new Date(),
      notice.id,
    )
    socketServices.emitNotificationOneUser(notification,notice.saler_user.id);
    return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }
})

router.post("/send_feedback", async (req, res, next)=>{
  const feed_content = req.body.feedback_content;
  const feed_subject = req.body.feedback_subject;
  const feed_date = new Date();
  const feed_reason = req.body.feedback_reason;

  if(!Object.values(feedback_reasons).includes(feed_reason)){
    return next(new Error("undefined feedback reason"));
  }
  if(!Object.values(feedback_subjects).includes(feed_subject)){
    return next(new Error("undefined feedback subject"));
  }
  if(feed_content.length> 1000 || feed_content.length ==0){
    return next(new Error("invalid feedback content length"));
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
    if(!result._id){
      return next(new Error("feedback creation failed"));
    }
    else{
      const savingFromUserSchema = await user_model.findByIdAndUpdate(req.decoded.id,{$addToSet: {feedbacks:  new ObjectId(result._id)}});
      return res.send(sendJsonWithTokens(req, result));
    }
  } catch (error) {
    return next(error);
  }
})

router.get("/get_feedbacks", async (req, res, next)=>{
  const result = await user_model.findById(req.decoded.id).select("feedbacks -_id").populate("feedbacks");
  return res.send(sendJsonWithTokens(req,result.feedbacks));
})

router.get("/get_taken_notices", async (req, res, next)=>{
  try {
    const result = await user_model.findById(req.decoded.id).select("taken_notices");
    console.log(result);
    return res.send(sendJsonWithTokens(req,result));
  } catch (error) {
    return next(error);
  }
})

router.post("/add_looked_notice", async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));

  try {
	  const result = await user_model.findByIdAndUpdate(req.decoded.id, {
	    $push: {
	      user_looked_notices: {
	        $position: 0, 
	        $each : [notice_id],
	      },
	    }
	  }, {new: true});

	  
    if( result.user_looked_notices.length === 7){
      await result.updateOne({$pop: {user_looked_notices: 1},});
    }

    await noticeModel.findByIdAndUpdate(notice_id,{$inc: {displayed_count: 1}});
    return res.send(sendJsonWithTokens(req, "successfuly"));
	  
  } catch (error) {
    return next(error);
  }

})

router.get("/get_home_notices/:page/:refresh",async (req, res, next)=>{
  const page= req.params.page;
  const refresh = req.params.refresh;
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));

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
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));

  try {
	  const notice = await noticeModel.findById(notice_id).select("saler_user is_featured").populate("saler_user","own_use_trending");
    
    if(!notice) return next(new Error("notice not found"));
    if(notice.saler_user != req.decoded.id) return next(new Error("you cannot stand out this notice"));
    if(notice.is_featured) return next(new Error("this notice is already standed out"));
    if(notice.saler_user.own_use_trending === 0) return next(new Error("you have not any standing out 	justification "));

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

module.exports = router;