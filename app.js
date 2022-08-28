
// dependencies
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const crypto = require('crypto')
const tokenService = require("./services/jwt_services");
const { sendJsonWithTokens } = require('./services/response_sendjson');
const jwtService = require("./services/jwt_services");
const notice_model = require('./model/mongoose_models/notice_model');
const noticeCategories = require('./model/data_helper_models/notice_top_categories.js');
const noticeUseCases = require('./model/data_helper_models/notice_use_cases');
const notice_sizes = require('./model/data_helper_models/notice_sizes');
const { ObjectId } = require('mongodb');
const coupon_model = require('./model/mongoose_models/coupon_model');
const couponExtents = require('./model/data_helper_models/coupon_extent.js');
const env = require("dotenv").config();
const uuid = require('uuid');
const user_model = require('./model/mongoose_models/user_model');
const schedule = require("node-schedule");

// routes
const  errorsMiddleware  = require('./controllers/error_handler_controller').errorsMiddleware;
const authenticationRoutes = require("./routes/authentication_routes");
const accountRoutes = require("./routes/account_routes");
const noticeRoutes = require("./routes/notice_routes");
const userRoutes = require("./routes/user_routes");
const { setTimeout } = require('timers/promises');
//middlewares
const app = express();
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  req.token = req.headers["x-access-token"]; 
  next();
})


// routers
app.use("/auth",authenticationRoutes);
app.use("/account", jwtService.validateJwt,accountRoutes);
app.use("/notice", jwtService.validateJwt, noticeRoutes);
app.use("/user", jwtService.validateJwt, userRoutes);

app.use(errorsMiddleware);
mongoose.connect(process.env.MONGODB_URL).then((connection)=>{
  app.listen(process.env.PORT);
})
.catch((err)=> console.log(err));