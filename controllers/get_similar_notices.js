
const noticeModel = require("../model/mongoose_models/notice_model");
const notice_states=  require("../model/data_helper_models/notice_states");

module.exports = async function(notice_id, selectedParameters,numberForEachSimilateLevel){
  try {
	  const notice = await noticeModel.findById(notice_id);
	  if(!notice) throw new Error("notice not found");
	
	  const similarNoticesLevel1 = await noticeModel.find({
	    "details.category.top_category": notice.details.category.top_category, 
	    "details.category.medium_category": notice.details.category.medium_category, 
	    "details.category.bottom_category": notice.details.category.bottom_category,
	    "details.category.detail_category": notice.details.category.detail_category,
      
	    "details.brand": notice.details.brand,
	    "details.color": notice.details.color,
      "price_details.saling_price": {$gte: notice.price_details.saling_price*(13/10), $lte: notice.price_details.saling_price*(7/10)},
      state: notice_states.takable,
	  },
    {
    }).select(selectedParameters).skip(page == null ?  0:(page-1)).limit(numberForEachSimilateLevel);

	  const similarNoticesLevel2 = await noticeModel.find({
      "details.category.top_category": notice.details.category.top_category, 
	    "details.category.medium_category": notice.details.category.medium_category, 
      "details.category.bottom_category": notice.details.category.bottom_category,
	    "details.brand": notice.details.brand,
	    "details.color": notice.details.color,
      "price_details.saling_price": {$gte: notice.price_details.saling_price*(13/10), $lte: notice.price_details.saling_price*(7/10)},
      state: notice_states.takable,
	  }).select(selectedParameters).skip(page == null ?  0:(page-1)).limit(numberForEachSimilateLevel);

	  const similarNoticesLevel3 = await noticeModel.find({
      "details.category.top_category": notice.details.category.top_category, 
      "details.category.medium_category": notice.details.category.medium_category, 
      "price_details.saling_price": {$gte: notice.price_details.saling_price*(14/10), $lte: notice.price_details.saling_price*(6/10)},
      state: notice_states.takable,
	  }).select(selectedParameters).skip(page == null ?  0:(page-1)).limit(numberForEachSimilateLevel);

    const similarNotices = [...similarNoticesLevel1, ...similarNoticesLevel2, ...similarNoticesLevel3];
    return similarNotices;

  } catch (error) {
	  throw error;
  }
}