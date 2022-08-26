
const express = require('express');
const noticeModel = require('../model/mongoose_models/notice_model');
const brands = require('../model/data_helper_models/brands.json');
const useCases = require('../model/data_helper_models/notice_use_cases');
const colors = require('../model/data_helper_models/colors');
const cargo_sizes = require('../model/data_helper_models/cargo_sizes');
const cargo_payers = require('../model/data_helper_models/cargo_payers');
const user_model = require('../model/mongoose_models/user_model');
const { sendJsonWithTokens } = require('../services/response_sendjson');
const { isValidObjectId } = require('mongoose');

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

router.post("/add_comment",  async (req, res, next)=>{

  const notice_id = req.body.notice_id;
  const content = req.body.content;

  if(!notice_id) return next(new Error("notice id cannot be empty"));

  if(!isValidObjectId(notice_id)){
    return next(new Error("invalid notice id data"));
  }

  if(!content || content.length<1){
    return next(new Error("content cannot be empty"));
  }
  
  try {
	  const notice = await noticeModel.findById(notice_id);
    if(!notice._id){
      return next(new Error("notice not found"));
    }

    notice.notice_questions.push({
	    question: {
	        date: new Date(),
	        user: req.decoded.id,
	        content: content,
	    },
	    }
	  );
	  await notice.save();
    return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }

});

router.post("/add_answer",  async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const comment_id = req.body.comment_id;
  const content = req.body.content;

  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(!comment_id) return next(new Error("comment id cannot be empty"));
  if(!isValidObjectId(comment_id)) return next(new Error("invalid comment id"));
  if(!content || content.length<1) return next(new Error("content cannot be empty"));

  try {
	  const notice = await noticeModel.findById(notice_id);
	  if(!notice) return next(new Error("notice not found"));
	  const comment = notice.notice_questions.id(comment_id);
	  if(!comment) return next(new Error("comment not found"));
	
	  comment.answers.push( { 
	    date: new Date(),
	    user: req.decoded.id,
	    content: content,
	  })
	  await notice.save();
	  return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }
})

router.get("/get_comments", async (req, res, next)=>{
  const notice_id = req.body.notice_id;

  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));

  try {
    const comments = await noticeModel.findById(notice_id).select("notice_questions -_id");
    if(!comments) return next(new Error("invalid comments taken"));
    return res.send(sendJsonWithTokens(req, comments));
  } catch (error) {
    return next(error);
  }

})

router.delete("/delete_comment",  async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const comment_id = req.body.comment_id;
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(!comment_id) return next(new Error("comment id cannot be empty"));
  if(!isValidObjectId(comment_id)) return next(new Error("invalid comment id"));

  try {
    const notice = await noticeModel.findById(notice_id).select("notice_questions");
    const comment = notice.notice_questions.id(comment_id);
    if(comment.question.user != req.decoded.id) return next(new Error("authorization fail"));
    const result = await noticeModel.findByIdAndUpdate(notice_id, {$pull: {
      notice_questions: {"_id": comment_id},
    }});
    return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }
})

router.delete("/delete_answer", async (req, res, next)=>{
  const notice_id = req.body.notice_id;
  const comment_id = req.body.comment_id;
  const answer_id = req.body.answer_id;
  if(!notice_id) return next(new Error("notice id cannot be empty"));
  if(!isValidObjectId(notice_id)) return next(new Error("invalid notice id"));
  if(!comment_id) return next(new Error("comment id cannot be empty"));
  if(!isValidObjectId(comment_id)) return next(new Error("invalid comment id"));
  if(!answer_id) return next(new Error("answer id cannot be empty"));
  if(!isValidObjectId(answer_id)) return next(new Error("invalid answer id"));

  try {
	  const notice = await noticeModel.findById(notice_id).select("notice_questions");
    if(!notice) return next(new Error("notice not found"));
    const answer = notice.notice_questions.id(comment_id).answers.id(answer_id);
    if(!answer) return next(new Error("answer not found"));
    if(answer.user != req.decoded.id) return next(new Error("authorization fail"));
    answer.remove();
    await notice.save();
    return res.send(sendJsonWithTokens(req,"successfuly"));
  } catch (error) {
    return next(error);
  }


})

module.exports = router;