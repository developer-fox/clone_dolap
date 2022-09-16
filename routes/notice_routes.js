
const express = require('express');
const userModel = require('../model/mongoose_models/user_model');
const cargo_sizes = require('../model/data_helper_models/cargo_sizes');
const cargo_payers = require('../model/data_helper_models/cargo_payers');
const user_model = require('../model/mongoose_models/user_model');
const notice_states = require('../model/data_helper_models/notice_states');
const get_similar_notices = require('../controllers/get_similar_notices');
const router = express.Router();
const socketManager = require("../services/socket_manager")
const socketServices = require("../services/socket_services")(socketManager.getIo());
const notification_types = require("../model/data_helper_models/notification_types");
const error_handling_services = require('../services/error_handling_services');
const error_types = require('../model/api_models/error_types');
const { default: mongoose, isValidObjectId } = require("mongoose");
const noticeModel = require("../model/mongoose_models/notice_model");
const { sendJsonWithTokens } = require("../services/response_sendjson");
const notificationModel = require("../model/api_models/notification_model");


router.post("/add_to_favorites", async (req, res, next)=>{
  const notice_id= req.body.notice_id;

  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,notice_id)));

  try {
    const user = await userModel.findById(req.decoded.id).select("favorites username");
    if(user.favorites.includes(notice_id)){
      return next(new Error(error_handling_services(error_types.logicalError,"this notice is already favorited")));
    }
    const result =  await userModel.findByIdAndUpdate(req.decoded.id, {$addToSet: {favorites:notice_id}}, {new: true});
    const notice = await noticeModel.findById(notice_id).select("saler_user");
    await noticeModel.findByIdAndUpdate(notice_id, {$inc: {favorites_count: 1}, $addToSet: {favorited_users: req.decoded.id}});

    const notification = new notificationModel(
      `@${user.username} ürününü beğendi!`,
      `Dilersen ona özel bir satış teklifi gönderebilirsin.`,
      notification_types.noticeLiked,
      new Date(),
      [
        {item_id: user.id,item_type: "user"}, 
        {item_id: notice_id, item_type: "notice"},
      ],
    );
    socketServices.emitNotificationOneUser(notification, notice.saler_user.id);
    return res.send(sendJsonWithTokens(req, error_types.success));
  } catch (error) {
    return next(error);
  }

})

router.get("/get_similar_notices", async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,notice_id)));
  try {
    const result = await get_similar_notices(notice_id, "details.brand price_details.saling_price profile_photo", 4);
    return res.send(sendJsonWithTokens(req,result));
  } catch (error) {
    return next(error);
  }
})

router.post("/add_to_cart", async (req, res, next)=>{
  const notice_id = req.body.notice_id;

  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,notice_id)));

  try {
	const notice = await noticeModel.findById(notice_id).select("price_details.saling_price state size_of_cargo payer_of_cargo accepted_offers").populate("saler_user","_id");
  if(!notice) return next(new Error("notice not found"));
	
  const currentUser = await userModel.findById(req.decoded.id).select("cart");
  if(!currentUser) return next(new Error(error_handling_services(error_types.dataNotFound,"user")));

  if(notice.state != notice_states.takable) return next(new Error(error_handling_services(error_types.logicalError,"this notice is not takable")));

  let main_amount = notice.price_details.saling_price;

  notice.accepted_offers.every(offer=>{
    if(offer.proposer == req.decoded.id){
      main_amount = offer.amount;
      return false;
    }
    return true;
  })

    for await(let item of currentUser.cart.items){
      if(item.notice == notice_id){
        return next(new Error(error_handling_services(error_types.logicalError,"you already added this notice from your cart")));
      }
    }

    await currentUser.updateOne({
      $addToSet: {
        "cart.items":{
          notice: notice_id,
          total_price : main_amount
        },
      },
      $inc: {
        cart_items_count: 1
      }
    });

    if(notice.payer_of_cargo == cargo_payers.buyer){
      let cargo_amount = 0;
      for await(let key of Object.keys(cargo_sizes)){
        if(cargo_sizes[key].title == notice.details.size_of_cargo){
          cargo_amount = cargo_sizes[key].price;
          break;
        }
      }
      await currentUser.updateOne({
        $addToSet: {
          "cart.details": {
            description: "Kargo ücreti",
            amount: cargo_amount
          } 
        }
      })
    }

    return res.send(sendJsonWithTokens(req,error_types.success));

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
	  
    if( result.user_looked_notices.length === 10){
      await result.updateOne({$pop: {user_looked_notices: 1},});
    }

    return res.send(sendJsonWithTokens(req, error_types.success));
	  
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
  
  for await(let id of idToBeAdded) {
    if(!mongoose.isValidObjectId(id)){
      return next(new Error(new Error(error_handling_services(error_types.invalidValue,id))));
    }
    if(user.favorites.includes(id)){
      return next(new Error(error_handling_services(error_types.logicalError,"this notice already in favorites list of user")));
    }
    const currentUser = await user_model.findById(req.decoded.id).select("username");
    const noticeWithSaler = await notice_model.findById(id).select("saler_user details.brand details.category details_category");
    const notification = new notificationModel(
      "Bir ürünün beğenildi!",
      `@${currentUser.username} ${noticeWithSaler.details.brand} marka ${noticeWithSaler.details.category.detail_category} ürününü beğendi!`,
      notification_types.noticeLiked,
      new Date(),
      [{item_id: id, item_type: "notice"},{item_id: req.decoded.id, item_type: "user"}]
    );

    socketServices.emitNotificationOneUser(notification, noticeWithSaler._id);

    await notice_model.findByIdAndUpdate(id, {
      $addToSet: {
        favorited_users: req.decoded.id
      },
      $inc: {favorites_count: 1}
    });

  }

  try {
	  await user_model.findByIdAndUpdate(req.decoded.id, {$push: {favorites: idToBeAdded}, $inc: {favorites_count: idToBeAdded.length}});
    return res.send(sendJsonWithTokens(req, error_types.success));
  } catch (error) {
    return next(error);
  }
})


module.exports = router;