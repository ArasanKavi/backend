const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const rejectApplicationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "admin",
  },
  applicationId: {
    type: Schema.Types.ObjectId,
    ref: "application",
  },
  userName: {
    type: String,
    trim: true,
  },
  roleName: {
    type: String,
    trim: true
  },
  reason:{
    type:Array
  },
  comment: {
    type: String,
    trim: true
  },
}, {
  timestamps: true
});

const applicationCommentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "admin",
  },
  applicationId: {
    type: Schema.Types.ObjectId,
    ref: "application",
  },
  userName: {
    type: String,
    trim: true,
  },
  roleName: {
    type: String,
    trim: true
  },
  reason: {
    type: String,
    trim: true, 
  },
  comment: {
    type: String,
    trim: true
  },
  commentResolutionDate: {
    type: String,
    trim: true
  }
});

const reportApprovalVersionSchema = new Schema({
  applicationId: {
    type: Schema.Types.ObjectId,
    ref: "application",
  },
  reportGeneratedOn: {
    type: String,
    trim: true,
  },
  commentReceivedOn: {
    type: String,
    trim: true,
  },
  commentResolutionDoneDate: {
    type: String,
    trim: true,
  },
  finalReportGenerated: {
    type: Boolean,
    trim: true,
  }
})

const applicationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user"
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
    type: String,
    trim: true
  },
  surveyNo: {
    type: String,
    trim: true
  },
  plotNo: {
    type: String,
    trim: true
  },
  applicationId: {
    type: String,
    trim: true,
    unique: true
  },
  applicationProcessDate: {
    type: String,
    trim: true
  },
  bankBranchId: {
    type: Schema.Types.ObjectId,
    ref: "bankBranch"
  },
  bankBranchCode: {
    type: String,
    trim: true
  },
  areaUnits: {
    type: String,
    trim: true
  },
  nonCultivableArea: {
    type: String,
    trim: true
  },
  cultivableArea: {
    type: String,
    trim: true
  },
  natureOfEarth: {
    type: String,
    trim: true
  },
  discipline: {
    type: String,
    trim: true
  },
  landDescription: {
    type: String,
    trim: true
  },
  reservoir: {
    type: String,
    trim: true
  },
  strategicArea: {
    type: String,
    trim: true
  },
  experienceArea: {
    type: String,
    trim: true
  },
  natureOfExperience: {
    type: String,
    trim: true
  },
  landType: {
    type: String,
    trim: true
  },
  landRate: {
    type: String,
    trim: true
  },
  documentNumber: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: "PENDING"
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  applicationComment: [applicationCommentSchema],
  reportApprovalStatus: {
    type: String,
    default: "PENDING"
  },
  rejectApplication: [rejectApplicationSchema],
  applicationApprovedDate: {
    type: String,
    trim: true
  },
  applicationReportApprovedDate: {
    type: String,
    trim: true
  },
  applicationRejectedDate: {
    type: String,
    trim: true
  },
  applicationReApprovedDate: {
    type: String,
    trim: true
  },
  count: {
    type: Number,
    trim: true
  },
  isBulkUpload: {
    type: Boolean,
    default: false
  },
  bulkUploadId: {
    type: String,
    trim: true
  },
  reportGeneratedDate: {
    type: String,
    trim: true
  },
  reportApprovalVersion: [reportApprovalVersionSchema],
  applicationEditData : {
    type: Array,
    trim: true
  },
  applicationEditDate: {
    type: String,
    trim: true
  },
  flagApplication: {
    type: Boolean,
    default: false
  },
  isNewComment: {
    type: Boolean,
    default: false
  },
  isReportCreated: {
    type: Boolean,
    default: false
  },
  isCommentResolved: {
    type: Boolean
  }
}, {
  timestamps: true,
  toObject: { getters: true },
  toJSON: { virtuals: true, getters: true }
});

applicationSchema.plugin(mongooseLeanVirtuals);

applicationSchema.virtual("generatedReportUrl").get(function () {
  if(this.accountNumber && this.bankBranchCode){
    return `https://pre-prod-agrotech.s3.amazonaws.com/reports/${this.accountNumber}_${this.bankBranchCode}.pdf`;
  }
  return null;
})

module.exports = applicationSchema;