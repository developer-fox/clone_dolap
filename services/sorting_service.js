
module.exports = (notices,sortings) => {
  let result = notices;
  if(sorting === notice_get_sorting_parameters.maximumPrice){
    result.sort(function(a,b){
      return  (b.price_details.saling_price) - (a.price_details.saling_price); 
    })
  }
  else if(sorting === notice_get_sorting_parameters.minimumPrice){
    result.sort(function(a,b){
      return  (a.price_details.saling_price) - (b.price_details.saling_price); 
    })
  }
  else if(sorting === notice_get_sorting_parameters.mostDisplayed){
    result.sort(function(a,b){
      return  (b.displayed_count) - (a.displayed_count); 
    })
  }
  else if(sorting === notice_get_sorting_parameters.mostFavorite){
    result.sort(function(a,b){
      return  (b.favorites_count) - (a.favorites_count); 
    })
  }
  else if(sorting === notice_get_sorting_parameters.mostOffer){
    result.sort(function(a,b){
      return  (b.offers_count) - (a.offers_count); 
    })
  }
  else if(sorting === notice_get_sorting_parameters.newest){
    result.sort(function(a,b){
      return  Date.parse(b.created_date) - (a.created_date); 
    })
  }
  else if(sorting === notice_get_sorting_parameters.related){
    result = result;
  }
  else{
    return next(new Error("an error detected when sorting notices"));
  }

  return result;

}
