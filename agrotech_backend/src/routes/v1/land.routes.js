const { verifyToken, verifySession } = require("../../middleware");
const { landController } = require("../../controllers/index");
const { verifyUserToken } = require('../../hooks');

const express = require("express");
const landRoutes = express.Router();
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

landRoutes.post('/createLand', createLand, landController.createLand);
landRoutes.put('/editLand', editLand, landController.editLand);
landRoutes.delete('/deleteLand', deleteLand, landController.deleteLand);
landRoutes.get('/getLand', getLand, landController.getLand);
landRoutes.get('/getLandById', getLandById, landController.getLandById);
landRoutes.post('/bulk', uploadExcel.single("file"), landController.excelToJson, landController.bulkCreateUpdateLands)
landRoutes.get('/getCount', getCount, landController.getCount);
landRoutes.post('/createBulkLandRecord', landController.createBulkLandRecord);
landRoutes.get('/download', landController.download);

module.exports = landRoutes;