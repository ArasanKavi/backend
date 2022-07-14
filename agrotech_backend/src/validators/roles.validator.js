const Joi = require('joi');
const { response } = require("../middleware/index");

const schemas = {

    addPermission: Joi.object().keys({
        name: Joi.string().trim().required()
    }),

    editPermission: Joi.object().keys({
        name: Joi.string().trim().required()
    }),

    addRoleType: Joi.object().keys({
        roleType: Joi.string().trim().required(),
        description: Joi.string().trim().optional()
    }),

    updateRoleType: Joi.object().keys({
        roleType: Joi.string().trim().optional(),
        description: Joi.string().trim().optional()
    }),

    getRoleTypeById: Joi.object().keys({
        id: Joi.string().trim().required()
    }),

    addRole: Joi.object().keys({
        roleName: Joi.string().trim().required(),
        roleTypeId: Joi.string().trim().optional(),
        description: Joi.string().trim().optional(),
        permissions: Joi.array().required(),
    }),

    updateRole: Joi.object().keys({
        roleName: Joi.string().trim().optional(),
        roleTypeId: Joi.string().trim().optional(),
        description: Joi.string().trim().optional(),
        permissions: Joi.array()
    }),

    getRolebyId: Joi.object().keys({
        id: Joi.string().trim().required()
    }),

    deleteRole: Joi.object().keys({
        id: Joi.string().trim().required()
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
    addPermission: (req, res, next) => {
        try {
            let schema = schemas.addPermission;
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

    editPermission: (req, res, next) => {
        try {
            let schema = schemas.editPermission;
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

    addRoleType: (req, res, next) => {
        try {
            let schema = schemas.addRoleType;
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

    updateRoleType: (req, res, next) => {
        try {
            let schema = schemas.updateRoleType;
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

    getRoleTypeById: (req, res, next) => {
        try {
            let schema = schemas.getRoleTypeById;
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

    addRole: (req, res, next) => {
        try {
            let schema = schemas.addRole;
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

    updateRole: (req, res, next) => {
        try {
            let schema = schemas.updateRole;
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

    getRolebyId: (req, res, next) => {
        try {
            let schema = schemas.getRolebyId;
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

    deleteRole: (req, res, next) => {
        try {
            let schema = schemas.deleteRole;
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