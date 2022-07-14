const mongoose = require("mongoose");
const Schema = mongoose.Schema;

module.exports = new Schema({
    state:{
        type: String,
        trim: true  
    },
    district:{
        type: String,
        trim: true
    },
    mandal:{
        type: String,
        trim: true
    },
    village:{
        type: String,
        trim: true
    },
    cadastralNo:{
        type: String,
        trim:  true
    },
    villaCad:{
        type: String,
        trim: true
    },
    cropType:{
        type: String,
        trim: true
    },
    cropName:{
        type: String,
        trim: true
    },
    tentativeSowing:{
        type: String,
        trim: true
    },
    tentativeHarvesting:{
        type: String,
        trim: true
    },
    cropHealth:{
        type: String,
        trim: true
    },
    estimatedYield:{
        type: String,
        trim: true
    },
    lastSatelliteInspection:{
        type: String,
        trim: true
    }
}, {
    timestamps:  true
});