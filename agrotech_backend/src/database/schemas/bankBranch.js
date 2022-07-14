const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// module.exports = new Schema(
//     {
    const bankBranchSchema = new Schema({
        AO: {
            type: String,
            trim: true
        },
        RBO: {
            type: String,
            trim: true
        },
        branchCode: {
            type: String,
            trim: true
        },
        branchName: {
            type: String,
            trim: true
        },
        district: {
            type: String,
            trim: true
        },
        numberOfApplications: {
            type: String,
            trim: true
        },
        applicationStats: {
            type: Array,
            trim: true
        },
        isBulkUpload:{
            type:Boolean,
            default:false
        },
        bulkUploadId:{
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = bankBranchSchema;