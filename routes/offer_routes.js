
const express = require('express');
const router = express.Router();
const { default: mongoose, isValidObjectId } = require("mongoose");
const noticeModel = require("../model/mongoose_models/notice_model");
const offer_states = require("../model/data_helper_models/offer_states");
const notice_states = require("../model/data_helper_models/notice_states");
const notice_model = require("../model/mongoose_models/notice_model");
const mailServices = require("../services/mail_services");
const socketManager = require("../services/socket_manager");
const socketServices = require("../services/socket_services")(socketManager.getIo());
const notificationModel = require("../model/api_models/notification_model");
const notification_types = require("../model/data_helper_models/notification_types");
const userModel = require('../model/mongoose_models/user_model');
const user_model = require('../model/mongoose_models/user_model');
const { sendJsonWithTokens } = require('../services/response_sendjson');
const timeoutService = require('../services/timeout_services');
const error_handling_services = require('../services/error_handling_services');
const error_types = require('../model/api_models/error_types');

router.post("/give_offer",async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const price = req.body.price;
  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,notice_id)));
  if(!price || price<1) return next(new Error(error_handling_services(error_types.invalidValue,"price")));

  try {
	  const notice = await noticeModel.findById(notice_id).select("saler_user price_details.saling_price price_details.selling_with_offer offers state profile_photo details.brand details.category.detail_category favorited_users").populate("saler_user","email");
    if(!notice._id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice")));
    if(notice.state != notice_states.takable) return next(new Error(error_handling_services(error_types.logicalError,"this notice is not takable")));
    if(!notice.price_details.selling_with_offer) return next(new Error(error_handling_services(error_types.logicalError,"this notice is not saling with offer."))); 
    if(price< (notice.price_details.saling_price)*(7/10) || price>= notice.price_details.saling_price) return next(new Error(error_handling_services(error_types.invalidValue, price)));

    for(let i of notice.offers){
      if(i.proposer == req.decoded.id && (i.offer_state == offer_states.accepted || i.offer_state == offer_states.pending)){
      return next(new Error(error_handling_services(error_types.logicalError,"already you gave an offer for this notice")));
      }
    }
    const proposer = await userModel.findById(req.decoded.id).select("username");
    const remaining_time = new Date(new Date().setDate(new Date().getDate() +1));
    const addOfferToNoticeOffers = await noticeModel.findByIdAndUpdate(notice_id, {$addToSet: {offers: {
      proposer: req.decoded.id,
      remaining_time: remaining_time,
      offer_price : price,
      offer_type: "buy"
    }},
      $inc: {offers_count: 1},
    },{new: true})

    await userModel.findByIdAndUpdate(req.decoded.id, {$addToSet: {
      buying_offers: {
        remaining_time: remaining_time,
        price: price,
        notice: notice_id,
      }
    }})
    timeoutService.deleteOffer(notice.id, req.decoded.id);
    mailServices.newBuyingOfferMail(notice.saler_user.email, proposer.username, notice.profile_photo, notice.details.brand, price, notice.details.category.detail_category, "http://localhost:3200/render");

    const notification = new notificationModel(
      "Yeni bir teklifin var!",
      `@${proposer.username} ${notice.details.brand} marka ${notice.details.category.detail_category} ürünün için ${price} TL'lik bir teklif verdi.`,
      notification_types.offer,
      new Date(),
      [{item_id: notice._id.toString(), item_type: "notice"}],
    );
    socketServices.emitNotificationOneUser(notification, notice.saler_user._id.toString());

    for await (const likedUser of notice.favorited_users){
      const gaveUserNotification = new notificationModel(
        "Beğendiğin ürüne teklif verildi!",
        `Beğendiğin ürüne teklif var, satılmak üzere, acele et!`,
        notification_types.anotherUserGaveOffer,
        new Date(),
        [{item_id: notice._id.toString(), item_type: "notice"}],
      );
      socketServices.emitActivationInfoToAnotherUsers(gaveUserNotification, likedUser._id);
    }

    return res.send(sendJsonWithTokens(req,error_types.success));
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

    return res.send(sendJsonWithTokens(req,offers));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_buying_offers", async (req, res, next)=>{
  try {
    const datas = await user_model.findById(req.decoded.id).select("buying_offers");
    return res.send(sendJsonWithTokens(req,datas));
  } catch (error) {
    return next(error);
  }
})

router.post("/decline_offer", async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const offer_id = req.body.offer_id;
  if(!notice_id) return next(new Error(error_handling_services(error_types.invalidValue,"notice id")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,notice_id)));
  if(!offer_id) return next(new Error(error_handling_services(error_types.invalidValue,"offer id")));
  if(!isValidObjectId(offer_id)) return next(new Error(error_handling_services(error_types.invalidValue,"offer id")));

  try {
    const notice = await noticeModel.findById(notice_id).select("saler_user offers profile_photo details.brand details.category.detail_category");
    if(!notice) return next(new Error(error_handling_services(error_types.dataNotFound,"notice")));
    if(notice.saler_user != req.decoded.id) return next(new Error(error_handling_services(error_types.authorizationError,"declining the offer")));

    const offer = notice.offers.id(offer_id);
    if(!offer) return next(new Error(error_handling_services(error_types.dataNotFound,"offer")));
    if(offer.offer_state == offer_states.declined) return next(error_handling_services(error_types.logicalError,"the offer already declined"));
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
    if(!buyerOffer) return next(new Error(error_handling_services(error_types.dataNotFound,"offer")));
    buyerOffer["state"] = offer_states.declined;
    await proposer.save();
    mailServices.declinedOfferMail(proposer.email, user.username, notice.profile_photo, notice.details.brand, notice.details.category.detail_category, "http://localhost:3200/render");
    const notification = new notificationModel(
      "Teklifin reddedildi",
      `@${user.username} ${notice.details.category.detail_category} kategorisindeki ${notice.details.brand} marka ürüne verdiğin ${buyerOffer.price} TL'lik teklifi reddetti`,
      notification_types.offer,
      new Date(),
      [{item_id: notice.id, item_type:"notice"}]
    );
    socketServices.emitNotificationOneUser(notification,proposer.id);

    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.post("/send_saling_offer", async (req, res, next) => {
  const notice_id = req.body.notice_id;
  const offer_id = req.body.offer_id;
  const buyer_id = req.body.buyer_id;
  const price = req.body.price;
  if(!price) return next(new Error(error_handling_services(error_types.dataNotFound,"price")));
  if(Number.isNaN(Number.parseFloat(price))) return next(error_handling_services(error_types.invalidValue,"price"));
  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue, notice_id)));
  if(!offer_id) return next(new Error(error_handling_services(error_types.invalidValue,"offer id")));
  if(!isValidObjectId(offer_id)) return next(new Error(error_handling_services(error_types.invalidValue,offer_id)));
  if(!buyer_id) return next(new Error(error_handling_services(error_types.dataNotFound,"buyer id")));
  if(!isValidObjectId(buyer_id)) return next(new Error(error_handling_services(error_types.invalidValue,buyer_id)));

  try {
    const notice = await noticeModel.findById(notice_id).select("offers saler_user profile_photo details.brand details.category.detail_category");
    if(!notice) return next(new Error(error_handling_services(error_types.dataNotFound,"notice")));
    if(notice.saler_user != req.decoded.id) return next(new Error(error_handling_services(error_types.authorizationError,"sending an sale offer")));
    const saler = await user_model.findById(req.decoded.id).select("username");
	  const buyer = await user_model.findById(buyer_id).select("buying_offers gotten_buying_offers email");
    if(!buyer) return next(new Error(error_handling_services(error_types.dataNotFound,"buyer")));


    for(let offer of buyer.gotten_buying_offers){
      if(offer.notice == notice_id){
        return next(new Error(error_handling_services(error_types.logicalError,"already sended an offer")));
      }
    }

    for(let offer of buyer.buying_offers){
      if(offer.notice == notice_id){
        if(offer.state != offer_states.declined){
          return next(new Error(error_handling_services(error_types.logicalError,"already you have an not declined offer for this notice")));
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
          [{item_id:notice.id, item_type: "notice"}]
        )
        socketServices.emitNotificationOneUser(notification,buyer.id);
        return res.send(sendJsonWithTokens(req, error_types.success));

  } catch (error) {
    return next(error);
  }

})

router.post("/accept_offer", async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const offer_id = req.body.offer_id;
  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,notice_id)));
  if(!offer_id) return next(new Error(error_handling_services(error_types.dataNotFound,"offer id")));
  if(!isValidObjectId(offer_id)) return next(new Error(error_handling_services(error_types.invalidValue,offer_id)));

  try {
    const notice = await noticeModel.findById(notice_id).select("saler_user offers profile_photo details.brand details.category.detail_category");
    if(!notice) return next(new Error(error_handling_services(error_types.dataNotFound,"notice")));
    if(notice.saler_user != req.decoded.id) return next(new Error(error_handling_services(error_types.authorizationError,"the saler of this notice is not you.")));

    const offer = notice.offers.id(offer_id);
    if(!offer) return next(new Error(error_handling_services(error_types.dataNotFound,"offer")));
    if(offer.offer_state == offer_states.accepted) return next(new Error(error_handling_services(error_types.logicalError,"this offer is already accepted")));
    if(offer.offer_state == offer_states.expired) return next(new Error(error_handling_services(error_types.logicalError,"this offer is expired")));
    if(offer.offer_state == offer_states.declined) return next(new Error(error_handling_services(error_types.logicalError,"this offer is already declined")));
    await notice.updateOne({
      $addToSet: {
        accepted_offers: {
          proposer: offer.proposer,
          amount: offer.offer_price,
          offer_id: offer_id
        }
      }
    });
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

    if(!buyerOffer) return next(new Error(error_types.dataNotFound,"offer"));
    buyerOffer["state"] = offer_states.accepted;
    await proposer.save();
    timeoutService.deleteOffer(notice_id, proposer.id);
    mailServices.acceptOfferMail(proposer.email,saler.username,buyerOffer.price, notice.profile_photo, notice.details.brand, notice.details.category.detail_category,"http://localhost:3200/render");

    const notification = new notificationModel(
      "Teklifin kabul edildi!",
      `@${saler.username}, ${notice.details.brand} marka ${notice.details.category.detail_category} ürünü için yaptığın teklifi kabul etti.`,
      notification_types.offer,
      new Date(),
      [{item_id: notice_id, item_type: "notice"}]
    );

    socketServices.emitNotificationOneUser(notification,proposer._id);
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.post("/accept_saling_offer", async(req, res, next) => {
  const notice_id = req.body.notice_id;
  const offer_id = req.body.offer_id;
  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,notice_id)));
  if(!offer_id) return next(new Error(error_handling_services(error_types.dataNotFound,"offer")));
  if(!isValidObjectId(offer_id)) return next(new Error(error_handling_services(error_types.invalidValue,offer_id)));

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
    if(offer.state == offer_states.accepted) return next(new Error(error_handling_services(error_types.logicalError,"this offer is already accepted")));
    if(offer.state == offer_states.expired) return next(new Error(error_handling_services(error_types.logicalError,"this offer is expired")));
    if(offer.state == offer_states.declined) return next(new Error(error_handling_services(error_types.logicalError,"this offer is declined ")));
    offer["state"] = offer_states.accepted;
    await user.save();
    const notice = await noticeModel.findById(notice_id).select("saler_user profile_photo details.brand details.category.detail_category offers").populate("saler_user","email");


    for await(let offer of notice.offers){
      if(offer.proposer == offer.proposer && offer.offer_state == offer_states.pending && offer.offer_type == "sale"){
        offer.offer_state = offer_states.accepted;
        await notice.updateOne({
          $addToSet: {
            accepted_offers: {
              proposer: offer.proposer,
              amount: offer.offer_price,
              offer_id: offer._id 
            }
          }
        });
        await notice_model.findOneAndUpdate({"_id": notice_id, "offers._id": offer._id}, {$set:{
          "offers.$": offer
        }});
      }
    }

    timeoutService.deleteSalingAcceptedOffer(notice.id,notice.saler_user.id, req.decoded.id);
    mailServices.acceptSaleOfferMail(notice.saler_user.email, user.username, offer.price, notice.profile_photo, notice.details.brand, notice.details.category.detail_category, "http://localhost:3200/render");

    const notification = new notificationModel(
      "Satış teklifin kabul edildi!",
      `@${user.username} ${ details.brand} marka ${details.category.detail_category} ürünün için verdiğin ${offer.price} TL'lik teklifi kabul etti.`,
      notification_types.offer,
      new Date(),
      [{item_id:notice.id, item_type: "notice"}]
    )
    socketServices.emitNotificationOneUser(notification,notice.saler_user._id);
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.post("/decline_saling_offer", async(req, res, next) => {
  const notice_id = req.body.notice_id;
  const offer_id = req.body.offer_id;
  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,notice_id)));
  if(!offer_id) return next(new Error(error_handling_services(error_types.dataNotFound,"offer id")));
  if(!isValidObjectId(offer_id)) return next(new Error(error_handling_services(error_types.invalidValue,offer_id)));

  try {
    const user = await user_model.findById(req.decoded.id).select("gotten_buying_offers username")
    let offer; 

    for await(let g_offer of user.gotten_buying_offers){
      console.log(g_offer);
      if(g_offer._id == offer_id){
        offer = g_offer; 
      }
    }

    if(!offer) return next(new Error(error_handling_services(error_types.dataNotFound,"offer")));
    if(offer.state == offer_states.accepted) return next(new Error(error_handling_services(error_types.logicalError,"this offer is already accepted")));
    if(offer.state == offer_states.expired) return next(new Error(error_handling_services(error_types.logicalError,"this offer is expired")));
    if(offer.state == offer_states.declined) return next(new Error(error_handling_services(error_types.logicalError,"this offer is declined")));
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
      [{item_id: notice.id,item_type: "notice"}]
    )
    socketServices.emitNotificationOneUser(notification,notice.saler_user._id);
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.post("/send_saling_offer_to_favoriteds", async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  let offer_price = req.body.offer_price;
  offer_price  = Number.parseFloat(offer_price);
  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,notice_id)));
  if(Number.isNaN(offer_price)) return next(new Error(error_handling_services(error_types.invalidValue,offer_price)));
  try {
    const notice = await noticeModel.findById(notice_id).select("favorited_users saler_user price_details.saling_price offers offers_count state profile_photo details.brand details.category.detail_category").populate("saler_user","username");
    if(!notice) return next(new Error(error_handling_services(error_types.dataNotFound,"notice")));
    if(notice.saler_user._id != req.decoded.id) return next(new Error(error_handling_services(error_types.authorizationError,"you are not saler of this notice")));
    if(notice.state != notice_states.takable) return next(new Error(error_handling_services(error_types.logicalError,"this notice is not takable")));
    if(notice.price_details.saling_price <= offer_price) return next(new Error(error_handling_services(error_types.logicalError,"offer amount must be lower than saling price")));

    for await(let user of notice.favorited_users){
      const us = await userModel.findById(user).select("email");
      await userModel.findByIdAndUpdate(user, {
        $addToSet: {
          gotten_buying_offers: {
            remaining_time: new Date(new Date().setDate(new Date().getDate() +1)),
            price: offer_price,
            notice: notice_id
          }
        }
      }
      );
      timeoutService.deleteSalingOffer(notice_id, req.decoded.id, user);
      mailServices.sendOfferToFavoritesMail(us.email,notice.saler_user.username, notice.profile_photo, notice.details.brand, offer_price, notice.details.category.detail_category,"http://localhost:3200/render");

      const notification = new notificationModel(
        `@${notice.saler_user._id} ürününü beğenenlere özel bir teklif yaptı!`,
        `@${notice.saler_user._id}, ${details.brand} marka ${details.category.detail_category} ürünü için beğenenlere özel teklif verdi. Acele et! Teklifi kabul etmek için yalnızca 24 saatin var.`,
        notification_types.offer,
        new Date(),
        notice._id
      );
      socketServices.emitNotificationOneUser(notification, user);
    }

    await notice.updateOne({
      $push: {
        offers: notice.favorited_users.map(user=>{
          return {
            remaining_time: new Date(new Date().setDate(new Date().getDate() +1)),
            proposer: user,
            offer_price: offer_price,
            offer_type: "sale"
          }
        })
      }
    });
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;