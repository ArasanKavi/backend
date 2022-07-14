const mongoose = require("mongoose");
const Schema = mongoose.Schema;

module.exports = new Schema(
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
      }
    },
    {
        timestamps: true
    }
);