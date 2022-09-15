
const express = require('express');
const noticeModel = require('../model/mongoose_models/notice_model');
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

router.post("/create_notice_photos",fileService.uploadNoticeImages,async (req, res, next)=>{
  const paths = req.files.notice_images.map((file)=>{
    let splitted = file.path.split("\\");
    return `${process.env.URL}/docs/${splitted[1]}*${splitted[2]}*${splitted[3]}`;
  })

  try {
    const notice = await noticeModel.findById(req.notice_id).select("photos profile_photo photos_replaced_count");
    await notice.updateOne({
      $push: {photos: paths},
      $set: {profile_photo: paths[0]},
    });
    return res.send(sendJsonWithTokens(req,error_types.success));
  } catch (error) {
    return next(error);
  }
  
})

router.post("/update_notice_photos",fileService.updateNoticeImages,async(req, res, next)=>{
  let notice_id = req.body.notice_id;
  notice_id = JSON.parse(notice_id).id;
  const paths = req.files.notice_images.map((file)=>{
    let splitted = file.path.split("\\");
    return `${process.env.URL}/docs/${splitted[1]}*${splitted[2]}*${splitted[3]}`; 
  });
  try {
	  const notice = await noticeModel.findById(notice_id).select("photos profile_photo photos_replace_count")
	  await fs.rm(`./files/notice/${notice_id}+${notice.photos_replace_count}`, { recursive: true }, err => {
	    if (err) {
	      throw err
	    }
	  });
	  await notice.updateOne({
	    $set: {photos: paths},
	    $inc: {photos_replace_count: 1}
	  })
	  return res.send(sendJsonWithTokens(req,paths));
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

router.get("/notice_details",async (req, res, next)=>{
  try {
	  const notice_id = req.body.notice_id;
	  if(!notice_id) return next(new Error(error_handling_services(error_types.dataNotFound,"notice id")));
	  if(!isValidObjectId(notice_id)) return next(new Error(error_handling_services(error_types.invalidValue,notice_id)));
	
	  const notice = await noticeModel.findById(notice_id).select("-price_details.buying_price -offers -photos_replace_count -offers_count").populate("saler_user","profile_photo username is_validated saler_score").populate("favorited_users", "profile_photo username")
    await notice.updateOne({
	    $inc: {displayed_count: 1},
	  });
	  await userModel.findByIdAndUpdate(req.decoded.id, {
	    $set: {most_favorite_category_for_looking: await getUserMostFavoriteCategories.forLooking(req.decoded.id)}
	  });

    const noticeWithAcceptedOffers = await noticeModel.findById(notice_id).select("accepted_offers");
    let resultData = {
      notice: notice,
      acceptedOffer: {
        isFound: false,
        amount: 0
      } 
    }
    for await(let offer of noticeWithAcceptedOffers.accepted_offers){
      if(offer.proposer == req.decoded.id){
        resultData.acceptedOffer = {
          isFound: true,
          amount: offer.amount,
          offer_id: offer._id
        }
      }
    }

	  return res.send(sendJsonWithTokens(req, resultData));
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