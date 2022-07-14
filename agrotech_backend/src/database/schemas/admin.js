const mongoose = require("mongoose");
const Schema = mongoose.Schema;

module.exports = new Schema({
  name: {
    type: String,
    trim: true
  },
  emailId: {
    type: String,
    trim: true
  },
  mobileNumber: {
    type: String,
    trim: true
  },
  roleId: {
    type: String,
    trim: true
  },
  role:{
    type: String,
    trim:true
  },
  password: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: "PENDING"
  },
  otp: {
    type: String,
    trim: true
  },
  branchCode: {
    type: String,
    trim: true
  },
  lastLogin: {
    type:String,
    trim:true
  },
  sessionLogin: {
    type:Boolean,
    default:false
  }
}, {
  timestamps: true
});