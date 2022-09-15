const user_model = require("../model/mongoose_models/user_model");

module.exports.forLooking = async(user_id)=>{
  try {    
	  const user = await user_model.findById(user_id).select("user_looked_notices").populate("user_looked_notices","details");
    let bottomCategoriesWithCount = {};
    for await(let looked_notice of user.user_looked_notices){
      let currentCategory = looked_notice.details.category.bottom_category;
      if(Object.keys(bottomCategoriesWithCount).includes(currentCategory)){
        bottomCategoriesWithCount[currentCategory] = bottomCategoriesWithCount[currentCategory] +1;
      }
      else{
        bottomCategoriesWithCount[currentCategory] = 1;
      }
    }
    let mostFavoriteCategory = Object.keys(bottomCategoriesWithCount)[0];
    for(let currentKey of Object.keys(bottomCategoriesWithCount)){
      let currentValue = bottomCategoriesWithCount[currentKey];
      if(currentValue > bottomCategoriesWithCount[mostFavoriteCategory]){
        mostFavoriteCategory = currentKey;
      }
    };
    return mostFavoriteCategory;
  } catch (error) {
    throw error;
  }
}

module.exports.forSaling = async(user_id)=>{
  try {    
	  const user = await user_model.findById(user_id).select("notices").populate("notices","details");
    let bottomCategoriesWithCount = {};
    for await(let looked_notice of user.notices){
      let currentCategory = looked_notice.details.category.bottom_category;
      if(Object.keys(bottomCategoriesWithCount).includes(currentCategory)){
        bottomCategoriesWithCount[currentCategory] = bottomCategoriesWithCount[currentCategory] +1;
      }
      else{
        bottomCategoriesWithCount[currentCategory] = 1;
      }
    }
    let mostFavoriteCategory = Object.keys(bottomCategoriesWithCount)[0];
    for(let currentKey of Object.keys(bottomCategoriesWithCount)){
      let currentValue = bottomCategoriesWithCount[currentKey];
      if(currentValue > bottomCategoriesWithCount[mostFavoriteCategory]){
        mostFavoriteCategory = currentKey;
      }
    };
    return mostFavoriteCategory;
  } catch (error) {
    throw error;
  }
}