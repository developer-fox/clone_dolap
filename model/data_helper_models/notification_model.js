
const notification_types = require('./notification_types');
class notificationModel{
  constructor(title,subtitle,type,date,items){
    this.title = title;
    this.subtitle = subtitle;
    this.type = type;
    this.date = date;
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

  modelToNotificationNotation(){
    return {
      title: this.title,
      type: this.type
    }
  }

};

module.exports = notificationModel;