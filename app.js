
// dependencies
const express = require('express');
const app = express();
const http = require("http");
const server = http.createServer(app);
const socketManager = require("./services/socket_manager");
socketManager.initializeIo(server);
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const ms = require("ms");
const jwtService = require("./services/jwt_services");
const loggingService = require("./services/logging_service");
const helmet =require("helmet");
const rateLimit = require("express-rate-limit");
const mongoStore = require("rate-limit-mongo");

const limiter = rateLimit({
  windowMs: ms("1m"),
  max: 1500,
  store: new mongoStore({
    uri: process.env.MONGODB_URL,
    expireTimeMs: ms("10m"),
    collectionName: "rate_records"
  }),
  standardHeaders: false, 
	legacyHeaders: true,
})

// routes
const  errorsMiddleware  = require('./controllers/error_handler_middleware');
const authenticationRoutes = require("./routes/authentication_routes");
const accountRoutes = require("./routes/account_routes");
const noticeRoutes = require("./routes/notice_routes");
const otherUserRoutes = require("./routes/other_users_routes");
const saleRoutes = require("./routes/sale_routes");
const searchRoutes = require("./routes/search_routes");
const offerRoutes = require("./routes/offer_routes");
const reportRoutes = require("./routes/report_routes");
const commentRoutes = require("./routes/comment_routes");
const publicRoutes = require("./routes/public_routes");
const ownedNoticeRoutes = require("./routes/owned_notice_routes");

//middlewares
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(limiter);
app.use(loggingService);
app.use((req, res, next) => {
  req.token = req.headers["x-access-token"]; 
  next();
});

// define view engine
app.set('view engine',"pug");
app.set("views", __dirname +"/templates");

// routers
app.use("/public", publicRoutes);
app.use("/auth",authenticationRoutes);
app.use("/account", jwtService.validateJwt,accountRoutes);
app.use("/notice", jwtService.validateJwt, noticeRoutes);
app.use("/other_user", jwtService.validateJwt, otherUserRoutes);
app.use("/sale", jwtService.validateJwt, saleRoutes);
app.use("/search", jwtService.validateJwt, searchRoutes);
app.use("/offer", jwtService.validateJwt, offerRoutes);
app.use("/comment", jwtService.validateJwt, commentRoutes);
app.use("/report", jwtService.validateJwt, reportRoutes);
app.use("/owned_notice", jwtService.validateJwt, ownedNoticeRoutes);
app.get("/favicon.ico",(req, res, next)=>{
  return res.send("a favicon");
})

app.use("/",(req,res, next)=>{
  return res.status(404).send("page not found");
})


app.use(errorsMiddleware);

mongoose.connect(process.env.MONGODB_URL)
.then(async (connection)=>{
  const PORT = process.env.PORT || 8080;
  server.listen(PORT);
})
.catch((err)=>{
  console.log(err);
});