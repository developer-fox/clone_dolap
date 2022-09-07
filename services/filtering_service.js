
module.exports = (notices,filters)=>{
  let result = notices;
  let filteredNotics = [];
  if(filters){
    Object.keys(filters).forEach(key=>{
    if(!(["max_price","min_price","payer_of_cargo"].includes(key))){

      filters[key].forEach(value=>{
        result.forEach(notice => {
          if(key == "top_category"){
            if(notice.details.category.top_category === value){
              filteredNotics.push(notice);
            }
          }
          else if(key == "medium_category"){
            if(notice.details.category.medium_category === value){
              filteredNotics.push(notice);
            }
          }
          else if(key == "bottom_category"){
            if(notice.details.category.bottom_category === value){
              filteredNotics.push(notice);
            }
          }
          else if(key == "detail_category"){
            if(notice.details.category.detail_category === value){
              filteredNotics.push(notice);
            }
          }
          else if(key == "brand"){
            if(notice.details.brand === value){
              filteredNotics.push(notice);
            }
          }
          else if(key == "size"){
            if(notice.details.size === value){
              filteredNotics.push(notice);
            }
          }
          else if(key == "color"){
            if(notice.details.color === value){
              filteredNotics.push(notice);
            }
          }
          else if(key == "use_case"){
            if(notice.details.use_case === value){
              filteredNotics.push(notice);
            }
          }
        });
      });
    }
    else{
      result.forEach(notice => {
        if(key == "max_price"){
          if(notice.price_details.saling_price  <= filters[key]){
            filteredNotics.push(notice);
          }
        }
        else if(key == "min_price"){
          if(notice.price_details.saling_price  >= filters[key]){
            filteredNotics.push(notice);
          }
        }
        else if(key == "payer_of_cargo"){
          if(notice.payer_of_cargo === filters[key]){
            filteredNotics.push(notice);
          }
        }
        else{
          console.log("eszz");
        }

      })
    }
    result = filteredNotics;
    filteredNotics = [];
  }
    )
  }

  return result;

}
