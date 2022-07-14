require("dotenv").config();
const path = require("path")
const nodemailer = require('nodemailer')
const axios = require("axios");
//var kappSms = require('kap-sms');
const smtpTransport = require('nodemailer-smtp-transport')

// const accountSid = "AC22b93290d7ef5b6de64999a8712b7d3d";
// const authToken = "e08cec8e90a6c98b20fc42339d009309";
// const client = require('twilio')(accountSid, authToken);
// console.log('client fffff',client);
const transporter = nodemailer.createTransport((smtpTransport({
  service: 'gmail',
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD
  }
})));

var options = {
  "method": "POST",
  "hostname": "http://trans.kapsystem.com/api/v3/",
  "port": null,
  "path": "/SMSApi/rest/send",
  "headers": {
    "content-type": "application/x-www-form-urlencoded",
    "cache-control": "no-cache"
  }
};

class MailService {

  async sendMail(mailOptions, withTemplate = true) {
    //console.log("mailOptions", mailOptions);
    transporter.sendMail(mailOptions).then((error, info) => {
      //console.log("error, info", error, info);
    }).catch((err) => {
      console.log("err", err);
    });
  }

  
  async userEmailVerification(data) {
   // console.log("data", data);
    let html = `Your Agrotech login credentials<br>\n EmailId: ${data.email} <br>\n Password:${data.password}`

    let mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: data.email,
      subject: `Agrotech Login credential`,
      html: html
    };

    this.sendMail(mailOptions, true);
  }
  async subAdmin(data) {
    console.log("data", data);
     let html = `Your Ombc subadmin login credential emailId :${data.email} and password :${data.password}<br>`
 
     let mailOptions = {
       from: process.env.ADMIN_EMAIL,
       to: data.email,
       subject: `Ombc email verification`,
       html: html
     };
 
     this.sendMail(mailOptions, true);
   }
  async userApprovalStatus(data) {
    console.log("data", process.env.NODEMAILER_EMAIL);
    let html
    if(data.status=="APPROVED"){
      html = `Hi ${data.name}, <br>\n Your Agrotech Account is ${data.status} by Agrotech Admin.You Can Login Now  `
    }
    if(data.status=="REJECTED"){
      html = `Hi ${data.name}, <br>\n Your Agrotech Account is ${data.status} by Agrotech Admin.please contact Agrotech Team `
    }
    let mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: data.email,
      subject: `Agrotech Account approval status`,
      html: html
    };

    this.sendMail(mailOptions, true);
  }

  
  async adminForgetPasswordVerification(data) {
    console.log("data", data);
    let html = `Your Ombc reset password link here ${data.link} <br>`

    let mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: data.email,
      subject: `Ombc reset password`,
      html: html
    };

    this.sendMail(mailOptions, true);
  }

  async userForgetPasswordVerification(data) {
    console.log("data", data);
    let html = `Your Agrotech forgot password verification code is ${data.emailVerificationCode} <br>`

    let mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: data.email,
      subject: `Agrotech reset password`,
      html: html
    };

    this.sendMail(mailOptions, true);
  }

  async photographerEmailVerification(data) {
    console.log("data", data);
    let html = `Your Ombc email verification link is ${data.link} <br>`

    let mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: data.email,
      subject: `Ombc email verification`,
      html: html
    };

    this.sendMail(mailOptions, true);
  }

  async photographerForgetPasswordVerification(data) {
    console.log("data", data);
    let html = `Your Ombc reset password link here ${data.link} <br>`

    let mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: data.email,
      subject: `Ombc reset password`,
      html: html
    };

    this.sendMail(mailOptions, true);
  }

  async sendCredentialAndVerificationCode(data) {
    console.log("data", data);
    let html = `Your Ombc credential and verification code is <br> <br> EmailId : ${data.email}, <br> Password : ${data.password} <br> Verification Code : ${data.emailVerificationCode}`

    let mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: data.email,
      subject: `Ombc user credential and verification`,
      html: html
    };

    this.sendMail(mailOptions, true);
  }
  async userLowBalanceEmail(data) {
    // console.log("data", data);
     let html = `Your Ombc subscription Balance is Low..please Recharge <br>`
 
     let mailOptions = {
       from: process.env.ADMIN_EMAIL,
       to: data.email,
       subject: `Ombc Subscription Low Balance Email `,
       html: html
     };
 
     this.sendMail(mailOptions, true);
   }
   async notificationEmail(data) {
    // console.log("data", data);
     let html = `Your Ombc subscription Order is Delivery by Tommorrow 9 AM..Please Bring Bag To Collect An Order From Delivery Boy  <br>`
 
     let mailOptions = {
       from: process.env.ADMIN_EMAIL,
       to: data.email,
       subject: `Ombc Subscription Order Delivery Notification`,
       html: html
     };
 
     this.sendMail(mailOptions, true);
   }
  //  async smsOtp(data) {
  //   // console.log("data", data);
  //    let html = `Your OTP for mobile verification is ${data.smsOtp}.Thank You, OMBC<br>`
  //    let mobileNumber=data.mobileNumber
 
  //      axios.get(`http://trans.kapsystem.com/api/v4/?api_key=Afffcb5e679e974e5e5fc7e32d9b6d72e&to=${mobileNumber}&method=sms&sender=OMBCDL&message=${html}&unicode=auto&template_id=1607100000000010334&template_name=otp`, {
  
  //   })
  //   .then((response) => {
  //     console.log("axios",response);
  //   }, (error) => {
  //     console.log("axios",error);
  //   });
  //  }
  
}
module.exports = new MailService();