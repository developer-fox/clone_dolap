
// dependencies
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwtService = require("./services/jwt_services");
const http = require("http");
const app = express();
const socketManager = require("./services/socket_manager");
const server = http.createServer(app);
socketManager.initializeIo(server);
const socket_services = require("./services/socket_services")(socketManager.getIo());

// routes
const  errorsMiddleware  = require('./controllers/error_handler_controller');
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

app.use("/render", (req, res, next)=>{
  return res.render("validate_email.pug");

})

app.use(errorsMiddleware);


mongoose.connect(process.env.MONGODB_URL)
.then(async (connection)=>{
  server.listen(process.env.PORT);
})
.catch((err)=>{
  console.log(err);
});