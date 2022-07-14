const mongoose = require("mongoose");
const Schema = mongoose.Schema;

module.exports = new Schema({

  emailId: {
    type: String,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },

  gender: {
    type: String,
    trim: true
  },
  dob: {
    type: String,
    trim: true
  },

  profilePic: {
    type: String,
    trim: true
  },

  status: {
    type: Number,
    trim: true
  },
  password: {
    type: String,
    trim: true
  },
  otp: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    index: true
  },
  termsAndCondition: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    default: "PENDING"
  },
  address: {
    type: String,
    trim: true
  },
  spouseName: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  mobileNumber: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  village: {
    type: String,
    trim: true
  },
  zone: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  loanReferenceNumber: {
    type: String,
    trim: true
  },
  khataDetails: {
    type: String,
    trim: true
  },
  kccAccountNumber: {
    type: String,
    trim: true
  },
  landArea: {
    type: String,
    trim: true
  },
  mortageDetails: {
    type:String,
    trim: true
  },
  surveyNo: {
    type:String,
    trim: true
  },
  branchCode: {
    type:String
  }
}, {
  timestamps: true
});
