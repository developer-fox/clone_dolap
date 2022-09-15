
class notificationModel{
  constructor(title,subtitle,type,date,items){
    this.title = title;
    this.subtitle = subtitle;
    this.type = type;
    this.date = date;
    // [items] = [{item_id: _id, item_type: "item_type"}];
    this.items = items;
  };

  modelToObject(){
    return {
      notification_category: this.type,
      Notification_title: this.title,
      Notification_subtitle: this.subtitle,
      notification_date: this.date,
      notification_items: this.items, 
    };
  }

};

module.exports = notificationModel;