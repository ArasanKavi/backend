const { verifyToken, verifySession } = require("../../middleware");
const { verifyUserToken } = require('../../hooks');

const express = require("express");
const rolesRoutes = express.Router();

let validator = require('express-joi-validation').createValidator({
    passError: true
});

module.exports = rolesRoutes;