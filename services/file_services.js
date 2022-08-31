
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const uuid = require("uuid");
const mongoose = require("mongoose");
const notice_model = require("../model/mongoose_models/notice_model");
const user_model = require("../model/mongoose_models/user_model");
const noticeCreatingStorage = multer.diskStorage({
  destination: async (req,file,cb)=>{
    const notice_id = req.body.notice_id;
    if(!notice_id) return cb(new Error("notice id cannot be empty"),false);
    try {
      const parsedId = JSON.parse(notice_id).id;
      if(!mongoose.isValidObjectId(parsedId)) return cb(new Error("invalid notice id"),false);
      const notice = await notice_model.findById(parsedId).select("saler_user photos profile_photo photos_replace_count");

      if(!notice._id) return cb(new Error("notice not found"),false);
      if(!notice.photos || notice.photos.length != 0) return cb(new Error("you cant create notice photos"),false);
      if(notice.photos_replace_count != 0) return cb(new Error("you already created photos"),false);
      //if(notice.saler_user != req.decoded.id) return cb(new Error("authorization failed: you cannot this action"),false);
      if(!fs.existsSync(`./files/notice/${parsedId}+${notice.photos_replace_count}`)){
        fs.mkdirSync(`./files/notice/${parsedId}+${notice.photos_replace_count}`);
      }
      await fs.readdir(`./files/notice/${parsedId}+${notice.photos_replace_count}`, (err,files)=>{
        if(files.length>8) return cb(new Error("you cant add new file"),false);
      })
      req.notice_id = notice._id;
      cb(null,`./files/notice/${parsedId}+${notice.photos_replace_count}`);
    } catch (error) {
      return cb(error, false);
    }
  },

  filename: async (req,file,cb)=>{
    cb(null, uuid.v4() + "." + file.originalname.split(".")[1]);
  }
})

const noticeUpdatingStorage = multer.diskStorage({
  destination: async (req,file,cb)=>{
    const notice_id = req.body.notice_id;
    if(!notice_id) return cb(new Error("notice id cannot be empty"),false);
    try {
      const parsedId = JSON.parse(notice_id).id;
      if(!mongoose.isValidObjectId(parsedId)) return cb(new Error("invalid notice id"),false);
      const notice = await notice_model.findById(parsedId).select("saler_user photos profile_photo photos_replace_count");

      if(!notice._id) return cb(new Error("notice not found"),false);
      //if(notice.saler_user != req.decoded.id) return cb(new Error("authorization failed: you cannot this action"),false);
      if(!fs.existsSync(`./files/notice/${parsedId}+${notice.photos_replace_count+1}`)){
        fs.mkdirSync(`./files/notice/${parsedId}+${notice.photos_replace_count+1}`);
      }

      await fs.readdir(`./files/notice/${parsedId}+${notice.photos_replace_count+1}`, (err,files)=>{
        if(files.length>8) return cb(new Error("you cant add new file"),false);
      })
      req.notice_id = notice._id;
      req.newFolder = `./files/notice/${parsedId}+${notice.photos_replace_count+1}`;
      cb(null,`./files/notice/${parsedId}+${notice.photos_replace_count+1}`);
    } catch (error) {
      return cb(error, false);
    }
  },

  filename: async (req,file,cb)=>{
    cb(null, uuid.v4() + "." + file.originalname.split(".")[1]);
  }
})

const userStorage = multer.diskStorage({
  destination: (req,file,cb)=>{
    cb(null,"files/user");
  },

  filename: async (req,file,cb)=>{
    const user = await user_model.findById(req.decoded.id).select("profile_photo profile_photo_replace_count");
    if(!user) return cb(new Error("user not found"),false); 
    
    const fileName = uuid.v4() +`+${user.profile_photo_replace_count+1}` +"." + file.originalname.split(".")[1];
    const path = `files/user/${fileName}`;
    req.filePath = path;
    cb(null, fileName);
  }
})

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

module.exports.uploadNoticeImages = multer({storage: noticeCreatingStorage, fileFilter: fileFilter}).fields([
  {name: "notice_images", maxCount: 8},
]);

module.exports.updateNoticeImages = multer({storage: noticeUpdatingStorage, fileFilter: fileFilter}).fields([
  {name: "notice_images", maxCount: 8},
]);

module.exports.updateUserImage = multer({storage: userStorage, fileFilter: fileFilter}).single("profile_photo");
