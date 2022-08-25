
const validator = require('express-validator');
const error_messages = require('../model/api_models/error_messages');
const login_types = require('../model/api_models/login_types');

module.exports.isEmail = validator.body("email").isEmail().withMessage(error_messages.emailFormat);
module.exports.isPasswordPowerless = validator.body("password").isStrongPassword().withMessage(error_messages.powerlessPassword);
module.exports.isPhoneNumberValid = validator.body("phone_number").notEmpty().withMessage(error_messages.phoneNumberFormat);
module.exports.isUsernameValid = validator.body("username").isLength({min: 6, max: 18}).withMessage(error_messages.usernameFormat);
module.exports.isNewPasswordPowerless = validator.body("newPassword").isStrongPassword().withMessage(error_messages.powerlessPassword);

module.exports.loginValidatorWithLoginTypes = validator.body("loginType").custom((value)=>{
  if(value == login_types.loginWithEmail){
    return true;
  }
  else if(value == login_types.loginWithUsername){
    return true;
  }
  throw new Error("invalid login type");
})
