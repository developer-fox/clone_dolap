
const express = require('express');
const controllers = require("../controllers/authentication_controllers");
const { isEmailNotUsing } = require('../data_access/authentication_access');
const validators = require("../validation/authentication_validators");
const jwtService= require('../services/jwt_services');
const router = express.Router();
const userModel = require('../model/mongoose_models/user_model');
const crypto= require("crypto");
const emailService = require('../services/mail_services');
const { sendJsonWithTokens } = require('../services/response_sendjson');
const error_types = require('../model/api_models/error_types');
const error_handling_services = require('../services/error_handling_services');

router.post("/signup",validators.isEmail, validators.isPasswordPowerless,validators.isUsernameValid,validators.isPhoneNumberValid, controllers.signupController);
router.post("/login_with_username", validators.isUsernameValid, controllers.loginController);
router.post("/login_with_email", validators.isEmail, controllers.loginController);
router.post("/change_password", jwtService.validateJwt, validators.isNewPasswordPowerless, controllers.newPasswordController);
router.post("/send_validation_mail",jwtService.validateJwt, async (req,res,next)=>{
  try {
    const user = await userModel.findById(req.decoded.id).select("is_validated_with_email username email");
    if(user.is_validated_with_email == false){
      const hash = crypto.randomBytes(36).toString("base64");
      await user.updateOne({
        $set: {
          email_validation_hashed_route: hash,
        }
      });

      emailService.emailValidationMail(user.email, user.username,"http://localhost:3000");
      return res.send(sendJsonWithTokens(req,error_types.success));
    }
    else{
      return next(new Error(error_handling_services(error_types.logicalError,"this mail address is already validated")));
    }
  } catch (error) {
    return next(error);
  }
})
router.post("/validate_mail/:hashed_route",jwtService.validateJwt, async (req, res, next)=>{
  const hash = req.params.hashed_route;
  try {
    const user = await userModel.findById(req.decoded.id).select("email_validation_hashed_route is_validated_with_email");
    if(!user) return next(new Error(error_handling_services(error_types.dataNotFound,"user")));
    if(hash != user.email_validation_hashed_route){
      return next(new Error(error_handling_services(error_types.logicalError,"wrong action")));
    }
    else{
      await user.updateOne({
        $set:{
          is_validated_with_email: true
        }
      });
      return res.send(sendJsonWithTokens(req,error_types.success));
    }
  } catch (error) {
    return next(error);
  }
})


// delete account route add later
module.exports = router;