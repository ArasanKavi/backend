const mongoose = require("mongoose");
const bankBranchSchema = require("../schemas").bankBranch;

module.exports = mongoose.model("bankBranch", bankBranchSchema);