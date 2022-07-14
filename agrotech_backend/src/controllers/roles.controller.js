'use strict'
const { rolesService } = require('../services/index');
const { response } = require('../middleware');
const { messages, statusCodes } = require('../configs');
const { generateAccessToken } = require('../utils');
const { ThirdPartyServices } = require('../externalServices');
const utils = require("../utils");
const falseValues = [undefined, 'undefined', null, 'null'];
class RolesController { }
RolesController.addPermission = async (req, res, next) => {
    try {
        let result = await rolesService.addPermission(req.body)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
RolesController.editPermission = async (req, res, next) => {
    try {
        let id = req.query.id
        let result = await rolesService.editPermission(req.body, id)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
RolesController.getPermission = async (req, res, next) => {
    try {
        let result = await rolesService.getPermission(req)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
RolesController.addRole = async (req, res, next) => {
    try {
        let result = await rolesService.addRole(req.body)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
RolesController.getRole = async (req, res, next) => {
    try {
        let search = req.query.name || "ALL"
       // console.log("1", search)
        let limit = req.query.limit ? parseInt(req.query.limit) : 10
        let page = req.query.page ? parseInt(req.query.page) : 1
        let result = await rolesService.getRole(search,limit,page)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
RolesController.getRolebyId = async (req, res, next) => {
    try {
        let result = await rolesService.getRolebyId(req.query.id);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
RolesController.updateRole = async (req, res, next) => {
    try {
        let id = req.params.id;
        let result = await rolesService.updateRole(req.body, id);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
RolesController.deleteRole = async (req, res, next) => {
    try {
        let result = await rolesService.deleteRole(req.query.id);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
RolesController.addRoleType = async (req, res, next) => {
    try {
        let result = await rolesService.addRoleType(req.body)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
RolesController.getRoleType = async (req, res, next) => {
    try {
        let search = req.query.name || "ALL"
        //let  = req.query.corporateName || "ALL"
        console.log("1", search)
        let result = await rolesService.getRoleType(search)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
RolesController.getRoleTypeById = async (req, res, next) => {
    try {
        let result = await rolesService.getRoleTypeById(req.query.id);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
RolesController.updateRoleType = async (req, res, next) => {
    try {
        let id = req.params.id;
        let result = await rolesService.updateRoleType(req.body, id);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
RolesController.deleteRoleType = async (req, res, next) => {
    try {
        let result = await rolesService.deleteRoleType(req.query.id);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
module.exports = RolesController;