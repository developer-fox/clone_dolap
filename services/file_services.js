
const multer = require("multer");
const uuid = require("uuid");
const mongoose = require("mongoose");
const notice_model = require("../model/mongoose_models/notice_model");
const user_model = require("../model/mongoose_models/user_model");
const aws = require("aws-sdk");
const multer_s3 = require("multer-s3");
const error_handling_services = require("./error_handling_services");
const error_types = require("../model/api_models/error_types");

const defaultUserProfilePhotoUrl = "https://dolap-backend-bucket.s3.eu-west-2.amazonaws.com/blank-user.jpg";

const creds = {
  accessKeyId:  process.env.aws_access_key,
  secretAccessKey: process.env.aws_secret_key,
};

// s3 storage init
const s3 = new aws.S3({
    credentials: creds,
    sslEnabled: false,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
});

const fileFilter =(req,file,cb)=>{
  if(!file) return cb(new Error("images not found"),false);
  const doctype = file.originalname.split(".")[1];
  const supportedTypes = ["jpg","jpeg","png","PNG"];
  if(supportedTypes.includes(doctype)){
    return cb(null,true);
  }
  let typeError = new Error("unsupported file type: " + doctype);
  cb(typeError, false);
}

const requestPathsAddMiddleware = (req,res,next) =>{
  req.paths = [];
  next();
}

const uploadNoticeImagesToS3 = multer({

  storage: multer_s3({
    s3: s3,
    bucket: process.env.bucket_name,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    contentType: multer_s3.AUTO_CONTENT_TYPE,
    key: async function(req,file,cb){
      const notice_id =req.params.notice_id;
      if(!notice_id) return cb(new Error(error_handling_services(error_types.dataNotFound,"notice id")),false);
      const parsedId = notice_id;
      if(!mongoose.isValidObjectId(parsedId)) return cb(new Error(error_handling_services(error_types.invalidValue,parsedId)),false);
      const notice = await notice_model.findById(parsedId).select("photos profile_photo saler_user");

      if(!notice._id) return cb(new Error(error_handling_services(error_types.dataNotFound,"notice")),false);
      if(!notice.photos || notice.photos.length != 0) return cb(new Error(error_handling_services(error_types.logicalError,"you cant create notice photos")),false);
      if(notice.saler_user != req.decoded.id) return cb(new Error(error_handling_services(error_types.authorizationError,"you are not saler of this notice")),false);
      req.notice_id = notice._id;
      const path = `notice_images/${notice.id}/${uuid.v4()}.${file.originalname.split(".")[file.originalname.split(".").length -1]}`;
      req.paths.push(path);
      cb(null,path);
    }
  },),
  fileFilter: fileFilter,
}).fields([{name: "notice_images", maxCount: 8}]);

const updateNoticeImagesToS3 = multer({

  storage: multer_s3({
    s3: s3,
    bucket: process.env.bucket_name,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    contentType: multer_s3.AUTO_CONTENT_TYPE,
    key: async function(req,file,cb){
      const notice_id =req.params.notice_id;
      if(!notice_id) return cb(new Error(error_handling_services(error_types.dataNotFound,"notice id")),false);
      const parsedId = notice_id;
      if(!mongoose.isValidObjectId(parsedId)) return cb(new Error(error_handling_services(error_types.invalidValue,parsedId)),false);
      const notice = await notice_model.findById(parsedId).select("photos profile_photo saler_user");

      if(!notice._id) return cb(new Error(error_handling_services(error_types.dataNotFound,"notice")),false);
      if(!notice.photos || notice.photos.length == 0) return cb(new Error(error_handling_services(error_types.logicalError,"you cant update notice photos")),false);
      if(notice.saler_user != req.decoded.id) return cb(new Error(error_handling_services(error_types.authorizationError,"you are not saler of this notice")),false);
      req.notice_id = notice._id;
      const path = `notice_images/${notice.id}/${uuid.v4()}.${file.originalname.split(".")[file.originalname.split(".").length -1]}`;
      req.paths.push(path);
      cb(null,path);
    }
  },),
  fileFilter: fileFilter,
}).fields([{name: "notice_images", maxCount: 8}]);

const deleteNoticeImages = async(req, res,next) => {
  const notice_id =req.params.notice_id;
  if(!notice_id) return cb(new Error(error_handling_services(error_types.dataNotFound,"notice id")),false);
  const parsedId = notice_id;
  if(!mongoose.isValidObjectId(parsedId)) return cb(new Error(error_handling_services(error_types.invalidValue,parsedId)),false);
  const notice = await notice_model.findById(parsedId).select("photos profile_photo saler_user");
  if(!notice._id) return cb(new Error(error_handling_services(error_types.dataNotFound,"notice")),false);
  if(notice.photos.length == 0) return cb(new Error(error_handling_services(error_types.logicalError,"you cant update notice photos")),false);
  if(notice.saler_user != req.decoded.id) return cb(new Error(error_handling_services(error_types.authorizationError,"you are not saler of this notice")),false);
  req.notice_id = notice._id;
  
  for await(let file of notice.photos){
    const params = {
      Bucket: process.env.bucket_name,
      Key: `notice_images/${file.split("notice_images/")[1]}`
    };
    await s3.deleteObject(params,(err,data) => {
      if(err) return next(err);
    })
  }

  next();
}

const deleteUserProfilePhoto = async(req, res,next) => {
  const user = await user_model.findById(req.decoded.id).select("profile_photo");
  if(!user) return next(new Error(error_handling_services(error_types.dataNotFound,"user")));
  if(user.profile_photo == defaultUserProfilePhotoUrl) return next(new Error(error_handling_services(error_types.logicalError,"user already have not profile photo")));
  const params = {
    Bucket: process.env.bucket_name,
    Key: `user_images/${user.profile_photo.split("user_images/")[1]}`
  };
  await s3.deleteObject(params,(err,data) => {
    if(err) return next(err);
  })  
  next();
}


const updateUserImage =  multer({
  storage: multer_s3({
    s3: s3,
    bucket: process.env.bucket_name,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    contentType: multer_s3.AUTO_CONTENT_TYPE,
    key: async function(req,file,cb){
      const user = await user_model.findById(req.decoded.id).select("profile_photo");
      if(!user) return cb(new Error(error_handling_services(error_types.dataNotFound,"user")),false); 
      if(user.profile_photo == defaultUserProfilePhotoUrl){
        let path = `user_images/${user.id}/${uuid.v4()}.${file.originalname.split(".")[file.originalname.split(".").length -1]}`;
        cb(null,path);
        req.profile_path = path;
      }
      else{
        let path = `user_images/${user.profile_photo.split("user_images/")[1]}`;
        cb(null,path);
        req.profile_path = path;
      }
    }
  },),
  fileFilter: fileFilter,
}).single("profile_photo");

module.exports.uploadNoticeImages = uploadNoticeImagesToS3,
module.exports.requestPathsAddMiddleware = requestPathsAddMiddleware,
module.exports.deleteNoticeImagesMiddleware = deleteNoticeImages,
module.exports.s3 = s3;
module.exports.updateNoticeImages = updateNoticeImagesToS3,
module.exports.updateUserImage = updateUserImage,
module.exports.deleteUserProfilePhoto = deleteUserProfilePhoto