const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let neighbourhoodSchema = new Schema({
    neighbourPlots: {
        type: String,
        trim: true
    },
    khasraNumberDetails: {
        type: String,
        trim: true
    },
    totalAreaAcres: {
        type: String,
        trim: true
    },
    ownerName: {
        type: String,
        trim: true
    },
    fatherHusbandName: {
        type: String,
        trim: true
    },
    village: {
        type: String,
        trim: true
    },
    mortgageDetails: {
        type: String,
        trim: true
    },
    landRevenue: {
        type: String,
        trim: true
    }
})

module.exports = new Schema({
    applicationId: {
      type: Schema.Types.ObjectId,
      trim: true
    },
    farmerName: {
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
    cifAccountNumber: {
      type: String,
      trim: true
    },
    branchName: {
      type: String,
      trim: true
    },
    landDetails: {
      type: String,
      trim: true
    },
    spouseName: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    mobileNumber: {
      type: String,
      trim: true
    },
    district: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    subDistrict: {
      type: String,
      trim: true
    },
    zone: {
      type: String,
      trim: true
    },
    village: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    khasraNumber: {
      type: String,
      trim: true
    },
    khataDetails: {
      type: String,
      trim: true
    },
    plotNo: {
      type: String,
      trim: true
    },
    surveyNo: {
      type: String,
      trim: true
    },
    totalLandArea: {
      type: String,
      trim: true
    },
    landAreaOfFarmer: {
      type: String,
      trim: true
    },
    bankBranchCode: {
      type: String,
      trim: true
    },
    allApplicationData: {
      type: Array
    },
    loanReferenceNumber: {
      type: String,
      trim: true
    },
    kccAccountNumber: {
      type: String,
      trim: true
    },
    gender: {
      type: String,
      trim: true
    },
    mortageDetails: {
      type: String,
      trim: true
    },
    neighbourPlotDetails: {
        type: [neighbourhoodSchema]
    },
    reportImageUrl:{
      type:Array
      
    },
    spouseNameValidation: {
        type: Boolean,
        default: false
    }
})