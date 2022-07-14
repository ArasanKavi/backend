'use strict'
const { applicationService } = require('../services');
const { addRole, application, bankBranch, agrotechApplication,counter, bulkUploadReport } = require('../database/models');
const { response } = require('../middleware');
const { messages, statusCodes, landHeaderMapping } = require('../configs');
const { generateAccessToken } = require('../utils');
const { USER_STATUS } = require('../constants');
const fs = require('fs');
const path = require('path')
const xml2js = require('xml2js');
const excelJs = require("exceljs");
const excelToJson = require("convert-excel-to-json");
const s3 = require('s3-client');
const AWS = require('aws-sdk');
const {
    DATA_STATUS,
    SEARCH_TYPE,
    SEARCH_HEADERS
} = require("../constants");
const moment = require('moment-timezone');
const { ThirdPartyServices } = require('../externalServices');
const { APPLICATION_DATA_SHEET } = process.env;
const utils = require("../utils");
const falseValues = [undefined, 'undefined', null, 'null'];
async function getBulkUploadId() {
    let applicationId = '';
    let counterObj = await counter.findOne({
        name: "BULK-APPLICATION"
    });
    if (!counterObj) {
        let newCounter = new counter({
            name: "BULK-APPLICATION",
            seq: 2
        });
        applicationId = "BULK01";
        await newCounter.save();
    }
    applicationId = counterObj.seq < 10 ? `BULK0${counterObj.seq}` : `BULK${counterObj.seq}`;
    counterObj.seq = counterObj.seq + 1;
    await counterObj.save();
    return applicationId;
}
class ApplicationController { }
ApplicationController.createApplication = async (req, res, next) => {
    try {
        let body = req.body
        let Gender
        if (body.gender == "1") {
            Gender = "male"
        }
        if (body.gender == "2") {
            Gender = "female"
        }
        if (body.gender == "3") {
            Gender = "others"
        }
        if(body.gender!='1'&&body.gender!='2'&&body.gender!='3'){
            Gender =body.gender
        }
        body.gender = Gender
        console.log(body)
        let result = await applicationService.createApplication(body)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.editApplication = async (req, res, next) => {
    try {
        let id = req.query.id
        let body = req.body
        let Gender
        if (body.gender == "1") {
            Gender = "male"
        }
        if (body.gender == "2") {
            Gender = "female"
        }
        if (body.gender == "3") {
            Gender = "others"
        }
        if(body.gender!='1'&&body.gender!='2'&&body.gender!='3'){
            Gender =body.gender
        }
        body.gender = Gender
        console.log(body)
        let result = await applicationService.editApplication(body, id);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.deleteApplication = async (req, res, next) => {
    try {
        let result = await applicationService.deleteApplication(req.query.id);
        // console.log(result)
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.deleteApplicationByBulkUploadId = async (req, res, next) => {
    try {
        let result = await applicationService.deleteApplicationByBulkUploadId(req.query.bulkUploadId);
        // console.log(result)
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.getAllApplications = async (req, res, next) => {
    try {
        if(req.user.branchCode){
            req.query.branchCode=req.user.branchCode
        }
        let limit = req.query.limit ? parseInt(req.query.limit) : 10
        let page = req.query.page ? parseInt(req.query.page) : 1
        if(req.query.headerType=="7"){
            req.query.search=1
        }
        console.log("111", page, limit,req.query)
        let result = await applicationService.getAllApplications(req.query, limit, page);
        if (result.status==false) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.getApplicationById = async (req, res, next) => {
    try {
        let result = await applicationService.getApplicationById(req.query.id);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.getApplicationCommentById = async (req, res, next) => {
    try {
        let result = await applicationService.getApplicationCommentById(req.query.id);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.getApplicationRejectCommentById = async (req, res, next) => {
    try {
        let result = await applicationService.getApplicationRejectCommentById(req.query.id);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.getApplicationByBranchCode = async (req, res, next) => {
    try {
        let status = req.query.status || "PENDING"
        let result = await applicationService.getApplicationByBranchCode(req.query.branchCode, status);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.approveStatus = async (req, res, next) => {
    try {
        //let id = req.query.id;
        let status;
        if (req.body.status == "1") {
            status = USER_STATUS.APPROVED
        } else if (req.body.status == "2") {
            status = USER_STATUS.REJECTED
        } else {
            status = req.body.status
        }

        let result = await applicationService.approveStatus(req.body, status)
        if (!result) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);

        } else {
            return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
        }

    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.bulkApproveApplications = async (req, res, next) => {
    try {
        if(req.user.branchCode){
            req.body.branchCode=req.user.branchCode
        }
        let status;
        if (req.body.status == "1") {
            status = USER_STATUS.APPROVED
        } else if (req.body.status == "2") {
            status = USER_STATUS.REJECTED
        } else {
            status = req.body.status
        }

        let result = await applicationService.bulkApproveApplications(req.body, status)
        
        if (result.status==false) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        } else {
            return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
        }

    } catch (err) {
        console.log(err);
        next(err);
    }
};

ApplicationController.getApplicationStatusCount = async (req, res, next) => {
    try {
        let user = req.user.roleId
        let branchCode=req.user.branchCode
        let result = await applicationService.getApplicationStatusCount(branchCode,user);
        if (!result?.data) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        } else {
            return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.getApplicationReportStatusCount = async (req, res, next) => {
    try {
        let user = req.user.roleId
        let branchCode=req.user.branchCode
        let result = await applicationService.getApplicationReportStatusCount(branchCode,user);
        if (!result?.data) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        } else {
            return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.getApplicationCommentsCount = async (req, res, next) => {
    try {
        let user = req.user.roleId
        let branchCode=req.user.branchCode
        let result = await applicationService.getApplicationCommentsCount(branchCode,user);
        if (!result?.data) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        } else {
            return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.commentApplication = async (req, res, next) => {
    try {
        let id = req.query.id
        let roleId = req.user.roleId
        let role= await addRole.findOne({roleId:roleId},{roleName:1})
        let body = req.body
        body.userId = req.user.id
        body.userName = req.user.name
        body.roleName=role.roleName
        body.applicationId=id
        console.log(body)
        let result = await applicationService.commentApplication(body,id)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.commentApplicationDelete = async (req, res, next) => {
    try {
        let id = req.query.id
        let result = await applicationService.commentApplicationDelete(req.body,id)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.rejectCommentApplication = async (req, res, next) => {
    try {
        //let id = req.query.id
        let roleId = req.user.roleId
        let role= await addRole.findOne({roleId:roleId},{roleName:1})
        let body = req.body
        body.userId = req.user.id
        body.userName = req.user.name
        body.roleName=role.roleName
       // body.applicationId=id
        console.log(body)
        let result = await applicationService.rejectCommentApplication(req.body)
        if (result.status==false) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.rejectCommentApplicationBulk = async (req, res, next) => {
    try {
        let body = req.body
        if(req.user.branchCode){
            body.branchCode
        }
        let roleId = req.user.roleId
        let role= await addRole.findOne({roleId:roleId},{roleName:1})
        body.userId = req.user.id
        body.userName = req.user.name
        body.roleName=role.roleName
        console.log(body)
        let result = await applicationService.rejectCommentApplicationBulk(req.body)
        if (result.status==false) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.download = async (req, res, next) => {
    try {
        let query=req.query
        let applicationDetail;
            if (query.searchType == SEARCH_TYPE.NORMAL) {
                console.log("Inside loop 1", query);
                let queryObj = {};
                if (query.search) {
                    queryObj.$or = [{
                            surveyNo: {
                                $regex: query.search,
                                $options: 'i'
                            }
                        },
                        {
                            firstName: {
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
                            accountNumber: {
                                $regex: query.search,
                                $options: 'i'
                            }
                        },
                        {
                            loanReferenceNumber: {
                                $regex: query.search,
                                $options: 'i'
                            }
                        },
                        {
                            bankBranchCode: {
                                $regex: query.search,
                                $options: 'i'
                            }
                        }
                    ]
                }
                if (query.status && query.status != "ALL") {
                    queryObj.status = {
                        $regex: query.status,
                        $options: 'i'
                    }
                }
                if (query.branchCode) {
                    queryObj.bankBranchCode = {
                        $regex: query.branchCode,
                        $options: 'i'
                    }
                }
                if (query.startDate && query.endDate) {
                    let endDate = new Date(query.endDate)
                    endDate.setDate(endDate.getDate() + 1);
                    queryObj.createdAt = {
                        $gte: new Date(query.startDate),
                        $lte: endDate
                    };
                } else if (query.startDate && !query.endDate) {
                    queryObj.createdAt = {
                        $gte: new Date(query.startDate)
                    }
                } else if (!query.startDate && query.endDate) {
                    let endDate = new Date(query.endDate)
                    endDate.setDate(endDate.getDate() + 1);
                    queryObj.createdAt = {
                        $lte: endDate
                    }
                }
                let sort
                if (query.loanReferenceNumber) {
                    sort = {
                        loanReferenceNumber: query.loanReferenceNumber
                    }
                }
                if (query.kccAccountNumber) {
                    sort = {
                        kccAccountNumber: query.kccAccountNumber
                    }
                }
                if (query.bankBranchCode) {
                    sort = {
                        bankBranchCode: query.bankBranchCode
                    }
                }
                if (query.surveyNo) {
                    sort = {
                        surveyNo: query.surveyNo
                    }
                }
                if (query.village) {
                    sort = {
                        village: query.village
                    }
                }
                if (query.zone) {
                    sort = {
                        zone: query.zone
                    }
                }
                if (query.district) {
                    sort = {
                        district: query.district
                    }
                }
                if (query.firstName) {
                    sort = {
                        firstName: query.firstName
                    }
                }
                if (query.lastName) {
                    sort = {
                        lastName: query.lastName
                    }
                }
                if (query.accountNumber) {
                    sort = {
                        accountNumber: query.accountNumber
                    }
                }
                console.log("Check", queryObj, sort)
                if (sort) {
                    console.log("!", sort)
                    applicationDetail = await application.find(queryObj)
                        .sort(sort);
                    if (!applicationDetail) {
                        return {
                            status: false,
                            message: "Application not found."
                        }
                    }
                } else {
                    console.log("!!")
                    applicationDetail = await application.find(queryObj)
                        .sort({
                            'createdAt': -1
                        });
                    if (!applicationDetail) {
                        return {
                            status: false,
                            message: "Application not found."
                        }
                    }
                }
            } else if (query.searchType == SEARCH_TYPE.DROPDOWN) {
                console.log("Inside loop 1", query);
                let queryObj = {};
                if (query.search) {
                    if(!query.headerType){
                        return{
                            status:false,
                            message:"Please Enter headerType"
                        }
                    }else{
                    queryObj.$or = [];
                    if(query.headerType == SEARCH_HEADERS.BANK_BRANCH_CODE){
                        queryObj.$or.push({
                            bankBranchCode: {
                                $regex: query.search,
                                $options: 'i'
                            }
                        })
                    } else if(query.headerType == SEARCH_HEADERS.CIF_ACCOUNT_NUMBER){
                        queryObj.$or.push({
                            accountNumber: {
                                $regex: query.search,
                                $options: 'i'
                            }
                        })
                    } else if(query.headerType == SEARCH_HEADERS.SURVEY_NUMBER){
                        queryObj.$or.push({
                            surveyNo: {
                                $regex: query.search,
                                $options: 'i'
                            }
                        })
                    } else if(query.headerType == SEARCH_HEADERS.VILLAGE_NAME){
                        queryObj.$or.push({
                            village: {
                                $regex: query.search,
                                $options: 'i'
                            }
                        })
                    } else if(query.headerType == SEARCH_HEADERS.MANDAL_NAME){
                        queryObj.$or.push({
                            zone: {
                                $regex: query.search,
                                $options: 'i'
                            } 
                        })
                    } else if(query.headerType == SEARCH_HEADERS.DISTRICT_NAME){
                        queryObj.$or.push({
                            district: {
                                $regex: query.search,
                                $options: 'i'
                            }
                        })
                    } else if(query.headerType == SEARCH_HEADERS.KCC_ACCOUNT_NUMBER){
                        queryObj.$or.push({
                            kccAccountNumber: {
                                $regex: query.search,
                                $options: 'i'
                            }
                        })
                    }
                }
                }
                if (query.status && query.status != "ALL") {
                    queryObj.status = {
                        $regex: query.status,
                        $options: 'i'
                    }
                }
                if (query.branchCode) {
                    queryObj.bankBranchCode = {
                        $regex: query.branchCode,
                        $options: 'i'
                    }
                }
                if (query.startDate && query.endDate) {
                    let endDate = new Date(query.endDate)
                    endDate.setDate(endDate.getDate() + 1);
                    queryObj.createdAt = {
                        $gte: new Date(query.startDate),
                        $lte: endDate
                    };
                } else if (query.startDate && !query.endDate) {
                    queryObj.createdAt = {
                        $gte: new Date(query.startDate)
                    }
                } else if (!query.startDate && query.endDate) {
                    let endDate = new Date(query.endDate)
                    endDate.setDate(endDate.getDate() + 1);
                    queryObj.createdAt = {
                        $lte: endDate
                    }
                }
                let sort
                if (query.loanReferenceNumber) {
                    sort = {
                        loanReferenceNumber: query.loanReferenceNumber
                    }
                }
                if (query.bankBranchCode) {
                    sort = {
                        bankBranchCode: query.bankBranchCode
                    }
                }
                if (query.kccAccountNumber) {
                    sort = {
                        kccAccountNumber: query.kccAccountNumber
                    }
                }
                if (query.surveyNo) {
                    sort = {
                        surveyNo: query.surveyNo
                    }
                }
                if (query.village) {
                    sort = {
                        village: query.village
                    }
                }
                if (query.zone) {
                    sort = {
                        zone: query.zone
                    }
                }
                if (query.district) {
                    sort = {
                        district: query.district
                    }
                }
                if (query.firstName) {
                    sort = {
                        firstName: query.firstName
                    }
                }
                if (query.lastName) {
                    sort = {
                        lastName: query.lastName
                    }
                }
                if (query.accountNumber) {
                    sort = {
                        accountNumber: query.accountNumber
                    }
                }
                console.log("check", queryObj, sort)
                if (sort) {
                    console.log("!", sort)
                    applicationDetail = await application.find(queryObj)
                        .sort(sort);

                    if (!applicationDetail) {
                        return {
                            status: false,
                            message: "Application not found."
                        }
                    }
                
                } else {
                    console.log("!!")
                    
                    applicationDetail = await application.find(queryObj)
                        .sort({
                            'createdAt': -1
                        });

                    if (!applicationDetail) {
                        return {
                            status: false,
                            message: "Application not found."
                        }
                    }
                }
            }
            console.log("finaaaal",applicationDetail)
        
            let workbook = new excelJs.Workbook();
            let worksheet = workbook.addWorksheet("Sheet1");

            worksheet.columns = [
                { header: "Survey No", key: "surveyNo", width: 35 },
                { header: "LoanReference No", key: "loanReferenceNumber", width: 25 },
                { header: "Account No", key: "accountNumber", width: 15 },
                { header: "Application Id", key: "applicationId", width: 15 },
                { header: "Status", key: "status", width: 15 },
                { header: "First Name", key: "firstName", width: 25 },
                { header: "Last Name", key: "lastName", width: 25 },
                { header: "Father Husband Spouse Name", key: "spouseName", width: 35 },
                { header: "Village Name", key: "village", width: 25 },
                { header: "Mandal Name", key: "zone", width: 20 },
                { header: "District Name", key: "district", width: 25 },
                { header: "State Name", key: "state", width: 20 },
                { header: "Pincode", key: "pincode", width: 10 },
                { header: "Mobile No", key: "mobileNumber", width: 15 },
                { header: "Gender", key: "gender", width: 10 },
                { header: "BranchCode", key: "bankBranchCode", width: 15 },
                { header: "KccAccount Number", key: "kccAccountNumber", width: 25 },
                { header: "Khata Details", key: "khataDetails", width: 25 },
                { header: "Mortage Details", key: "mortageDetails", width: 25 },
                { header: "Application Date", key: "createdAt", width: 25 },
                { header: "Application Approved Date", key: "applicationApprovedDate", width: 25 },
                { header: "Report Generated Date", key: "reportGeneratedDate", width: 25 },
                { header: "Report Approved Date", key: "applicationReportApprovedDate", width: 25 },
                { header: "Application Rejected Date", key: "applicationRejectedDate", width: 25 },
                { header: "Bulk Upload", key: "isBulkUpload", width: 15 },
                { header: "Plot No", key: "plotNo", width: 15 },
            ];
            worksheet.addRows(applicationDetail);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            
                if(query.startDate && query.endDate){
                    res.setHeader(
                        "Content-Disposition",
                        "attachment; filename=" + "kcc_application_"+query.startDate+"_"+query.endDate+".xlsx"
                    );
                }
                else if(query.branchCode) {
                    res.setHeader(
                        "Content-Disposition",
                        "attachment; filename=" + "kcc_application_"+ query.branchCode+".xlsx"
                    );
                } else {
                    res.setHeader(
                        "Content-Disposition",
                        "attachment; filename=" + "kcc_application_"+ query.status+".xlsx"
                    );
                }
            await workbook.xlsx.write(res);
        res.status(statusCodes.HTTP_OK).end();
    } catch (err) {
        console.log(err);
        next(err);
    }
}

ApplicationController.excelToJson = async (req, res, next) => {
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
            console.log("hh",doc_url)
            //s3
        const fileContent = fs.readFileSync(doc_url);
        let newFileDestination = "kccApplication/";
        let bulkUploadId = await getBulkUploadId();
        let uniqueSuffix = bulkUploadId + ".xlsx";
        //let uniqueSuffix = reportData.cifAccountNumber + "_" + reportData.bankBranchCode + ".excel";
        let uniqueFileName = newFileDestination + uniqueSuffix;
        const s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });
        const params = {
            Bucket: 'pre-prod-agrotech',
            Key: uniqueFileName,
            Body: fileContent
        }

        const s3UploadData = new Promise((resolve, reject) => {
            s3.upload(params, (err, data) => {
                if (err) {
                    throw err;
                }
                console.log(`File uploaded successfully. ${data.Location}`);
                resolve(data.Location);
            });
        });
        let filePathS3Data = await s3UploadData;
        console.log("s333",filePathS3Data)


        //APPLICATION_DATA_SHEET
        console.log(`${APPLICATION_DATA_SHEET}.xlsx`)
            let excelWorkBook = new excelJs.Workbook();
            let excelSheet = await excelWorkBook.xlsx.readFile(doc_url);
            // if (!file.filename.includes(APPLICATION_DATA_SHEET)) {
            //     return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, `Invalid file, Please upload the file ${APPLICATION_DATA_SHEET}`);
               
            // }
            const excelData = excelToJson({
                sourceFile: doc_url,
                sheets: [
                    {
                        name: APPLICATION_DATA_SHEET,
                        header: {
                            rows: 1
                        },
                        columnToKey: landHeaderMapping
                    }
                ]
            });
            console.log("The following is the excelData", excelData);
            if(excelData.applicationDetails.length==0){
                return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, `Excel File Is Empty`);
            }
            req.body.landDetails = excelData.applicationDetails;
            console.log("After excel to JSON", req.body.landDetails.length);
            let i = 2;
            req.body.landDetails = req.body.landDetails.map((item) => {
                item.status = "PENDING";
                i++;
                console.log("The following is the item", item);
                return item;
            });
            req.body.fileName = file.filename
            req.body.bulkUploadId= bulkUploadId
            console.log("After processing the files", req.body.landDetails.length);
            next();
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
}
ApplicationController.bulkApplicationUpload = async (req, res, next) => {
    try {
        let BranchCode
        if(req.user.branchCode){
            BranchCode = req.user.branchCode
        }
        console.log("search", req.body);
        let { landDetails } = req.body;
        let { fileName,bulkUploadId } = req.body
      
        console.log("The following is the application details", landDetails);
        let result = await applicationService.bulkApplicationUpload(landDetails,BranchCode,fileName,bulkUploadId);
        console.log("The following is the result", result);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        if(result.message.includes("Invalid") || result.message.includes("already exists")){
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.data, result?.message);
        }
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

ApplicationController.uploadCustomReport = async (req, res, next) => {
    try {
        let files = req.files
        console.log(req.files)
        if(!files){
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST,"File are empty");
        }
        return response.success(req, res, statusCodes.HTTP_OK,files, "pdf upload successfully");
        
    } catch (err) {
        console.log(err);
        next(err);
    }
}
ApplicationController.uploadReportImage = async (req, res, next) => {
    try {
        let files = req.files
        console.log(req.files)
        if(!files){
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST,"File are empty");
        }
        return response.success(req, res, statusCodes.HTTP_OK,files, "Image Upload Successfully");
        
    } catch (err) {
        console.log(err);
        next(err);
    }
}

ApplicationController.getBulkUploadReport = async (req, res, next) => {
    try {
        let bulkUploadId = req.query.bulkUploadId;
        let result = await applicationService.getBulkUploadReport(bulkUploadId);
        if(!result){
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        }
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

ApplicationController.getAllBulkUploads = async (req, res, next) => {
    try {
        let branchCode
        if(req.user.branchCode){
            branchCode= req.user.branchCode
        }
        let limit = req.query.limit ? parseInt(req.query.limit) : 10;
        let page = req.query.page ? parseInt(req.query.page) : 1;
        let result = await applicationService.getAllBulkUploads(limit,page,branchCode);
        if(!result){
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        }
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
ApplicationController.report = async (req, res, next) => {
    try {
        
        let result = await applicationService.report()
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.getStateDistrict = async (req, res, next) => {
    try {
        let pinCode = req.query.pinCode
        let result = await applicationService.getStateDistrict(pinCode);
        if(!result){
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        }
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

ApplicationController.getAllAgrotechApplications = async (req, res, next) => {
    try {
        if(req.user.branchCode){
            req.query.branchCode=req.user.branchCode
        }
        let limit = req.query.limit ? parseInt(req.query.limit) : 10
        let page = req.query.page ? parseInt(req.query.page) : 1
        console.log("111", page, limit)
        let result = await applicationService.getAllAgrotechApplications(req.query, limit, page);
        if (result.status==false) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

ApplicationController.agrotechApplicationsDownload = async (req, res, next) => {
    try {       
        let data = await agrotechApplication.find();
        //
        let workbook = new excelJs.Workbook();
        let worksheet = workbook.addWorksheet("Sheet1");

        worksheet.columns = [
            { header: "Survey No", key: "surveyNo", width: 35 },
            { header: "Kcc Account Number", key: "kccAccountNumber", width: 25 },
            { header: "Bank BranchCode", key: "bankBranchCode", width: 15 },
            { header: "Report Approval Status", key: "reportApprovalStatus", width: 25 },
            { header: "Status", key: "status", width: 25 },
            { header: "Account Number", key: "accountNumber", width: 25 },
            { header: "Address", key: "address", width: 50 },
            { header: "First Name", key: "firstName", width: 25 },
            { header: "Last Name", key: "lastName", width: 20 },
            { header: "Loan Reference Number", key: "loanReferenceNumber", width: 25 },
            { header: "Village", key: "village", width: 25 },
            { header: "Pincode", key: "pincode", width: 10 },
            { header: "District", key: "district", width: 25 },
            { header: "State", key: "state", width: 20 },
            { header: "Zone", key: "zone", width: 25 },
            { header: "Mortage Details", key: "mortageDetails", width: 35 },
            { header: "Khata Details", key: "khataDetails", width: 25 },
            { header: "Mobile Number", key: "mobileNumber", width: 25 },
            { header: "Spouse Name", key: "spouseName", width: 25 },
            { header: "Gender", key: "gender", width: 25 },
            { header: "Land Area", key: "landArea", width: 25 },
            { header: "Application Id", key: "applicationId", width: 25 },
            { header: "Created Date", key: "createdAt", width: 25 },
            { header: "Updated Date", key: "updatedAt", width: 15 },
        ];
        worksheet.addRows(data);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        await workbook.xlsx.write(res);
        res.status(statusCodes.HTTP_OK).end();

    } catch (err) {
        console.log(err);
        next(err);
    }

};
ApplicationController.getAgrotechApplicationById = async (req, res, next) => {
    try {
        let result = await applicationService.getAgrotechApplicationById(req.query.id);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.getAgrotechApplicationByAccountNumber= async (req, res, next) => {
    try {
        
        let result = await applicationService.getAgrotechApplicationByAccountNumber(req.query.accountNumber);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
ApplicationController.agrotechApproveStatus = async (req, res, next) => {
    try {
        //let id = req.query.id;
        let status;
        if (req.body.status == "1") {
            status = USER_STATUS.APPROVED
        } else if (req.body.status == "2") {
            status = USER_STATUS.REJECTED
        } else {
            status = req.body.status
        }

        let result = await applicationService.agrotechApproveStatus(req.body, status)
        if (!result) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        } else {
            return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
        }

    } catch (err) {
        console.log(err);
        next(err);
    }
};

ApplicationController.agrotechbulkApproveApplications = async (req, res, next) => {
    try {
        if(req.user.branchCode){
            req.body.branchCode=req.user.branchCode
        }
        let status;
        if (req.body.status == "1") {
            status = USER_STATUS.APPROVED
        } else if (req.body.status == "2") {
            status = USER_STATUS.REJECTED
        } else {
            status = req.body.status
        }

        let result = await applicationService.agrotechbulkApproveApplications(req.body, status)
        
        if (result.status==false) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        } else {
            return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
        }

    } catch (err) {
        console.log(err);
        next(err);
    }
};

ApplicationController.updateFlag = async (req, res, next) => {
    try {
        let result = await applicationService.updateFlag(req.body);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

ApplicationController.resolveApplicationComment = async (req, res, next) => {
    try {
        let result = await applicationService.resolveApplicationComment(req.body);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

ApplicationController.getapplicationsDataGraph = async (req, res, next) => {
    try {         
        let branchCode   
        if(req.user.branchCode){
          branchCode = req.user.branchCode
        }
        let keyType = req.query.DataType;
        let result = await applicationService.getapplicationsDataGraph(keyType,branchCode);
        if (!result?.data) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        } else {
            return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
        }

    } catch (err) {
        console.log(err);
        next(err);
    }
};

ApplicationController.getLandApprovedCount = async (req, res, next) => {
    try {
        let branchCode   
        if(req.user.branchCode){
          branchCode = req.user.branchCode
        }    
       // let user = req.user.roleI
        let keyType = req.query.dataType;
        let result = await applicationService.getLandApprovedCount(keyType,branchCode);
        if (!result?.data) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        } else {
            return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
        }

    } catch (err) {
        console.log(err);
        next(err);
    }
};
ApplicationController.historyDownload = async (req, res, next) => {
    try {  
        let query = req.query
        let data
        if(query.branchCode){
            console.log("qq")
            data = await bulkUploadReport.find({branchCode:query.branchCode});
        }     
        else{
            data = await bulkUploadReport.find();
        }
         
        //
        let workbook = new excelJs.Workbook();
        let worksheet = workbook.addWorksheet("Sheet1");

        worksheet.columns = [
            { header: "Bulk Upload Id", key: "bulkUploadId", width: 35 },
            { header: "Created Application Count", key: "createdApplicationCount", width: 35 },
            { header: "Updated Application Count", key: "updatedApplicationCount", width: 25 },
            { header: "NotUpdated Application Count", key: "notUpdatedApplicationCount", width: 15 },
            { header: "Created Date", key: "createdAt", width: 25 },
            { header: "Updated Date", key: "updatedAt", width: 15 },
        ];
        worksheet.addRows(data);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        await workbook.xlsx.write(res);
        res.status(statusCodes.HTTP_OK).end();
        return response.success(req, res, 200, data, 'success');
    } catch (err) {
        console.log(err);
        next(err);
    }

};
module.exports = ApplicationController;