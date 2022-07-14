'use strict'
const { branchService } = require('../services');
const { response } = require('../middleware');
const { messages, statusCodes, branchHeaderMapping } = require('../configs');
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
const { BRANCH_DATA_SHEET } = process.env;
const utils = require("../utils");
const falseValues = [undefined, 'undefined', null, 'null'];
class BranchController { }
BranchController.createBranch = async (req, res, next) => {
    try {
        let result = await branchService.createBranch(req.body)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
BranchController.editBranch = async (req, res, next) => {
    try {
        let id = req.query.id
        let result = await branchService.editBranch(req.body, id);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
BranchController.deleteBranch = async (req, res, next) => {
    try {
        let result = await branchService.deleteBranch(req.query.id);
        // console.log(result)
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
BranchController.getBranch = async (req, res, next) => {
    try {
    
        let limit = req.query.limit ? parseInt(req.query.limit) : 10
        let page = req.query.page ? parseInt(req.query.page) : 1
        let result = await branchService.getBranch(req.query, limit, page);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
BranchController.getBranchById = async (req, res, next) => {
    try {
        let result = await branchService.getBranchById(req.query.id);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
BranchController.getBranchByBranchCode = async (req, res, next) => {
    try {
        let branchCode =req.user.branchCode
        let result = await branchService.getBranchByBranchCode(branchCode);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
BranchController.getBranchByCode = async (req, res, next) => {
    try {
        let result = await branchService.getBranchByCode(req.query.branchCode);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

BranchController.getDistrict = async (req, res, next) => {
    try {
        let result = await branchService.getDistrict(req.query);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
BranchController.getBranchCode = async (req, res, next) => {
    try {
        let result = await branchService.getBranchCode(req.query);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};

BranchController.getBranchCount = async (req, res, next) => {
    try {
        let query = {
            ...req.query
        }
        let result = await branchService.getBranchCount(query);
        if(!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
BranchController.getApplicationCountByDistrict = async (req, res, next) => {
    try {
        let query = {
            ...req.query
        }
        console.log("Hi",query)
        let result = await branchService.getApplicationCountByDistrict(query);
        if(!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

BranchController.createBulkBranch = async (req, res, next) => {
    try {
        let {branchDetails}=req.body
        let allowedData=[],allowedDataCount=0,errorData=[],errorDataCount=0,result
        if(branchDetails.length){
            for(let branch of branchDetails){
                let check = await branchService.getBranchByCode(branch.branchCode.toString())
                if(check.status==false){
                    allowedData.push(branch)
                    allowedDataCount++

                }else{
                    errorData.push(branch)
                    errorDataCount++
                }
            }
            result = await branchService.createBulkBranch(allowedData,errorData,allowedDataCount,errorDataCount);
        }
        console.log("final",result)
        if (result.status==false) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST,result?.data, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
BranchController.excelToJson = async (req, res, next) => {
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
            //console.log("11",doc_url)
            let excelWorkBook = new excelJs.Workbook();
            let excelSheet = await excelWorkBook.xlsx.readFile(doc_url);
            if(!file.filename.includes(BRANCH_DATA_SHEET)) {
                return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, `Invalid file, Please upload the file ${BRANCH_DATA_SHEET}`);
               
            }
            console.log("122")
            const excelData = excelToJson({
                sourceFile: doc_url,
                sheets: [
                    {
                        name: BRANCH_DATA_SHEET,
                        header: {
                            rows: 1
                        },
                        columnToKey: branchHeaderMapping
                    }
                ]
            });
            console.log("The following is the excelData", excelData);
            if(excelData.branchDetails.length==0){
                return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, `Excel File Is Empty`);
            }
            req.body.branchDetails = excelData.branchDetails;
            console.log("After excel to JSON", req.body.branchDetails.length);
            let i = 2;
            req.body.branchDetails = req.body.branchDetails.map((item) => {
                // item.status = DATA_STATUS.ACTIVE;
                i++;
                console.log("The following is the item", item);
                return item;
            });
            console.log("After processing the files", req.body.branchDetails.length);
            next();
        }
    } catch (err) {
        console.log("err==", err);
        next(err);
    }
}
module.exports = BranchController;