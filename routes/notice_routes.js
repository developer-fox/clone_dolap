
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
const { $where } = require('../model/mongoose_models/notice_model');
const get_similar_notices = require('../controllers/get_similar_notices');
const offer_states = require('../model/data_helper_models/offer_states');
const router = express.Router();
const fileService = require('../services/file_services');
const { json } = require('express');
const timeoutService = require('../services/timeout_services');

router.post("/add_notice", async (req, res, next)=>{

  if(!req.body.data.title || req.body.data.title.length < 5){
    return next(new Error("invalid title type/length"));
  }
  if(!req.body.data.description){
    return next(new Error("invalid description type/length"));
  }

  if(!req.body.data.category || Object.keys(req.body.data.category).length<4){
    return next(new Error("invalid category information"));
  }

  if(!req.body.data.brand || !Object.values(brands).includes(req.body.data.brand)){
    return next(new Error("undefined brand"));
  }

  if(!req.body.data.use_case || !Object.values(useCases).includes(req.body.data.use_case)){
    return next(new Error("undefined use case information or use case type"));
  }
  if(!req.body.data.color || !colors.includes(req.body.data.color)){
    return next(new Error("invalid color"));
  }
  if( req.body.data.category.top_category != "Elektronik" &&  !req.body.data.size){
    return next(new Error("undefined product size"));
  }

  if(!(req.body.data.size_of_cargo) || (( req.body.data.size_of_cargo != cargo_sizes.large.title) && (req.body.data.size_of_cargo != cargo_sizes.medium.title) && (req.body.data.size_of_cargo != cargo_sizes.small.title))){
    return next(new Error("undefined/invalid cargo size information"));
  }

  if(!req.body.data.payer_of_cargo || !Object.values(cargo_payers).includes(req.body.data.payer_of_cargo)){
    return next(new Error("undefined payer"));
  }

  if(!req.body.data.price_details || !req.body.data.price_details.buying_price || !req.body.data.price_details.saling_price  || !req.body.data.price_details.selling_with_offer){
    return next(new Error("invalid price details information"));
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
    price_details: req.body.data.price_details,
    saler_user: req.decoded.id,
    created_date: new Date(),
  });

  try {
    const access = await newNotice.save();
    if(!access._id){
      return next(new Error("ürün satış için hazırlanırken hata oluştu."));
    }
    else{
      const result = await user_model.findByIdAndUpdate(req.decoded.id, {$addToSet: {notices: access._id}, $inc: {notices_count: 1}});
      return res.send(sendJsonWithTokens(req, "successfuly"));
    }
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
    return res.send(sendJsonWithTokens(req,"successfuly"));
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

//*
router.post("/price_cut" ,async(req, res, next)=>{
  const notice_id = req.body.notice_id;
  let new_price = req.body.new_price;
  new_price = Number.parseFloat(new_price);
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(Number.isNaN(new_price)) return next(new Error("new price must be a number"));
  try {
	  const notice = await noticeModel.findById(notice_id).select("saler_user price_details.saling_price stars state is_updated");
    if(!notice) return next(new Error("notice not found"));
    if(notice.saler_user != req.decoded.id) return next(new Error("you cannot price cutting for this notice: authorization"));
    if(notice.state != notice_states.takable) return next(new Error("you cannot price cutting for this notice: state"));
    if(notice.price_details.saling_price >= new_price) return next(new Error("new price must be low than old price"));

    const percent  = ((notice.price_details.saling_price - new_price)/notice.price_details.saling_price)*100;
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
    await notice.updateOne({
      $set: {
        "price_details.saling_price": new_price
      },
      $set: {
        is_updated: true
      },
      $set: {
        stars: stars
      }
    })
    return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
	  return next(error);
  }
});

router.post("/send_saling_offer_to_favoriteds", async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  let offer_price = req.body.offer_price;
  offer_price  = Number.parseFloat(offer_price);
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(Number.isNaN(offer_price)) return next(new Error("offer price must be a number"));
  try {
    const notice = await noticeModel.findById(notice_id).select("favorited_users saler_user price_details.saling_price offers offers_count state");
    if(!notice) return next(new Error("notice not found"));
    if(notice.saler_user != req.decoded.id) return next(new Error("you cannot give saling offer for this notice: authorization"));
    if(notice.state != notice_states.takable) return next(new Error("you cannot give saling offer for this notice: state"));
    if(notice.price_details <= offer_price) return next(new Error("offer price must be lower than saling price"));

    notice.favorited_users.forEach(async (user) =>{
      await userModel.findByIdAndUpdate(user, {
        $addToSet: {
          gotten_buying_offers: {
            remaining_time: new Date(new Date().setDate(new Date().getDate() +1)),
            price: offer_price,
            notice: notice_id
          }
        }
      }
      )
      timeoutService.deleteSalingOffer(notice_id, req.decoded.id, user);
    })
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
    return res.send(sendJsonWithTokens(req,"successfuly"));
    
  } catch (error) {
    return next(error);
  }
})

router.use("/comment", commentsRouter);

router.post("/add_to_favorites", async (req, res, next)=>{
  const notice_id= req.body.notice_id;

  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));

  try {
    const user = await userModel.findById(req.decoded.id).select("favorites");
    if(user.favorites.includes(notice_id)){
      return next(new Error("the notice is already in favorites"));
    }
    const result =  await userModel.findByIdAndUpdate(req.decoded.id, {$addToSet: {favorites:notice_id}}, {new: true});
    
    await noticeModel.findByIdAndUpdate(notice_id, {$inc: {favorites_count: 1}, $addToSet: {favorited_users: req.decoded.id}});

    if(result.favorites.includes(notice_id)) {
      return res.send(sendJsonWithTokens(req,"successfuly"));
    }
    else {
      return next(new Error("an error detected when new notice adding to favorites"));
    }  
  } catch (error) {
    return next(error);
  }

})

router.post("/report_notice" , async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const report_category = req.body.report_category;
  const report_detail = req.body.report_detail;

  if(!notice_id || !isValidObjectId(notice_id)) return next(new Error("invalid notice information"));
  if(!report_category) return next(new Error("invalid report category"));
  if(!report_detail) return next(new Error("invalid report detail"));

  const new_report = new noticeReportModel({
    notice: notice_id,
    reporter_user: req.decoded.id,
    report_category: report_category,
    report_detail: report_detail,
    report_date: new Date(),
  })

  try {
    const result =  await new_report.save();
    if(!result._id) return next(new Error("report cannot send"));
    return res.send(sendJsonWithTokens(req, "successfuly"));
  } catch (error) {
    return next(error);
  }

})

router.get("/notice_details",async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));

  const notice = await noticeModel.findById(notice_id).select("-price_details.buying_price -offers ").populate("saler_user","profile_photo username is_validated saler_score last_seen").populate("favorited_users", "profile_photo username");
  return res.send(sendJsonWithTokens(req, notice));

})

router.post("/give_offer",async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const price = req.body.price;
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(!price || price<1) return next(new Error("price cannot be empty"));

  try {
	  const notice = await noticeModel.findById(notice_id).select("saler_user price_details.saling_price price_details.selling_with_offer offers state");
    //if(notice.state != notice_states.takable) return next(new Error("you cant give an offer for this notice"));
    if(!notice._id) return next(new Error("notice not found"));
    //if(!notice.price_details.selling_with_offer) return next(new Error("you cant give offer for this notice")); 
    if(price< (notice.price_details.saling_price)*(7/10)) return next(new Error("very low price for this notice"));

    for(let i of notice.offers){
      if(i.proposer == req.decoded.id && (i.offer_state == offer_states.accepted || i.offer_state == offer_states.pending)){
        return next(new Error("already you gave an offer"));
      }
    }

    const remaining_time = new Date(new Date().setDate(new Date().getDate() +1));
    const addOfferToNoticeOffers = await noticeModel.findByIdAndUpdate(notice_id, {$addToSet: {offers: {
      proposer: req.decoded.id,
      remaining_time: remaining_time,
      offer_price : price,
      offer_type: "buy"
    }},
      $inc: {offers_count: 1},
    },{new: true})

    const addOfferToProposerUserOfferes = await userModel.findByIdAndUpdate(req.decoded.id, {$addToSet: {
      buying_offers: {
        remaining_time: remaining_time,
        price: price,
        notice: notice_id,
      }
    }})
    timeoutService.deleteOffer(notice.id, req.decoded.id);
    return res.send(sendJsonWithTokens(req,"successfuly"));

  } catch (error) {
    return next(error);
  }

})

router.get("/get_similar_notices", async (req, res, next)=>{
  const notice_id = req.body.notice_id;

  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));

  try {
    const result = await get_similar_notices(notice_id, "details.brand price_details.saling_price profile_photo", 4);
    return res.send(sendJsonWithTokens(req,result));
  } catch (error) {
    return next(error);
  }

})

router.post("/add_to_cart", async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const price = req.body.price;

  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(!price) return next(new Error("price cannot be empty"));
  if(Number.isNaN(Number.parseFloat(price))) return next(new Error("price cannot be empty"));

  try {
	const notice = await noticeModel.findById(notice_id).select("price_details.saling_price  size_of_cargo payer_of_cargo").populate("saler_user","_id");
  if(!notice) return next(new Error("notice not found"));
	
  const currentUser = await userModel.findById(req.decoded.id).select("gotten_buying_offers");
  if(!currentUser) return next(new Error("user not found"));

  if(price < notice.price_details.saling_price){
    if(currentUser.gotten_buying_offers.length ==0){
      return next(new Error("sent buying price from saler not found"));
    } 
    else{
      currentUser.gotten_buying_offers.forEach(async offer =>{
        if(offer.notice == notice_id){
          if(offer.state != offer_states.accepted){
            return next(new Error("offer not accepted"));
          }
          else{
            if(price == offer.price){
              await currentUser.update({
                $addToSet: {
                  //! distressing
                  "cart.items":{
                    notice: notice_id,
                    total_price : price
                  }, 
                },
                $inc: {
                  cart_items_count: 1
                }
              })
              return res.send(sendJsonWithTokens(req,"successfuly"));
            }
            else{
              return next(new Error("wrong price information"));
            }
          }
        }
      });
      return next(new Error("notice offer not found"));
    }

  }
  else if(price == notice.price_details.saling_price){
    await currentUser.update({
      $addToSet: {
        //! distressing
        "cart.items":{
          notice: notice_id,
          total_price : price
        }, 
      },
      $inc: {
        cart_items_count: 1
      }
    });
    return res.send(sendJsonWithTokens(req,"successfuly"));
  }
  else{
    return next(new Error("wrong price information"));
  }
  } catch (error) {
    return next(error);
  }
})

router.get("/get_cart", async (req, res, next)=>{
  try {
	  const user = await userModel.findOne(req.decoded.id).select("cart cart_items_count").populate("cart.items.notice","profile_photo title details.use_case details.size").populate("cart.items.notice.saler_user", "profile_photo saler_score username");
	  
	  if(!user) return next(new Error("user not found"));
	  const total_amount = 0;
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

  const code = req.body.code;
  if(!code) return next(new Error("code cannot be empty"));
  try {
	
	  const user = await userModel.findById(req.decoded.id).select("user_coupons cart").populate("user_coupons.coupon");
	
	  if(!user) return next(new Error("user not found"));
	
	  user.user_coupons.forEach(async element =>{
	    if(element.coupon.code == code && !(element.is_used_before) && element.coupon.state == couponStates.usable){
        await user.update({
          $addToSet: {
            "cart.details": {
              description: element.coupon.title,
              amount: element.coupon.amount,
              detail_id : element.coupon._id
            }
          }
        });
        return res.send(sendJsonWithTokens(req,"successfuly"));
      }
	  });

    return next(new Error("coupon is not found"));
  } catch (error) {
	  return next(error);
  }
})

router.delete("/pop_to_cart", async(req, res, next)=>{
  const notice_id = req.body.notice_id;
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  try {
	  const user = await userModel.findById(req.decoded.id).select("cart");
	  if(!user) return next(new Error("user not found"));
    user.cart.items.forEach(async item=>{
      if(item.notice == notice_id){
        await user.update({
          $pull: {
            "cart.items": {
              "cart.items.notice" : notice_id
            }
          },
          $inc: {
            cart_items_count: -1
          },
        });
        return res.send(sendJsonWithTokens(req,"successfuly"));
      }
    });
    return next(new Error("notice is not found in your cart"));
  } catch (error) {
	  return next(error);
  }
})

router.delete("/pop_coupon_code", async (req, res, next)=>{
  const coupon_id = req.body.coupon_id;
  if(!coupon_id) return next(new Error("coupon id cannot be empty"));
  if(!isValidObjectId(coupon_id)) return next(new Error("invalid coupon id"));

  try {
	  const user = await userModel.findOne(req.decoded.id).select("cart");	
	  if(!user) return next(new Error("user not found"));
    
    user.cart.details.forEach(async element => {
      if(element.detail_id == coupon_id){
        await user.update({
          $pull: {
            "cart.details":{
              "cart.details.detail_id": coupon_id
            }
          }
        });
        return res.send(sendJsonWithTokens(req,"successfuly"));
      }
    });

  } catch (error) {
	  return next(error);
  }
})

module.exports = router;