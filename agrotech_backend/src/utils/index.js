const bcrypt = require("bcrypt");
const { func } = require("joi");
const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');
const objectID = require("mongodb").ObjectID;


module.exports = {
    genHash: function (data) {
        let salt = bcrypt.genSaltSync(8);
        return bcrypt.hashSync(data, salt);
    },
    cleanSensitiveData: function (data) {
        (data.password) ? data.password = "" : data;
        return data;
    },
   // pagingData: require("./pagination"),
    currentDate: function (format = "YYYY-MM-DD") {
        return moment(new Date()).tz('Asia/kolkata').format(format)
    },
    currentTime: function (format = "HH:mm:ss") {
        return moment(new Date()).tz('Asia/kolkata').format(format)
    },
    currentDateTime: function () {
        return +moment(new Date()).tz('Asia/kolkata')
    },
    generateAccessToken: function (data) {
        return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE_TIME });
    },
    dateFormat: (date) => {
        let curDate = date.getDate();
        curDate = curDate <= 9 ? '0' + curDate : curDate;
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        
        return `${curDate}/${month}/${year}`;
    },
    countryCodeValidadtor: (value, helper) => {
        var countryCodeRegex = /^(\+?\d{1,3}|\d{1,4})$/gm;
                if (!value.match(countryCodeRegex)) {
                    return helper.message("Invalid Country Code")
                } 
                    return value;
    },
    mobileNumValidator: (value, helper) => {
        var mobileNumberRegex = /^[a-zA-Z0-9\-().\s]{10,15}$/gm;
                if (!value.match(mobileNumberRegex)) {
                    return helper.message("Invalid Mobile Number")
                } 
                    return value;
    },
    objectIDValidator:(value, helper) => {
        if(!objectID.isValid(value)){
            return helper.message("Invalid ObjectID")
        }
        return value;
    },
    //pagination: require('./pagination'),
    upload: require("./uploadFile").upload,
    pagingData: require("./pagination"),
    uploadExcel: require("./uploadFile").uploadExcel,
    uploadVideo: require("./uploadFile").uploadVideo,
    uploadReports: require("./uploadFile").uploadReports,
    uploadImage: require("./uploadFile").uploadImage,
    downloadExcel: require("./downloadExcel"),
}