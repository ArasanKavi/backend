const mongoose = require("mongoose");
const Schema = mongoose.Schema;

module.exports = new Schema({
    surveyNo:{
        type: String,
        trim: true  
    },
    districtName:{
        type: String,
        trim: true
    },
    villageName:{
        type: String,
        trim: true
    },
    zoneName:{
        type: String,
        trim: true
    },
    areaUnits:{
        type: String,
        trim:  true
    },
    nonCultivableArea:{
        type: String,
        trim: true
    },
    cultivableArea:{
        type: String,
        trim: true
    },
    natureOfEarth:{
        type: String,
        trim: true
    },
    discipline:{
        type: String,
        trim: true
    },
    landDescription:{
        type: String,
        trim: true
    },
    reservoir:{
        type: String,
        trim: true
    },
    strategicArea:{
        type: String,
        trim: true
    },
    accountNumber:{
        type: String,
        trim: true
    },
    graduateName:{
        type: String,
        trim: true
    },
    spouseName:{
        type: String,
        trim: true
    },
    experienceArea:{
        type: String,
        trim: true
    },
    natureOfExperience:{
        type: String,
        trim: true
    },
    landType:{
        type: String,
        trim: true
    },
    documentNumber:{
        type: String,
        trim: true
    },
    landRate:{
        type: String,
        trim: true
    },
}, {
    timestamps:  true
});