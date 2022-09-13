
const express = require("express");
const error_types = require("../model/api_models/error_types");
const notice_get_filters = require("../model/data_helper_models/notice_get_filters");
const notice_get_sorting_parameters = require("../model/data_helper_models/notice_get_sorting_parameters");
const notice_states = require("../model/data_helper_models/notice_states");
const notice_model = require("../model/mongoose_models/notice_model");
const user_model = require("../model/mongoose_models/user_model");
const error_handling_services = require("../services/error_handling_services");
const filtering_service = require("../services/filtering_service");
const { sendJsonWithTokens } = require("../services/response_sendjson");
const sorting_service = require("../services/sorting_service");

const  router= express.Router();

router.post("/:search_string", async (req, res, next)=>{
  let search_string = req.params.search_string;
  let regex = "";
  let isSearchingUser = false;
  if(search_string[0]== "@"){
    search_string= search_string.slice(1);
    isSearchingUser = true;
  }

  if(search_string.includes(" ")){
    const words = search_string.split(" ");
    for(let i = 0; i < words.length; i++){
      if(i!=0 && i!= words.length-1){
        regex += words[i];
        regex+= "|";
      }
      else if(i ==0){
        regex += "(";
        regex+= words[i];
        regex+="|"
      }
      else{
        regex += words[i];
        regex += ")";
      }
    }
  }
  else{
    regex = search_string;
  }

  const foundUsers = await user_model.find({username: {$regex: regex}}).select("username");
  let data = {
    users: foundUsers.slice(0,12)
  };
  if(isSearchingUser){
    return res.send(sendJsonWithTokens(req,data));
  }
  else{
    const foundNoticeAtTitle = await notice_model.find({title: {$regex: regex}}).select("title");
    const foundNoticeAtBrand = await notice_model.find({"details.brand": {$regex: regex}, }).select("title");
    const foundNoticeAtSize = await notice_model.find({"details.size": {$regex: regex}, }).select("title");
    const foundNoticeAtColor = await notice_model.find({"details.color": {$regex: regex}, }).select("title");
    const noticesSet = new Set();
    foundNoticeAtTitle.forEach(notice=>{
      noticesSet.add(notice.id);
    });
    foundNoticeAtBrand.forEach(notice=>{
      noticesSet.add(notice.id);
    });
    foundNoticeAtSize.forEach(notice=>{
      noticesSet.add(notice.id);
    });
    foundNoticeAtColor.forEach(notice=>{
      noticesSet.add(notice.id);
    });
    data.notices = [
      ...noticesSet
    ].slice(0,12);
    await user_model.findByIdAndUpdate(req.decoded.id, {
      $set: {
        last_search: Array.from(noticesSet)
      }
    });
    return res.send(sendJsonWithTokens(req,data))
  }

})

router.get("/get_last_search/:page", async (req, res, next)=>{
  const page = req.params.page;
  const filters = req.body.filters;
  const sorting = req.body.sorting;

  if(Number.isNaN(Number.parseInt(page))) return next(new Error(error_handling_services(error_types.invalidValue,page)));
  try {
    if(!filters && !sorting){
      const lastSearchedItems = await user_model.findById(req.decoded.id).select("last_search").populate({
        path: "last_search",
        select: "profile_photo details.brand details.size price_details.saling_price favorites_count is_featured created_date payer_of_cargo",
        skip: (page-1)*15,
        limit: 15
      });
      return res.send(sendJsonWithTokens(req,lastSearchedItems));
    }
    else{
      if(filters){
        Object.keys(filters).forEach(key=>{
          if(!notice_get_filters.includes(key)){
            return next(new Error(error_handling_services(error_types.invalidValue,key)));
          }
        })
      }    
      if(sorting && !Object.values(notice_get_sorting_parameters).includes(sorting)){
        return next(new Error(error_handling_services(error_types.invalidValue,sorting)));
      }
    
      let result;
      const notices = await user_model.findById(req.decoded.id).select("last_search").populate({
        path: "last_search",
        select: "profile_photo details.brand details.size price_details.saling_price favorites_count is_featured created_date payer_of_cargo",
      });
      if(filters){
        result = filtering_service(notices,filters);
      }
      if(sorting){
        result = sorting_service(notices,sorting);
      }
      return res.send(sendJsonWithTokens(req,result.slice((page-1)*15, (page*15)),));
    }
  } catch (error) {
    return next(error);
  } 
})

module.exports= router;