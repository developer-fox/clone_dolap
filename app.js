
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

// routes
const  errorsMiddleware  = require('./controllers/error_handler_controller').errorsMiddleware;
const authenticationRoutes = require("./routes/authentication_routes");
const accountRoutes = require("./routes/account_routes");
const noticeRoutes = require("./routes/notice_routes");
const userRoutes = require("./routes/user_routes");
const docsRoutes = require("./routes/docs_routes");
//middlewares
const app = express();
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

const transporter = nodemailer.createTransport(sendgridTransport({
  apiKey: "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"
}));

transporter.use("compile", mailerPug.pugEngine({
  templateDir: __dirname +"/templates",
  pretty: true
}))

app.use("/pug", async (req, res, next)=>{
  transporter.sendMail({
    to: process.env.MAIL2,
    from: process.env.MAIL,
    subject: "Ürününe Yorum Yapıldı",
    template: "new_comment",
    ctx: {
      username: "@dolap74412",
      image_url :"http://localhost:3200/docs/notice*63063daa94a6a6582fcfd37b+0*e6804629-2f43-44f5-a4bd-99de30bb5cf6.jpg",
      brand: "Corsair",
      saling_price: 150,
      comment: "lorem ipsum dolor sit amet authentication",
      category: "Oyuncu Mouse",
      deep_link: "http://localhost:3200/"    
    }
  });
  return res.send("succ");
})

app.use("/render", async (req, res, next)=>{
  res.render("send_offer_to_favoriteds.pug", {
    username: "dolap74412",
    image_url :"http://localhost:3200/docs/notice*63063daa94a6a6582fcfd37b+0*e6804629-2f43-44f5-a4bd-99de30bb5cf6.jpg",
    brand: "Corsair",
    price: 120,
    category: "Oyuncu Mouse",
    deep_link: "http://localhost:3200/"
  });
})

app.use(errorsMiddleware);
mongoose.connect(process.env.MONGODB_URL).then((connection)=>{
  app.listen(process.env.PORT);
})
.catch((err)=>{
  console.log(err);
});