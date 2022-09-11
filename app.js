
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
const timeoutServices= require('./services/timeout_services');
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const ms = require("ms");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid");
const mailerPug = require("nodemailer-pug-engine");
const mailServices = require("./services/mail_services");
const http = require("http");
const app = express();
const socketManager = require("./services/socket_manager");
const server = http.createServer(app);
socketManager.initializeIo(server);
const socket_servives = require("./services/socket_services")(socketManager.getIo());

// routes
const  errorsMiddleware  = require('./controllers/error_handler_controller').errorsMiddleware;
const authenticationRoutes = require("./routes/authentication_routes");
const accountRoutes = require("./routes/account_routes");
const noticeRoutes = require("./routes/notice_routes");
const userRoutes = require("./routes/user_routes");
const docsRoutes = require("./routes/docs_routes");
const saleRoutes = require("./routes/sale_routes");
const searchRoutes = require("./routes/search_routes");
const notificationModel = require('./model/data_helper_models/notification_model');
//middlewares

app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  req.token = req.headers["x-access-token"]; 
  next();
})

// define view engine
app.set('view engine',"pug");
app.set("views", __dirname +"/templates");

// routers
app.use("/auth",authenticationRoutes);
app.use("/docs",docsRoutes)
app.use("/account", jwtService.validateJwt,accountRoutes);
app.use("/notice", jwtService.validateJwt, noticeRoutes);
app.use("/user", jwtService.validateJwt, userRoutes);
app.use("/sale", jwtService.validateJwt, saleRoutes);
app.use("/search", jwtService.validateJwt, searchRoutes);

app.use("/send/:socket_id",(req,res,next)=>{
  const model = new notificationModel("exam!","this is an exam","notices");

  socket_servives.emitNotificationOneUser(model,"H4YIcAOtWvN7cn8-AAAB");
  return res.send("successfuly");
})

app.use(errorsMiddleware);

mongoose.connect(process.env.MONGODB_URL).then(async (connection)=>{
  server.listen(process.env.PORT);

})
.catch((err)=>{
  console.log(err);
});