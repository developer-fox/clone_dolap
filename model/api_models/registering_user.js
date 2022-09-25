
const bcrypt = require('bcrypt');
const user_model = require('../mongoose_models/user_model');

class newUser{
  constructor(username,password, email,phone_number){
    this.email = email;
    this.password = password;
    this.phone_number = phone_number;
    this.username = username;
    this.last_seen = new Date();
  }

  async saveToDatabase(){
    try {
	    const result = await new user_model(this).save();
      if(!result._id){
        throw new Error("save access failed");
      }
      else{
        return result;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }
  

}

module.exports = newUser;