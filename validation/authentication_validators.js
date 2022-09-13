
const validator = require('express-validator');
const login_types = require('../model/api_models/login_types');

module.exports.isEmail = validator.body("email").isEmail().withMessage("invalid email format");
module.exports.isPasswordPowerless = validator.body("password").isStrongPassword().withMessage("weak password");
module.exports.isPhoneNumberValid = validator.body("phone_number").notEmpty().withMessage("invalid phone number");
module.exports.isUsernameValid = validator.body("username").isLength({min: 6, max: 18}).withMessage("invalid username");
module.exports.isNewPasswordPowerless = validator.body("newPassword").isStrongPassword().withMessage("weak password");

module.exports.loginValidatorWithLoginTypes = validator.body("loginType").custom((value)=>{
  if(value == login_types.loginWithEmail){
    return true;
  }
  else if(value == login_types.loginWithUsername){
    return true;
  }
  throw new Error("invalid login type");
})
