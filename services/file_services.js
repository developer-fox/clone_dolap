
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const uuid = require("uuid");
const mongoose = require("mongoose");
const notice_model = require("../model/mongoose_models/notice_model");
const noticeStorage = multer.diskStorage({
  destination: async (req,file,cb)=>{
    const notice_id = req.body.notice_id;
    if(!notice_id) return cb(new Error("notice id cannot be empty"),false);
    try {
      const parsedId = JSON.parse(notice_id).id;
      if(!mongoose.isValidObjectId(parsedId)) return cb(new Error("invalid notice id"),false);
      const notice = await notice_model.findById(parsedId).select("saler_user photos profile_photo");

      if(!notice._id) return cb(new Error("notice not found"),false);
      if(!notice.photos || notice.photos.length != 0) return cb(new Error("you cant create notice photos"),false);
      //if(notice.saler_user != req.decoded.id) return cb(new Error("authorization failed: you cannot this action"),false);
      if(!fs.existsSync("./files/notice/" +parsedId)){
        fs.mkdirSync("./files/notice/" +parsedId);
      }
      await fs.readdir("./files/notice/" +parsedId, (err,files)=>{
        if(files.length>8) return cb(new Error("you cant add new file"),false);
      })
      req.notice_id = notice._id;
      cb(null,"files/notice/"+parsedId);
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

  filename: (req,file,cb)=>{
    cb(null, uuid.v4 + "." + file.originalname.split(".")[1]);
  }
})

const fileFilter =(req,file,cb)=>{
  if(!file) return cb(new Error("images not found"),false);
  const doctype = file.originalname.split(".")[1];
  const supportedTypes = ["jpg","jpeg","png"];
  if(supportedTypes.includes(doctype)){
    return cb(null,true);
  }
  let typeError = new Error("unsupported file type: " + doctype);
  cb(typeError, false);
}

module.exports.uploadNoticeImages = multer({storage: noticeStorage, fileFilter: fileFilter}).fields([
  {name: "notice_images", maxCount: 8},
]);

module.exports.uploadUserImage = multer({storage: userStorage, fileFilter: fileFilter}).single("profile_photo");