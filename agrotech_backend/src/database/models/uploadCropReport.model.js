const mongoose = require("mongoose");
const uploadCropReportSchema = require("../schemas").uploadCropReport;

module.exports = mongoose.model("uploadCropReport", uploadCropReportSchema);