
const express = require('express');
const controllers = require("../controllers/authentication_controllers");
const { isEmailNotUsing } = require('../data_access/authentication_access');
const validators = require("../validation/authentication_validators");
const jwtService= require('../services/jwt_services');
const router = express.Router();

router.post("/signup",validators.isEmail, validators.isPasswordPowerless,validators.isUsernameValid,validators.isPhoneNumberValid, controllers.signupController);
router.post("/login_with_username", validators.isUsernameValid, controllers.loginController);
router.post("/login_with_email", validators.isEmail, controllers.loginController);
router.post("/change_password", jwtService.validateJwt, validators.isNewPasswordPowerless, controllers.newPasswordController);
// delete account route add later
module.exports = router;