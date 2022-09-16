


const express = require("express");
const sold_notice_model = require("../model/mongoose_models/sold_notice_model");
const router = express.Router();
const uuid = require("uuid");
const sold_notice_states = require("../model/data_helper_models/saled_notice_states");
const notice_states = require("../model/data_helper_models/notice_states");
const { sendJsonWithTokens } = require("../services/response_sendjson");
const notice_model = require("../model/mongoose_models/notice_model");
const mailServices = require("../services/mail_services");
const timeoutService = require("../services/timeout_services");
const socketManager = require("../services/socket_manager");
const socketServices = require("../services/socket_services")(socketManager.getIo());
const notification_types = require("../model/data_helper_models/notification_types");
const notificationModel = require("../model/api_models/notification_model");
const userModel = require('../model/mongoose_models/user_model');
const user_model = require('../model/mongoose_models/user_model');
const couponStates = require('../model/data_helper_models/coupon_states.js');
const { default: mongoose, isValidObjectId } = require("mongoose");
const error_handling_services = require("../services/error_handling_services");
const error_types = require("../model/api_models/error_types");


router.post('/check_cart', async(req, res, next)=>{
  const address_id = req.body.address_id;
  if(!address_id) return next(new Error(error_handling_services(error_types.dataNotFound,"address id")));
  if(!isValidObjectId(address_id)) return next(new Error(error_handling_services(error_types.invalidValue,address_id)));
  try {
	  const currentUser = await user_model.findById(req.decoded.id).select("cart addresses user_coupons username email").populate("cart.items.notice");

    if(!currentUser) return next(new Error(error_handling_services(error_types.dataNotFound,"user")));
    const address =currentUser.addresses.id(address_id);
    if(!address) return next(new Error(error_handling_services(error_types.dataNotFound,"address")));
    if(currentUser.cart.items.length==0) return next(new Error(error_handling_services(error_types.dataNotFound,"items")));
    const currentTime = new Date();
    for await (let saled_notice of currentUser.cart.items){
      let total_amount = 0;
      const currentNotice = saled_notice.notice;
      const currentSaler = await user_model.findById(currentNotice.saler_user).select("username email sold_notices_count");
      let main_amount = saled_notice.total_price;

      const payment_details = [
        {
          payment_amount: saled_notice.total_price,
          payment_title: "ürün fiyatı"
        },  
        ...currentUser.cart.details.map(detail =>{
          if(detail.detail_id == saled_notice.notice._id){
            return {
              payment_amount: detail.amount,
              payment_title: detail.description
            }
          }
        })
      ];
      payment_details.forEach(e=> total_amount += e.payment_amount);
      const order_code = uuid.v4();
      const soldNotice = new sold_notice_model({
        notice: saled_notice.notice,
        saler_user: saled_notice.notice.saler_user,
        buyer_user: req.decoded.id,
        taken_date: currentTime,
        order_code: order_code,
        cargo_type: saled_notice.notice.payer_of_cargo,
        states: [{
          state_date: currentTime,
          state_type: sold_notice_states.approved
        }],
        contact_informations: address.contact_informations,
        address_informations: address.address_informations,
        payment_details: payment_details,
        payment_total: {
          amount: total_amount,
          payment_type: "kredi kartı"
        }
      });

      await soldNotice.save();
      await user_model.findByIdAndUpdate(saled_notice.notice.saler_user, {
        $addToSet: {sold_notices: soldNotice.id},
        $inc: {sold_notices_count: 1},
      });
      for await(let detail of currentUser.cart.details){
        for await(let coupon of currentUser.user_coupons){
          if(detail.detail_id == coupon._id){
            coupon.is_used_before = true;
            await currentUser.save();
          }
        }
      }
      await currentUser.updateOne({
        $addToSet: {taken_notices: soldNotice._id},});
      await notice_model.findByIdAndUpdate(saled_notice.notice._id,{
        $set: {
          state: notice_states.sold
        }
      });
      
      mailServices.newOrderMail(currentSaler.email,currentNotice.profile_photo,currentSaler.username, currentUser.username,currentNotice.details.brand,total_amount, order_code, currentNotice.payer_of_cargo,`${address.contact_informations.name} ${address.contact_informations.name}`,"http://localhost:3200/render","http://localhost:3200/render");

      mailServices.newTakenNoticeMail(currentUser.email,currentNotice.profile_photo,currentUser.usename,currentNotice.details.brand,total_amount,order_code,currentNotice.payer_of_cargo,`${address.contact_informations.name} ${address.contact_informations.name}`,"http://localhost:3200/render","http://localhost:3200/render");
      timeoutService.soldNoticeToCargo(soldNotice.id);

      if(currentSaler.sold_notices_count == 0){
        const firstSaleNotification= new notificationModel(
          "Tebrikler, ilk siparişini aldın!",
          "Tebrikler, ilk siparişini aldın! Nasıl kargolayacağını öğrenmek için tıkla.",
          notification_types.firstSale,
          new Date(),
          [{item_id: currentSaler.id, item_type: "user"}] 
          );
        socketServices.emitNotificationOneUser(firstSaleNotification, currentSaler.id);
      }
      const salerNotification = new notificationModel(
        "Tebrikler, Yeni bir siparişin var!", 
        "Tebrikler, Yeni bir siparişin var! Sipariş detayları için tıkla.",
        notification_types.newSale,
        new Date(),
        [{item_id: soldNotice.id, item_type: "sold_notice"}]
      );
      socketServices.emitNotificationOneUser(salerNotification, currentSaler.id);
      
      const buyerNotification = new notificationModel(
        "Siparişin onaylandı!",
        `${currentNotice.details.brand} marka ${currentNotice.details.category.detail_category} ürün siparişin onaylandı. Detayları görmek için tıkla.`,
        notification_types.newOrder,
        new Date(),
        [{item_id: soldNotice.id, item_type: "sold_notice"}]
      );
      socketServices.emitNotificationOneUser(buyerNotification, req.decoded.id);
    }
    await currentUser.updateOne({
      $set: {
        cart: {
          items: [],
          details: [],
        },
        cart_items_count: 0
      },
    });

    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
})

router.post("/cancel_buying", async (req, res, next)=>{
  const sold_notice_id = req.body.sold_notice_id;
  if(!sold_notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"sold notice id")));
  if(!isValidObjectId(sold_notice_id)) return next(new Error(error_handling_services(error_types.dataNotFound,sold_notice_id)));

  try {
    const sold_notice = await sold_notice_model.findById(sold_notice_id).populate("notice","details.category.detail_category details.brand").populate("buyer_user","username");
    if(!sold_notice) return next(new Error(error_handling_services(error_types.dataNotFound,"sold notice")));
    if(sold_notice.buyer_user != req.decoded.id) return next(new Error(error_handling_services(error_types.authorizationError,"you cannot cancel this sale")));
    if(sold_notice.states[[sold_notice.states.length-1]].state_type != sold_notice_states.approved) return next(new Error(error_handling_services(error_types.logicalError,"this sale is not cancelable")));

    await sold_notice.updateOne({
      $addToSet: {
        states: {
          state_date: Date.now(),
          state_type: sold_notice_states.canceled,
        }
      }
    });

    await notice_model.findByIdAndUpdate(sold_notice.notice, {
      $set: {
        state: notice_states.takable,
      }
    })

    await user_model.findByIdAndUpdate(req.decoded.id, {
      $pull: {
        taken_notices: sold_notice._id,
      },
    });
    
    await user_model.findByIdAndUpdate(sold_notice.saler_user, {
      $pull: {
        sold_notices: sold_notice_id,
      },
      $inc:{
        sold_notices_count: -1
      }
    });

    const salerNotification = new notificationModel(
      "Alıcı siparişi iptal etti.",
      `@${sold_notice.buyer_user.username} ${sold_notice.notice.details.brand} ${sold_notice.notice.details.category.detail_category} siparişini iptal etti.`,
      notification_types.orderCancel,
      new Date(),
      [{item_id: sold_notice.id, item_type: 'sold_notice'}]
    );
    socketServices.emitNotificationOneUser(salerNotification,sold_notice.saler_user);
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }

})

router.post("/cancel_saling", async (req, res, next)=>{
  const sold_notice_id = req.body.sold_notice_id;
  if(!sold_notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"sold notice id")));
  if(!isValidObjectId(sold_notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,sold_notice_id)));

  try {
    const sold_notice = await sold_notice_model.findById(sold_notice_id).populate("saler_user","username").populate("notice","details.category.detail_category details.brand");
    if(!sold_notice) return next(new Error(error_handling_services(error_types.dataNotFound,"sold notice")));
    if(sold_notice.saler_user != req.decoded.id) return next(new Error(error_handling_services(error_types.authorizationError,"you are not saler of this notice")));
    if(sold_notice.states[[sold_notice.states.length-1]].state_type != sold_notice_states.approved) return next(new Error(error_handling_services(error_types.logicalError,"this notice is not cancelable")));

    await sold_notice.updateOne({
      $addToSet: {
        states: {
          state_date: Date.now(),
          state_type: sold_notice_states.canceled,
        }
      }
    });

    await notice_model.findByIdAndUpdate(sold_notice.notice, {
      $set: {
        state: notice_states.removedFromSale,
      }
    })

    await user_model.findByIdAndUpdate(sold_notice.buyer_user, {
      $pull: {
        taken_notices: sold_notice._id,
      },
    });
    
    await user_model.findByIdAndUpdate(req.decoded.id, {
      $pull: {
        sold_notices: sold_notice_id,
      },
      $inc:{
        sold_notices_count: -1
      }
    });
    
    const buyerNotification = new notificationModel(
      "Satıcı siparişi iptal etti.",
      `@${sold_notice.saler_user.username} ${sold_notice.notice.details.brand} ${sold_notice.notice.details.category.detail_category} siparişini iptal etti.`,
      notification_types.orderCancel,
      new Date(),
      [{item_id: sold_notice.id, item_type: 'sold_notice'}]
    );
    socketServices.emitNotificationOneUser(buyerNotification, sold_notice.buyer_user);
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }

})

router.get("/get_order_info_buyer", async (req, res, next)=>{
  const sold_notice_id = req.body.sold_notice_id;
  if(!sold_notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"sold notice id")));
  if(!isValidObjectId(sold_notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,sold_notice_id)));

  try {
    const order = await sold_notice_model.findById(sold_notice_id).populate("notice", "details.category.detail_category details.use_case details.size profile_photo price_details.initial_price").populate("saler_user","username");
    if(order.buyer_user != req.decoded.id) return next(new Error(error_handling_services(error_types.authorizationError,"you are not buyer of this order")));

    if(!order) return next(new Error(error_handling_services(error_types.dataNotFound,"order")));
    return res.send(sendJsonWithTokens(req,order));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_order_info_saler", async (req, res, next)=>{
  const sold_notice_id = req.body.sold_notice_id;
  if(!sold_notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"sold notice id")));
  if(!isValidObjectId(sold_notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,sold_notice_id)));
  try {
    const order = await sold_notice_model.findById(sold_notice_id).populate("notice", "details.category.detail_category details.use_case details.size profile_photo price_details.initial_price").populate("buyer_user","username");
    if(order.saler_user != req.decoded.id) return next(new Error(error_handling_services(error_types.authorizationError,"you are not saler of this order")));
    if(!order) return next(new Error(error_handling_services(error_types.dataNotFound,"order")));
    return res.send(sendJsonWithTokens(req,order));
  } catch (error) {
    return next(error);
  }
});

router.get("/get_cart", async (req, res, next)=>{
  try {
	  const user = await userModel.findById(req.decoded.id).select("cart cart_items_count").populate("cart.items.notice","profile_photo title details.use_case details.size").populate("cart.items.notice.saler_user", "profile_photo saler_score username");
	  
	  if(!user) return next(new Error(error_handling_services(error_types.dataNotFound,"user")));
	  let total_amount = 0;
	  user.cart.items.forEach(element=>{
	    total_amount += element.total_price;
	  })
	  user.cart.details.forEach(element=>{
	    total_amount += element.amount;
	  });
	  return res.send(sendJsonWithTokens(req, {
	    cart: user.cart,
	    total_amount: total_amount,
      cart_items_count: user.cart_items_count,
	  }));
  } catch (error) {
    return next(error);
  }
})

router.post("/use_coupon_code", async (req, res, next)=>{

  const coupon_code = req.body.coupon_code;
  if(!coupon_code) return next(new Error(error_handling_services(error_types.dataNotFound,"coupon code")));
  try {
	
	  const user = await userModel.findById(req.decoded.id).select("user_coupons cart").populate("user_coupons.coupon");
	
	  if(!user) return next(new Error(error_handling_services(error_types.dataNotFound,"user")));
	
	  user.user_coupons.forEach(async element =>{
	    if(element.coupon.code == coupon_code && !(element.is_used_before) && element.coupon.state == couponStates.usable){
        await user.updateOne({
          $addToSet: {
            "cart.details": {
              description: element.coupon.title,
              amount: element.coupon.amount,
              detail_id : element.coupon._id
            }
          }
        });
        return res.send(sendJsonWithTokens(req,error_types.success));
      }
	  });

    return next(new Error(error_handling_services(error_types.dataNotFound,"coupon")));
  } catch (error) {
	  return next(error);
  }
})

router.delete("/pop_to_cart", async(req, res, next)=>{
  const element_id = req.body.element_id;
  if(!element_id) return next(new Error(error_handling_services(error_types.dataNotFound,"element id")));
  if(!isValidObjectId(element_id)) return next(new Error(error_handling_services(error_types.invalidValue,element_id)));
  try {
	  const user = await userModel.findById(req.decoded.id).select("cart");
	  if(!user) return next(new Error(error_handling_services(error_types.dataNotFound,"user")));
    console.log(user.cart.items);
    for await(let item of user.cart.items){
      if(item._id == element_id){

        await user.updateOne({
           $pull: {
            "cart.items": {
              _id: element_id
            }
           },
          $inc: {
            cart_items_count: -1
          },
        });
        return res.send(sendJsonWithTokens(req,error_types.success));
      }
    };
    return next(new Error(error_handling_services(error_types.dataNotFound,"notice")));
  } catch (error) {
	  return next(error);
  }
})

router.delete("/pop_coupon_code", async (req, res, next)=>{
  const coupon_id = req.body.coupon_id;
  if(!coupon_id) return next(new Error(error_handling_services(error_types.dataNotFound,"coupon id")));
  if(!isValidObjectId(coupon_id)) return next(new Error(error_handling_services(error_types.invalidValue,coupon_id)));

  try {
	  const user = await userModel.findOne(req.decoded.id).select("cart");	
	  if(!user) return next(new Error(error_handling_services(error_types.dataNotFound,"user")));
    
    user.cart.details.forEach(async element => {
      if(element.detail_id == coupon_id){
        await user.update({
          $pull: {
            "cart.details":{
              "cart.details.detail_id": coupon_id
            }
          }
        });
        return res.send(sendJsonWithTokens(req,error_types.success));
      }
    });

  } catch (error) {
	  return next(error);
  }
})

module.exports = router;