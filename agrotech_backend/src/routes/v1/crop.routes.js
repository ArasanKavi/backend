const { verifyToken, verifySession } = require("../../middleware");
const { cropController } = require("../../controllers/index");
const { verifyUserToken } = require('../../hooks');

const express = require("express");
const cropRoutes = express.Router();
const { upload, uploadExcel } = require("../../utils");

let validator = require('express-joi-validation').createValidator({
    passError: true
});

const {
    createLand,
    editLand,
    deleteLand,
    getLand,
    getLandById,
    getCount
} = require('../../validators/land.validator');

cropRoutes.post('/createCrop',  cropController.createCrop);
cropRoutes.put('/editCrop',  cropController.editCrop);
cropRoutes.delete('/deleteCrop', cropController.deleteCrop);
cropRoutes.get('/getCrop', cropController.getCrop);
cropRoutes.get('/getCropById', cropController.getCropById);
cropRoutes.post('/bulk',uploadExcel.single("file"),cropController.excelToJson, cropController.bulkCreateUpdateCrop)
cropRoutes.get('/getCount', cropController.getCount);
cropRoutes.get('/getCropNameCount', cropController.getCropNameCount);
//cropRoutes.post('/createBulkCropRecord', cropController.createBulkCropRecord);
cropRoutes.get('/download', cropController.download);

module.exports = cropRoutes;