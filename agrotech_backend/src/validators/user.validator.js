const Joi = require('joi');
const {
    response
} = require("../middleware/index");

const schemas = {

    signUp: Joi.object().keys({
        firstName: Joi.string().trim().required()
            .messages({
                'any.required': `First Name is required`
                // "string.min": "First Name should be greater than or equal to 3 characters long",
                // "string.max": "First Name should be less than or equal to 15 characters long"
            }),
        lastName: Joi.string().trim().required()
            .messages({
                'any.required': `Last Name is required`
            }),
        emailId: Joi.string().email({
            minDomainSegments: 2,
            tlds: {
                allow: ["com", "net", "co", "in"]
            },
        })
            .required(),
        setPassword: Joi.string().trim().regex(
            new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})")
        )
            .required()
            .messages({
                "string.pattern.base": "Password must match atleast one camelcase, number, symbol",
            }),
        confirmPassword: Joi.string().trim().required(),
        branchCode: Joi.string().trim().optional().allow(""),
        mobileNumber: Joi.string().trim().optional()
    }),
    adminSignUp: Joi.object().keys({
        name: Joi.string().trim().required()
            .messages({
                'any.required': `Name is required`
            }),
        roleId: Joi.string().trim().required()
        .messages({
            'any.required': `Role ID is required`
        }),
        emailId: Joi.string().email({
            minDomainSegments: 2,
            tlds: {
                allow: ["com", "net", "co", "in"]
            },
        }).required()
        .messages({
            'any.required': `Email ID is required`
        }),
        branchCode: Joi.string().trim().optional(),
        mobileNumber: Joi.string().length(10).pattern(/^[0-9]+$/).required()
        .messages({
            'any.required': `Mobile number is required`
        }),
        status: Joi.string().trim().required()
    }),
    adminUpdate: Joi.object().keys({
        name: Joi.string().trim().optional(),
        roleId: Joi.string().trim().optional(),
        emailId: Joi.string().email({
            minDomainSegments: 2,
            tlds: {
                allow: ["com", "net", "co", "in"]
            },
        }).optional(),
        branchCode: Joi.string().trim().optional(),
        mobileNumber: Joi.string().length(10).pattern(/^[0-9]+$/).optional(),
        status: Joi.string().trim().optional()
    }),
    signIn: Joi.object().keys({
        emailId: Joi.string().email({
            minDomainSegments: 2,
            tlds: {
                allow: ["com", "net", "co", "in"]
            },
        }).optional(),
        branchCode: Joi.string().trim().optional(),
        password: Joi.string().trim().required(),
    }),

    forgetPassword: Joi.object().keys({
        emailId: Joi.string().email({
            minDomainSegments: 2,
            tlds: {
                allow: ["com", "net", "co", "in"]
            },
        }).required()
    }),

    verifyOtp: Joi.object().keys({
        emailId: Joi.string().email({
            minDomainSegments: 2,
            tlds: {
                allow: ["com", "net", "co", "in"]
            },
        }).required(),
        otp: Joi.string().trim().required(),
    }),

    resetPassword: Joi.object().keys({
        newPassword: Joi.string().trim().regex(
            new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})")
        ).required()
        .messages({
            "string.pattern.base": "newPassword must match atleast one camelcase, number, symbol",
        }),
        confirmPassword: Joi.string().trim().required()
        
    }),

    editprofile: Joi.object().keys({
        firstName: Joi.string().trim().optional(),
        lastName: Joi.string().trim().optional(),
        mobileNumber: Joi.string().length(10).pattern(/^[0-9]+$/).optional(),
        accountnumber: Joi.string().trim().optional(),
        emailId: Joi.string().trim().optional(),
        spouseName: Joi.string().trim().optional(),
        address: Joi.string().trim().optional(),
        branchCode: Joi.string().trim().optional(),

    }),

    changePassword: Joi.object().keys({
        oldPassword: Joi.string().trim().regex(
            new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})")
        ).required()
        .messages({
            "string.pattern.base": "Password must match atleast one camelcase, number, symbol",
        }),
        newPassword: Joi.string().trim().regex(
            new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})")
        ).required()
        .messages({
            "string.pattern.base": "Password must match atleast one camelcase, number, symbol",
        }),
        confirmPassword: Joi.string().trim().required()
    }),

    completeForm: Joi.object().keys({
        surveyNo: Joi.string().trim().required()
        .messages({
            'any.required': `Survey Number is required`
        }),
        spouseName: Joi.string().trim().optional(),
        address: Joi.string().trim().required()
        .messages({
            'any.required': `Address is required`
        }),
        mobileNumber: Joi.string().length(10).pattern(/^[0-9]+$/).optional(),
        accountNumber: Joi.string().trim().required()
        .messages({
            'any.required': `Account Number is required`
        }),
        firstName: Joi.string().trim().required()
        .messages({
            'any.required': `First Name is required`
        }),
        lastName: Joi.string().trim().required()
        .messages({
            'any.required': `Last Name is required`
        }),
        loanReferenceNumber: Joi.string().trim().required()
        .messages({
            'any.required': ` Loan Reference Number is required`
        }),
        kccAccountNumber: Joi.string().trim().optional(),
        khataDetails: Joi.string().trim().optional(),
        mortageDetails: Joi.string().trim().optional(),
        landArea: Joi.string().trim().optional(),
        village: Joi.string().trim().required()
        .messages({
            'any.required': `Village is required`
        }),
        district: Joi.string().trim().required()
        .messages({
            'any.required': `District is required`
        }),
        zone: Joi.string().trim().required()
        .messages({
            'any.required': `Zone is required`
        }),
        state: Joi.string().trim().required()
        .messages({
            'any.required': `State  is required`
        }),
        gender: Joi.string().trim().optional().allow(""),
        pincode: Joi.string().length(6).pattern(/^[0-9]+$/).required()
        .messages({
            'any.required': `Pincode is required`
        }),

    }),
    updateForm: Joi.object().keys({
        surveyNo: Joi.string().trim().optional(),
        spouseName: Joi.string().trim().optional(),
        address: Joi.string().trim().optional(),
        mobileNumber: Joi.string().length(10).pattern(/^[0-9]+$/).optional(),
        accountNumber: Joi.string().trim().optional(),
        firstName: Joi.string().trim().optional(),
        lastName: Joi.string().trim().optional(),
        loanReferenceNumber: Joi.string().trim().optional(),
        kccAccountNumber: Joi.string().trim().optional(),
        khataDetails: Joi.string().trim().optional(),
        mortageDetails: Joi.string().trim().optional(),
        landArea: Joi.string().trim().optional(),
        village: Joi.string().trim().optional(),
        district: Joi.string().trim().optional(),
        zone: Joi.string().trim().optional(),
        state: Joi.string().trim().optional(),
        gender: Joi.string().trim().optional().allow(""),
        pincode: Joi.string().length(6).pattern(/^[0-9]+$/).optional(),

    }),
    getAllUsers: Joi.object().keys({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        search: Joi.string().trim().optional().allow(''),
        status: Joi.string().trim().optional()
    }),

    getUserById: Joi.object().keys({
        id: Joi.string().trim().required(),
    }),

    updateUserDetails: Joi.object().keys({
        id: Joi.string().trim().required(),
    }),

    createCustomer: Joi.object().keys({
        firstName: Joi.string().trim().required()
            .messages({
                'any.required': `First Name is required`
            }),
        lastName: Joi.string().trim().required()
            .messages({
                'any.required': `Last Name is required`
            }),
        emailId: Joi.string().email({
            minDomainSegments: 2,
            tlds: {
                allow: ["com", "net", "co", "in"]
            },
        }).required()
    }),
    createBranch: Joi.object().keys({
        branchName: Joi.string().trim().required()
        .messages({
            'any.required': `Branch Name is required`,
            'string.empty':`Branch Name is not allowed to be empty`
        }),
        branchCode: Joi.string().trim().required()
        .messages({
            'any.required': `Branch Code is required`,
            'string.empty':`Branch Code is not allowed to be empty`
        }),
        district: Joi.string().trim().required()
        .messages({
            'any.required': `District is required`,
            'string.empty':`District is not allowed to be empty`
        }),
        AO: Joi.string().required(),
        RBO: Joi.string().trim().required(),
        numberOfApplications: Joi.string().trim().required()
        .messages({
            'any.required': `Number of Application is required`,
            'string.empty':`Number of Application is not allowed to be empty`
        })
    }),
    editBranch: Joi.object().keys({
        branchName: Joi.string().trim().optional(),
        branchCode: Joi.string().trim().optional(),
        district: Joi.string().trim().optional(),
        AO: Joi.string().optional(),
        RBO: Joi.string().trim().optional(),
        numberOfApplications: Joi.string().trim().optional()
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
    signUp: (req, res, next) => {
        try {
            let schema = schemas.signUp;
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
    createCustomer: (req, res, next) => {
        try {
            let schema = schemas.createCustomer;
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
    adminSignUp: (req, res, next) => {
        try {
            let schema = schemas.adminSignUp;
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
    adminUpdate: (req, res, next) => {
        try {
            let schema = schemas.adminUpdate;
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

    signIn: (req, res, next) => {
        try {
            let schema = schemas.signIn;
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

    forgetPassword: (req, res, next) => {
        try {
            let schema = schemas.forgetPassword;
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

    verifyOtp: (req, res, next) => {
        try {
            let schema = schemas.verifyOtp;
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

    resetPassword: (req, res, next) => {
        try {
            let schema = schemas.resetPassword;
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

    editprofile: (req, res, next) => {
        try {
            let schema = schemas.editprofile;
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

    changePassword: (req, res, next) => {
        try {
            let schema = schemas.changePassword;
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

    completeForm: (req, res, next) => {
        try {
            let schema = schemas.completeForm;
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

    updateForm: (req, res, next) => {
        try {
            let schema = schemas.updateForm;
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
    createBranch: (req, res, next) => {
        try {
            let schema = schemas.createBranch;
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
    editBranch: (req, res, next) => {
        try {
            let schema = schemas.editBranch;
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

    getAllUsers: (req, res, next) => {
        try {
            let schema = schemas.getAllUsers;
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

    getUserById: (req, res, next) => {
        try {
            let schema = schemas.getUserById;
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

    updateUserDetails: (req, res, next) => {
        try {
            let schema = schemas.updateUserDetails;
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
};