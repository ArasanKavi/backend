'use strict'
const { cropService } = require('../services');
const { crop } = require('../database/models');
const { response } = require('../middleware');
const { messages, statusCodes, cropHeaderMapping } = require('../configs');
const { generateAccessToken } = require('../utils');
const { DATA_STATUS } = require('../constants');
const fs = require('fs');
const path = require('path')
const xml2js = require('xml2js');
const excelJs = require("exceljs");
const excelToJson = require("convert-excel-to-json");
const moment = require('moment-timezone');
const { ThirdPartyServices } = require('../externalServices');
const { CROP_DATA_SHEET } = process.env;
const utils = require("../utils");
const falseValues = [undefined, 'undefined', null, 'null'];
class CropController { }
CropController.createCrop = async (req, res, next) => {
    try {
        let result = await cropService.createCrop(req.body)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
CropController.editCrop = async (req, res, next) => {
    try {
        let id = req.query.id
        let result = await cropService.editCrop(req.body, id);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
CropController.deleteCrop = async (req, res, next) => {
    try {
        let result = await cropService.deleteCrop(req.query.id);
        // console.log(result)
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
CropController.getCrop = async (req, res, next) => {
    try {
        let limit = req.query.limit ? parseInt(req.query.limit) : 10;
        let page = req.query.page ? parseInt(req.query.page) : 1;
        console.log("check0",limit,page)
        let result = await cropService.getCrop(req.query, limit, page);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
CropController.getCropById = async (req, res, next) => {
    try {
        let result = await cropService.getCropById(req.query.id);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
CropController.excelToJson = async (req, res, next) => {
    try {
        const file = req.file;
        console.log("The following is the fileName", file);
        if (file) {
            console.log("The following is the dirname", __dirname);
            console.log("The following is the filename", file.filename);
            let doc_url = path.join(
                __dirname,
                `../../public/uploads/${file.filename}`
            );
           // console.log("11",doc_url)
            let excelWorkBook = new excelJs.Workbook();
            let excelSheet = await excelWorkBook.xlsx.readFile(doc_url);
            if(!file.filename.includes(CROP_DATA_SHEET)) {
                return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST,`Invalid file, Please upload the file ${CROP_DATA_SHEET}`); 
            
            }
            const excelData = excelToJson({
                sourceFile: doc_url,
                sheets: [
                    {
                        name: CROP_DATA_SHEET,
                        header: {
                            rows: 1
                        },
                        columnToKey: cropHeaderMapping
                    }
                ]
            });
            console.log("The following is the excelData", excelData);
            if(excelData.cropData.length==0){
                return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, `Excel File Is Empty`);
            }
            req.body.cropDetails = excelData.cropData;
            console.log("After excel to JSON", req.body.cropDetails.length);
            let i = 2;
            req.body.cropDetails = req.body.cropDetails.map((item) => {
                // item.status = DATA_STATUS.ACTIVE;
                i++;
                console.log("The following is the item", item);
                return item;
            });
            console.log("After processing the files", req.body.cropDetails.length);
            next();
        }
    } catch (err) {
        console.log("err==", err);
        next(err);
    }
}
CropController.bulkCreateUpdateCrop = async (req, res, next) => {
    try {
         let { cropDetails } = req.body;
         let result
         let allowedData=[],errorData=[],allowedDataCount=0,errorDataCount=0
         console.log("The following is the cropDetails", cropDetails);
         if(cropDetails.length){
           for(let crop of cropDetails){
               console.log("cad",crop.cadastralNo.toString())
               let checking = await cropService.getCropByCadastralNo(crop.cadastralNo.toString())
               console.log(checking)
               if(checking.status==false){
                allowedData.push(crop)
                allowedDataCount++
               }else{
                   errorData.push(crop)
                   errorDataCount++
               }   
           }
            console.log("checkingCondition",errorData,allowedData)
             result = await cropService.bulkCreateUpdateCrop(allowedData,errorData,allowedDataCount,errorDataCount);
          }
        
         if (result.status==false) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST,result?.data, result?.message);
         return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
CropController.getCropNameCount = async (req, res, next) => {
    try {
        let result = await cropService.getCropNameCount(req);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
CropController.getCount = async (req, res, next) => {
    try {
        let result = await cropService.getCount(req.query.districtName);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
CropController.createBulkCropRecord = async (req, res, next) => {
    try {
        if (!req.body.length) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, "No data found");
        }
        let result = await cropService.bulkCreateUpdateCrop(req.body);
        if (!result.data) {
            result.data = req.body;
        }
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (error) {
        console.log(error);
        next(error);
    }
}
CropController.download = async (req, res, next) => {
    try {
        let query = req.query;
        console.log(query)
        let obj = {};
        let land;
        if (query.search) {
            obj.$or = [
                {
                    cropType: {
                        $regex: query.search,
                        $options: 'i'
                    }
                }, {
                    cadastralNo: {
                        $regex: query.search,
                        $options: 'i'
                    }
                },
                {
                    cropName: {
                        $regex: query.search,
                        $options: 'i'
                    }
                },
                {
                    district: {
                        $regex: query.search,
                        $options: 'i'
                    }
                },
                {
                    village: {
                        $regex: query.search,
                        $options: 'i'
                    }
                },
                {
                    zone: {
                        $regex: query.search,
                        $options: 'i'
                    }
                },
                {
                    state: {
                        $regex: query.search,
                        $options: 'i'
                    }
                },
                {
                    villaCad: {
                        $regex: query.search,
                        $options: 'i'
                    }
                }
            ]
        }
        
        
        land = await crop.find(obj).sort({
            'createdAt': -1
        });
        if (!land) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, "No data found");
        }
        let workbook = new excelJs.Workbook();
        let worksheet = workbook.addWorksheet("Sheet1");

        worksheet.columns = [
            { header: "State", key: "state", width: 15 },
            { header: "District Name", key: "district", width: 25 },
            { header: "Mandal Name", key: "mandal", width: 25 },
            { header: "Village Name", key: "village", width: 25 },
            { header: "Cadastral Number", key: "cadastralNo", width: 30 },
            { header: "Villa Cad", key: "villaCad", width: 25 },
            { header: "Crop Type", key: "cropType", width: 25 },
            { header: "Crop Name", key: "cropName", width: 25 },
            { header: "Tentative Sowing", key: "tentativeSowing", width: 25 },
            { header: "Tentative Harvesting", key: "tentativeHarvesting", width: 25 },
            { header: "Reservoir", key: "reservoir", width: 25 },
            { header: "Crop Health", key: "cropHealth", width: 25 },
            { header: "Estimated Yield", key: "estimatedYield", width: 25 },
            { header: "Last Satellite Inspection", key: "lastSatelliteInspection", width: 50 }
        ];
        worksheet.addRows(land);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "crop_records.xlsx"
        );
        await workbook.xlsx.write(res);
        res.status(statusCodes.HTTP_OK).end();
    } catch (err) {
        console.log(err);
        next(err);
    }
}
module.exports = CropController;