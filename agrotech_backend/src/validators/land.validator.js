const Joi = require('joi');
const { response } = require("../middleware/index");

const schemas = {

    createLand: Joi.object().keys({
        surveyNo: Joi.string().trim().required().messages({
            'any.required': `Survey Number is required`
        }),
        districtName: Joi.string().trim().required().messages({
            'any.required': `District Name is required`
        }),
        villageName: Joi.string().trim().required().messages({
            'any.required': `Village Name is required`
        }),
        zoneName: Joi.string().trim().required().messages({
            'any.required': `Zone Name is required`
        }),
        areaUnits: Joi.string().trim().required().messages({
            'any.required': `Area Units is required`
        }),
        nonCultivableArea: Joi.string().trim().required().messages({
            'any.required': `Non Cultivable Area is required`
        }),
        cultivableArea: Joi.string().trim().required().messages({
            'any.required': `Cultivable Area is required`
        }),
        natureOfEarth: Joi.string().trim().required().messages({
            'any.required': `Nature Of Earth is required`
        }),
        discipline: Joi.string().trim().required().messages({
            'any.required': `Discipline is required`
        }),
        landDescription: Joi.string().trim().required().messages({
            'any.required': `Land Description is required`
        }),
        reservoir: Joi.string().trim().required().messages({
            'any.required': `Reservoir is required`
        }),
        strategicArea: Joi.string().trim().required().messages({
            'any.required': `Strategic Area is required`
        }),
        accountNumber: Joi.string().trim().required().messages({
            'any.required': `Account Number is required`
        }),
        graduateName: Joi.string().trim().required().messages({
            'any.required': `Graduate Name is required`
        }),
        fatherHusbandSpouseName: Joi.string().trim().required().messages({
            'any.required': `Father Husband Spouse Name is required`
        }),
        experienceArea: Joi.string().trim().required().messages({
            'any.required': `Experience Area is required`
        }),
        natureOfExperience: Joi.string().trim().required().messages({
            'any.required': `Nature Of Experience is required`
        }),
        landType: Joi.string().trim().required().messages({
            'any.required': `Land Type is required`
        }),
        documentNumber: Joi.string().trim().required().messages({
            'any.required': `Document Number is required`
        }),
        landRate: Joi.string().trim().required().messages({
            'any.required': `Land Rate is required`
        })
    }),

    editLand: Joi.object().keys({
        surveyNo: Joi.string().trim().optional(),
        districtName: Joi.string().trim().optional(),
        villageName: Joi.string().trim().optional(),
        zoneName: Joi.string().trim().optional(),
        areaUnits: Joi.string().trim().optional(),
        nonCultivableArea: Joi.string().trim().optional(),
        cultivableArea: Joi.string().trim().optional(),
        natureOfEarth: Joi.string().trim().optional(),
        discipline: Joi.string().trim().optional(),
        landDescription: Joi.string().trim().optional(),
        reservoir: Joi.string().trim().optional(),
        strategicArea: Joi.string().trim().optional(),
        accountNumber: Joi.string().trim().optional(),
        graduateName: Joi.string().trim().optional(),
        fatherHusbandSpouseName: Joi.string().trim().optional(),
        experienceArea: Joi.string().trim().optional(),
        natureOfExperience: Joi.string().trim().optional(),
        landType: Joi.string().trim().optional(),
        documentNumber: Joi.string().trim().optional(),
        landRate: Joi.string().trim().optional()
    }),

    deleteLand: Joi.object().keys({
        id: Joi.string().trim().required()
    }),

    getLand: Joi.object().keys({
        search: Joi.string().trim().optional().allow('')
    }),

    getLandById: Joi.object().keys({
        id: Joi.string().trim().required()
    }),

    getCount: Joi.object().keys({
        districtName: Joi.string().trim().required()
    }),

};

const options = {
    // generic option
    basic: {
        abortEarly: true,
        convert: true,
        allowUnknown: false,
        stripUnknown: true
    },
    // Options for Array of array
    array: {
        abortEarly: true,
        convert: true,
        allowUnknown: true,
        stripUnknown: {
            objects: true
        }
    }
};

module.exports = {
    createLand: (req, res, next) => {
        try {
            let schema = schemas.createLand;
            let option = options.basic;

            let {
                error,
                value
            } = schema.validate(req.body, option);

            if (error) {
                return response.joierrors(req, res, error)
            } else {
                next()
            }

        } catch (error) {
            console.log("error", error);
        }
    },

    editLand: (req, res, next) => {
        try {
            let schema = schemas.editLand;
            let option = options.basic;

            let {
                error,
                value
            } = schema.validate(req.body, option);

            if (error) {
                return response.joierrors(req, res, error)
            } else {
                next()
            }

        } catch (error) {
            console.log("error", error);
        }
    },

    deleteLand: (req, res, next) => {
        try {
            let schema = schemas.deleteLand;
            let option = options.basic;

            let {
                error,
                value
            } = schema.validate(req.query, option);

            if (error) {
                return response.joierrors(req, res, error)
            } else {
                next()
            }

        } catch (error) {
            console.log("error", error);
        }
    },

    getLand: (req, res, next) => {
        try {
            let schema = schemas.getLand;
            let option = options.basic;

            let {
                error,
                value
            } = schema.validate(req.query, option);

            if (error) {
                return response.joierrors(req, res, error)
            } else {
                next()
            }

        } catch (error) {
            console.log("error", error);
        }
    },

    getLandById: (req, res, next) => {
        try {
            let schema = schemas.getLandById;
            let option = options.basic;

            let {
                error,
                value
            } = schema.validate(req.query, option);

            if (error) {
                return response.joierrors(req, res, error)
            } else {
                next()
            }

        } catch (error) {
            console.log("error", error);
        }
    },

    getCount: (req, res, next) => {
        try {
            let schema = schemas.getCount;
            let option = options.basic;

            let {
                error,
                value
            } = schema.validate(req.query, option);

            if (error) {
                return response.joierrors(req, res, error)
            } else {
                next()
            }

        } catch (error) {
            console.log("error", error);
        }
    },

};