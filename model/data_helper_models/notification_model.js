
class notificationModel{
  constructor(title,subtitle,type,date,item_id){
    this.title = title;
    this.subtitle = subtitle;
    this.type = type;
    this.date = date;
    this.item_id = item_id;
  };

  modelToObject(){
    return {
      notification_category: this.type,
      Notification_title: this.title,
      Notification_subtitle: this.subtitle,
      notification_date: this.date,
      notification_relating_id: this.item_id,
    };
  }


};

module.exports = notificationModel;