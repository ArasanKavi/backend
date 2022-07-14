const mongoose = require("mongoose");
const uploadBranchReportSchema = require("../schemas").uploadBranchReport;

module.exports = mongoose.model("uploadBranchReport", uploadBranchReportSchema);