const mongoose = require("mongoose");
const bulkReportSchema = require("../schemas").bulkUploadReport;

module.exports = mongoose.model("bulkReport", bulkReportSchema);