
const express = require('express');
const noticeModel = require('../model/mongoose_models/notice_model');
const brands = require('../model/data_helper_models/brands.json');
const useCases = require('../model/data_helper_models/notice_use_cases');
const colors = require('../model/data_helper_models/colors');
const cargo_sizes = require('../model/data_helper_models/cargo_sizes');
const cargo_payers = require('../model/data_helper_models/cargo_payers');
const user_model = require('../model/mongoose_models/user_model');
const { sendJsonWithTokens } = require('../services/response_sendjson');

const router = express.Router();

router.post("/add_notice", async (req, res, next)=>{

  if(!req.body.data.title || req.body.data.title.length < 5){
    return next(new Error("invalid title type/length"));
  }
  if(!req.body.data.description){
    return next(new Error("invalid description type/length"));
  }
  if(req.body.data.photos.length <3){
    return next(new Error("invalid photo count"));
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
    photos: req.body.data.photos,
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
      const result = await user_model.findByIdAndUpdate(req.decoded.id, {$addToSet: {notices: access._id}});
      return res.send(sendJsonWithTokens(req, "successfuly"));
    }
  } catch (error) {
    return next(error);
  }

})


router.post("/deneme",  async (req, res, next)=>{
  const notice = await noticeModel.findById("6308731a8660f1fb095a9a94");
  notice.cucumber.push({
    question: {
        date: new Date(),
        user: req.decoded.id,
        content: "bu bir denemedir",
    },
    }
  );

  await notice.save();
});



module.exports = router;