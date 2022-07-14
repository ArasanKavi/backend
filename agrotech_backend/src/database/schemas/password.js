const mongoose = require("mongoose");
const Schema = mongoose.Schema;

module.exports = new Schema(
  {
    userId: {
      type: String
    },
    password: {
      type: String
    }
  },
  {
    timestamps: true
  }
);