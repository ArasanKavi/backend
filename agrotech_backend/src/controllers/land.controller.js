'use strict'
const { landService } = require('../services');
const { landRecords } = require('../database/models');
const { response } = require('../middleware');
const { messages, statusCodes, headerMapping } = require('../configs');
const { generateAccessToken } = require('../utils');
const { DATA_STATUS } = require('../constants');
const fs = require('fs');
const path = require('path')
const xml2js = require('xml2js');
const excelJs = require("exceljs");
const excelToJson = require("convert-excel-to-json");
const moment = require('moment-timezone');
const { ThirdPartyServices } = require('../externalServices');
const { LAND_DETAIL_SHEET_NAME } = process.env;
const utils = require("../utils");
const falseValues = [undefined, 'undefined', null, 'null'];
class LandController { }
LandController.createLand = async (req, res, next) => {
    try {
        let result = await landService.createLand(req.body)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
LandController.editLand = async (req, res, next) => {
    try {
        let id = req.query.id
        let result = await landService.editLand(req.body, id);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
LandController.deleteLand = async (req, res, next) => {
    try {
        let result = await landService.deleteLand(req.query.id);
        // console.log(result)
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
LandController.getLand = async (req, res, next) => {
    try {
        let limit = req.query.limit ? parseInt(req.query.limit) : 10;
        let page = req.query.page ? parseInt(req.query.page) : 1;
        let result = await landService.getLand(req.query, limit, page);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
LandController.getLandById = async (req, res, next) => {
    try {
        let result = await landService.getLandById(req.query.id);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
LandController.excelToJson = async (req, res, next) => {
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
            let excelWorkBook = new excelJs.Workbook();
            let excelSheet = await excelWorkBook.xlsx.readFile(doc_url);
            if(!file.filename.includes(LAND_DETAIL_SHEET_NAME)) {
                return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, `Invalid file, Please upload the file ${LAND_DETAIL_SHEET_NAME}`);
            }
            const excelData = excelToJson({
                sourceFile: doc_url,
                sheets: [
                    {
                        name: LAND_DETAIL_SHEET_NAME,
                        header: {
                            rows: 1
                        },
                        columnToKey: headerMapping
                    }
                ]
            });
            console.log("The following is the excelData", excelData);
            if(excelData.landDetails.length==0){
                return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, `Excel File Is Empty`);
            }
            req.body.landDetails = excelData.landDetails;
            console.log("After excel to JSON", req.body.landDetails.length);
            let i = 2;
            req.body.landDetails = req.body.landDetails.map((item) => {
                // item.status = DATA_STATUS.ACTIVE;
                i++;
                console.log("The following is the item", item);
                return item;
            });
            console.log("After processing the files", req.body.landDetails.length);
            next();
        }
    } catch (err) {
        console.log("err==", err);
        next(err);
    }
}
LandController.bulkCreateUpdateLands = async (req, res, next) => {
    try {
        let { landDetails } = req.body;
        console.log("The following is the landDetails", landDetails);
        let result = await landService.bulkCreateUpdateLands(landDetails);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
LandController.getCount = async (req, res, next) => {
    try {
        let result = await landService.getCount(req.query.districtName);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
LandController.createBulkLandRecord = async (req, res, next) => {
    try {
        if (!req.body.length) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, "No data found");
        }
        let result = await landService.createBulkLandRecord(req.body);
        if (!result.data) {
            result.data = req.body;
        }
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (error) {
        console.log(error);
        next(error);
    }
}
LandController.download = async (req, res, next) => {
    try {
        let query = req.query;
        let obj = {};
        let land;
        if (query.search) {
            obj.$or = [{
                surveyNo: {
                    $regex: query.search,
                    $options: 'i'
                }
            }, {
                plotNo: {
                    $regex: query.search,
                    $options: 'i'
                }
            },
            {
                graduateName: {
                    $regex: query.search,
                    $options: 'i'
                }
            },
            {
                districtName: {
                    $regex: query.search,
                    $options: 'i'
                }
            },
            {
                villageName: {
                    $regex: query.search,
                    $options: 'i'
                }
            },
            {
                zoneName: {
                    $regex: query.search,
                    $options: 'i'
                }
            },
            {
                accountNumber: {
                    $regex: query.search,
                    $options: 'i'
                }
            },
            {
                documentNumber: {
                    $regex: query.search,
                    $options: 'i'
                }
            },
            {
                landType: {
                    $regex: query.search,
                    $options: 'i'
                }
            }
            ]
        }
        if (query.villageName) {
            obj['villageName'] = query.villageName
        }
        if (query.zoneName) {
            obj['zoneName'] = query.zoneName
        }
        if (query.districtName) {
            obj['districtName'] = query.districtName
        }

        if (query.startDate && query.endDate) {
            let endDate1 = new Date(query.endDate);
            endDate1.setDate(endDate1.getDate() + 1);
            obj.createdAt = { $gte: new Date(query.startDate), $lte: endDate1 };
        } else if (query.startDate && !query.endDate) {
            obj.createdAt = { $gte: new Date(query.startDate) }
        } else if (!query.startDate && query.endDate) {
            let endDate1 = new Date(query.endDate)
            endDate1.setDate(endDate1.getDate() + 1);
            obj.createdAt = { $lte: endDate1 }
        }

        if (query.sort && query.sort !== "All") {
            obj.landType = {
                $regex: query.sort,
                $options: 'i'
            }
        }
        
        land = await landRecords.find(obj).sort({
            'createdAt': -1
        });
        if (!land) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, "No data found");
        }
        let workbook = new excelJs.Workbook();
        let worksheet = workbook.addWorksheet("Sheet1");

        worksheet.columns = [
            { header: "Survey No", key: "surveyNo", width: 15 },
            { header: "District Name", key: "districtName", width: 25 },
            { header: "Village Name", key: "villageName", width: 25 },
            { header: "Zone Name", key: "zoneName", width: 25 },
            { header: "Area Units", key: "areaUnits", width: 25 },
            { header: "Non Cultivable Area", key: "nonCultivableArea", width: 25 },
            { header: "Cultivable Area", key: "cultivableArea", width: 25 },
            { header: "Nature Of Earth", key: "natureOfEarth", width: 25 },
            { header: "Discipline", key: "discipline", width: 25 },
            { header: "Land Description", key: "landDescription", width: 25 },
            { header: "Reservoir", key: "reservoir", width: 25 },
            { header: "Strategic Area", key: "strategicArea", width: 25 },
            { header: "Account Number", key: "accountNumber", width: 25 },
            { header: "Graduate Name", key: "graduateName", width: 25 },
            { header: "Father Husband Spouse Name", key: "fatherHusbandSpouseName", width: 25 },
            { header: "Experience Area", key: "experienceArea", width: 25 },
            { header: "Nature Of Experience", key: "natureOfExperience", width: 25 },
            { header: "Land Type", key: "landType", width: 25 },
            { header: "Document Number", key: "documentNumber", width: 25 },
            { header: "Land Rate", key: "landRate", width: 25 },
            { header: "Land Id", key: "landId", width: 25 }
        ];
        worksheet.addRows(land);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "land_records.xlsx"
        );
        await workbook.xlsx.write(res);
        res.status(statusCodes.HTTP_OK).end();
    } catch (err) {
        console.log(err);
        next(err);
    }
}
module.exports = LandController;