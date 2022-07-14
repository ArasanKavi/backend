const { verifyToken, verifySession } = require("../../middleware");
const { branchController } = require("../../controllers/index");
const { verifyUserToken } = require('../../hooks');

const express = require("express");
const branchRoutes = express.Router();
const { upload, uploadExcel } = require("../../utils");

let validator = require('express-joi-validation').createValidator({
    passError: true
});

const {
    createBranch,
    editBranch
} = require('../../validators/user.validator');

branchRoutes.post('/createBranch',createBranch, branchController.createBranch);
branchRoutes.put('/editBranch',editBranch, branchController.editBranch);
branchRoutes.delete('/deleteBranch', branchController.deleteBranch);
branchRoutes.get('/getBranch', branchController.getBranch);
branchRoutes.get('/getBranchById', branchController.getBranchById);
branchRoutes.get('/getBranchByBranchCode',verifyUserToken, branchController.getBranchByBranchCode);
branchRoutes.get('/getBranchByCode', branchController.getBranchByCode);
branchRoutes.get('/getDistrict', branchController.getDistrict);
branchRoutes.get('/getBranchCode', branchController.getBranchCode);
branchRoutes.get('/getBranchCount', branchController.getBranchCount);
branchRoutes.post('/createBulkBranch',uploadExcel.single("file"),branchController.excelToJson, branchController.createBulkBranch);
//branchRoutes.post('/createBulkBranch', branchController.createBulkBranch);
branchRoutes.get('/getApplicationCountByDistrict', branchController.getApplicationCountByDistrict);

module.exports = branchRoutes;