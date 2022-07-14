const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const bulkUploadReportSchema = new Schema(
    {
      createdApplication: {
        type: Array,
        trim: true
      },
      createdApplicationCount: {
        type: String,
        trim: true
      },
      updatedApplication: {
        type: Array,
        trim: true
      },
      updatedApplicationCount: {
        type: String,
        trim: true
      },
      notUpdatedApplication: {
        type: Array,
        trim: true
      },
      notUpdatedApplicationCount: {
        type: String,
        trim: true
      },
      bulkUploadId: {
        type: String,
        trim: true
      },
      fileName: {
        type: String,
        trim: true
      },
      branchCode:{
        type:String,
        trim:true
      }

    },
    {
        timestamps: true
    },{
      timestamps: true,
      toObject: { getters: true },
      toJSON: { virtuals: true, getters: true }
});
bulkUploadReportSchema.plugin(mongooseLeanVirtuals);

bulkUploadReportSchema.virtual("generatedUploadReportUrl").get(function () {
  if(this.bulkUploadId){
    return `https://pre-prod-agrotech.s3.amazonaws.com/kccApplication/${this.bulkUploadId}.xlsx`;
  }
  return null;
})

module.exports = bulkUploadReportSchema;