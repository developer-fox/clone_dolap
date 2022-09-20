
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid");
const mailerPug = require("nodemailer-pug-engine");

const transporter = nodemailer.createTransport(sendgridTransport({
  apiKey: process.env.SENDGRID_KEY,
}));

transporter.use("compile", mailerPug.pugEngine({
  templateDir: __dirname +"/../templates",
  pretty: true
}))

module.exports.newCommentMail= (email,username,image_url, brand,saling_price,comment,category,deep_link)=>{
  try {
	  if(!email.split("@")[1].includes("example.com")){
      transporter.sendMail({
        to: email,
        from: process.env.MAIL,
        subject: "Ürününe Yorum Yapıldı",
        template: "new_comment",
        ctx: {
          username: username,
          image_url :image_url,
          brand: brand,
          saling_price: saling_price,
          comment: comment,
          category: category,
          deep_link: deep_link 
        }
      });
    }
  } catch (error) {
	  throw error;
  }
}

module.exports.newAnswerMail = (email,username,image_url, brand,category,deep_link)=>{
  try {
	  if (!email.split("@")[1].includes("example.com")) {
	    transporter.sendMail({
	    to: email,
	    from: process.env.MAIL,
	    subject: "Ürününe Yorum Yapıldı",
	    template: "new_answer",
	    ctx: {
	      username: username,
	      image_url :image_url,
	      brand: brand,
	      category: category,
	      deep_link: deep_link 
	    }
	  });
}
  } catch (error) {
	  throw error;
  }
}

module.exports.sendOfferToFavoritesMail = (email,offerer_username, image_url,brand,offer_price, category,deep_link) =>{
  try {
	  if (!email.split("@")[1].includes("example.com")) {
	transporter.sendMail({
	    to: email,
	    from: process.env.MAIL,
	    subject: "YENİ BİR TEKLİFİN VAR!",
	    template: "send_offer_to_favoriteds",
	    ctx:{
        username: offerer_username,
        image_url :image_url,
        brand: brand,
        price: offer_price,
        category: category,
        deep_link: deep_link
      }
	  });
}
  } catch (error) {
	  throw error;
  }
}

module.exports.blankMail = ()=>{
  transporter.sendMail({
    to: process.env.MAIL2,
    from : process.env.MAIL,
    subject: "blank",
    text: "an example"
  });
}

module.exports.newBuyingOfferMail = (email,offerer_username, image_url,brand,offer_price, category,deep_link) =>{
  try {
	  if (!email.split("@")[1].includes("example.com")) {
	transporter.sendMail({
	    to: email,
	    from: process.env.MAIL,
	    subject: "YENİ BİR TEKLİFİN VAR!",
	    template: "new_buying_offer",
	    ctx:{
        username: offerer_username,
        image_url :image_url,
        brand: brand,
        price: offer_price,
        category: category,
        deep_link: deep_link
      }
	  });
}
  } catch (error) {
	  throw error;
  }
}

module.exports.newSalingOffer = (email,offerer_username, image_url,brand,offer_price, category,deep_link) =>{
  try {
	  if (!email.split("@")[1].includes("example.com")) {
	transporter.sendMail({
	    to: email,
	    from: process.env.MAIL,
	    subject: "YENİ BİR SATIŞ TEKLİFİN VAR!",
	    template: "send_saling_offer",
	    ctx:{
        username: offerer_username,
        image_url :image_url,
        brand: brand,
        price: offer_price,
        category: category,
        deep_link: deep_link
      }
	  });
}
  } catch (error) {
	  throw error;
  }
}

module.exports.acceptOfferMail = (email,offerer_username, price,image_url,brand, category,deep_link) =>{
  try {
	  if (!email.split("@")[1].includes("example.com")) {
	transporter.sendMail({
	    to: email,
	    from: process.env.MAIL,
	    subject: `@${offerer_username} TEKLİFİNİ KABUL ETTİ!`,
	    template: "accept_offer",
	    ctx:{
        username: offerer_username,
        image_url :image_url,
        price: price,
        brand: brand,
        category: category,
        deep_link: deep_link
      }
	  });
}
  } catch (error) {
	  throw error;
  }
}

module.exports.acceptSaleOfferMail = (email,offerer_username, price,image_url,brand, category,deep_link) =>{
  try {
	  if (!email.split("@")[1].includes("example.com")) {
	transporter.sendMail({
	    to: email,
	    from: process.env.MAIL,
	    subject: "SATIŞ TEKLİFİN KABUL EDİLDİ!",
	    template: "accept_sale_offer",
	    ctx:{
        username: offerer_username,
        image_url :image_url,
        price: price,
        brand: brand,
        category: category,
        deep_link: deep_link
      }
	  });
}
  } catch (error) {
	  throw error;
  }
}

module.exports.declineSaleOfferMail = (email,offerer_username,image_url,brand, category,deep_link) =>{
  try {
	  if (!email.split("@")[1].includes("example.com")) {
	transporter.sendMail({
	    to: email,
	    from: process.env.MAIL,
	    subject: "SATIŞ TEKLİFİN REDDEDİLDİ",
	    template: "decline_sale_offer",
	    ctx:{
        username: offerer_username,
        image_url :image_url,
        brand: brand,
        category: category,
        deep_link: deep_link
      }
	  });
}
  } catch (error) {
	  throw error;
  }
}

module.exports.declinedOfferMail = (email,offerer_username, image_url,brand, category,deep_link) =>{
  try {
if (!email.split("@")[1].includes("example.com")) {
		  transporter.sendMail({
		    to: email,
		    from: process.env.MAIL,
		    subject: "TEKLİFİN REDDEDİLDİ.",
		    template: "decline_offer",
		    ctx:{
	        username: offerer_username,
	        image_url :image_url,
	        brand: brand,
	        category: category,
	        deep_link: deep_link
	      }
		  });
}
  } catch (error) {
	  throw error;
  }
}

module.exports.priceCutEmail = (email, image_url,brand, category, old_price, new_price,size, deep_link)=>{
  try {
	  if (!email.split("@")[1].includes("example.com")) {
	transporter.sendMail({
	    to: email,
	    from: process.env.MAIL,
	    subject: "Beğendiğin ürünün fiyatı düştü!",
	    template: "price_cut",
	    ctx:{
        image_url :image_url,
        brand: brand,
        category: category,
        old_price: old_price,
        new_price: new_price,
        size: size,
        deep_link: deep_link
      }
	  });
}
  } catch (error) {
	  throw error;
  }
}

module.exports.newOrderMail = (email, image_url,salername,buyername,brand, amount,order_code,payer_of_cargo,contact_name,notice_deeplink, order_deeplink)=>{
  try {
	  if (!email.split("@")[1].includes("example.com")) {
	transporter.sendMail({
	    to: email,
	    from: process.env.MAIL,
	    subject: "Yeni Siparişin Var!",
	    template: "new_order",
	    ctx:{
        salername: salername,
        buyername: buyername,
        amount: amount,
        brand: brand,
        order_code: order_code,
        payer_of_cargo: payer_of_cargo,
        contact_name: contact_name,
        notice_deeplink: notice_deeplink,
        order_deeplink: order_deeplink,
        image_url: image_url,
      }
	  });
}
  } catch (error) {
	  throw error;
  }
}

module.exports.newTakenNoticeMail = (email, image_url,buyername,brand, amount,order_code,payer_of_cargo,contact_name,notice_deeplink, order_deeplink)=>{
  try {
	  if (!email.split("@")[1].includes("example.com")) {
	transporter.sendMail({
	    to: email,
	    from: process.env.MAIL,
	    subject: "Siparişin Onaylandı!",
	    template: "new_taken_notice",
	    ctx:{
        buyername: buyername,
        amount: amount,
        order_code: order_code,
        brand: brand,
        payer_of_cargo: payer_of_cargo,
        contact_name: contact_name,
        notice_deeplink: notice_deeplink,
        order_deeplink: order_deeplink,
        image_url: image_url,
      }
	  });
}
  } catch (error) {
	  throw error;
  }
}

module.exports.emailValidationMail = (email,username,deep_link)=>{
  try {
	  if (!email.split("@")[1].includes("example.com")) {
	transporter.sendMail({
	    to: email,
	    from: process.env.MAIL,
	    subject: "E posta adresini onayla",
	    template: "validate_email",
	    ctx:{
        username: username,
        deep_link: deep_link,
      }
	  });
}
  } catch (error) {
	  console.log(error);
  }
}