const mongoose = require("mongoose");
const Schema = mongoose.Schema;

module.exports = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        seq: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true
    }
);