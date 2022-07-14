'use strict'
const { userService } = require('../services');
const {
    user,
    admin,
    addRole
} = require('../database/models');
const { response } = require('../middleware');
const { messages, statusCodes, customerHeaderMapping, landHeaderMapping } = require('../configs');
const { USER_STATUS } = require('../constants');
const fs = require('fs');
const path = require('path')
const xml2js = require('xml2js');
const excelJs = require("exceljs");
const excelToJson = require("convert-excel-to-json");
const moment = require('moment-timezone');
const { CUSTOMER_DATA_SHEET } = process.env;
const { generateAccessToken } = require('../utils');
const { ThirdPartyServices } = require('../externalServices');
const utils = require("../utils");
const falseValues = [undefined, 'undefined', null, 'null'];
class UserController { }
UserController.signup = async (req, res, next) => {
    try {
        let result = await userService.signup(req.body)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
UserController.signIn = async (req, res, next) => {
    try {
        let signIn = await userService.login(req.body);
        console.log("signIn Account ====>", signIn);
        if (!signIn.status) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, signIn, signIn.message);
        }
        return response.success(req, res, statusCodes.HTTP_OK, signIn, signIn.message);
    } catch (error) {
        console.log("error", error);
        next({ status: statusCodes.HTTP_INTERNAL_SERVER_ERROR });
    }
}
UserController.forgetPassword = async (req, res, next) => {
    try {
        let body = req.body
        let result = await userService.forgetPassword(body);
        if (!result.status) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result.message ? result : messages.passwordNotMatch);
        }
        return response.success(req, res, statusCodes.HTTP_OK, result, messages.passswordCreated)
    } catch (error) {
        console.log("error", error);
        next(error)
    }
}
UserController.verifyOtp = async (req, res, next) => {
    try {
        let changePassword = await userService.verifyOtp(req.body);
        console.log("newPassword ====>", changePassword);
        if (!changePassword.status) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, changePassword.message ? changePassword : messages.passwordNotMatch);
        }
        return response.success(req, res, statusCodes.HTTP_OK, changePassword, messages.passswordCreated)
    } catch (error) {
        console.log("error", error);
        next({ status: statusCodes.HTTP_INTERNAL_SERVER_ERROR });
    }
}
UserController.resetPassword = async (req, res, next) => {
    try {
        let userId = req.user.id;
        let changePassword = await userService.resetPassword(req.body, userId);
        console.log("newPassword ====>", changePassword);
        if (!changePassword.status) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, changePassword.message ? changePassword : messages.passwordNotMatch);
        }
        return response.success(req, res, statusCodes.HTTP_OK, changePassword, messages.passwordCreated)
    } catch (error) {
        console.log("error", error);
        next({ status: statusCodes.HTTP_INTERNAL_SERVER_ERROR });
    }
}
UserController.changePassword = async (req, res, next) => {
    try {
        let userId = req.user.id;
        let changePassword = await userService.changePassword(req.body, userId);
        if (!changePassword.status) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, changePassword.message ? changePassword : messages.passwordNotMatch);
        }
        return response.success(req, res, statusCodes.HTTP_OK, changePassword, messages.passswordCreated)
    } catch (error) {
        console.log("error", error);
        next({ status: statusCodes.HTTP_INTERNAL_SERVER_ERROR });
    }
}
UserController.editProfile = async (req, res, next) => {
    try {
        let id = req.query.id
        let body = req.body;
        let status;
        if(body.status=="0"){
            status="PENDING"
        }else if(body.status=="1"){
            status="APPROVED"
        }else if(body.status=="2"){
            status="REJECTED"
        }else{
            status=body.status
        }
        body.approvalStatus=status
        let result = await userService.editProfile(body, id)
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
UserController.createUserByStaff = async (req, res, next) => {
    try {
        let body = req.body;
        let status;
        if(body.status=="0"){
            status="PENDING"
        }else if(body.status=="1"){
            status="APPROVED"
        }else if(body.status=="2"){
            status="REJECTED"
        }else{
            status=body.status
        }
        body.approvalStatus=status
        let result = await userService.createUserByStaff(body);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.getPendingList = async (req, res, next) => {
    try {
        console.log(req.user.roleId)
        if (req.user.roleId == "622f49ae363d1e3c0e936cd6") {
            console.log("admin")
            let result = await userService.getPendingList(req)
            if (!result?.data) {
                return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);

            } else {
                return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
            }
        } else {
            console.log("admin")
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, "permission Not Granted");
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
};
UserController.approveStatus = async (req, res, next) => {
    try {
        let id = req.query.id;
        let status;
        if (req.body.status == "1") {
            status = USER_STATUS.APPROVED
        } else if (req.body.status == "2") {
            status = USER_STATUS.REJECTED
        } else {
            status = req.body.status
        }
        let Role
        if(req.body.roleId){
            Role= await addRole.findOne({roleId:req.body.roleId},{roleName:1})
        }
        req.body.role=Role.roleName

        let result = await userService.approveStatus(req.body, status, id)
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
UserController.completeForm = async (req, res, next) => {
    try {
        let body = req.body;
        let result = await userService.completeForm(body);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.getAllUsers = async (req, res, next) => {
    try {
        let condition = { ...req.query };
        let limit = req.query.limit ? parseInt(req.query.limit) : 10
        let page = req.query.page ? parseInt(req.query.page) : 1
        let result = await userService.getAllUsers(condition, limit, page);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.getUserById = async (req, res, next) => {
    try {
        let result = await userService.getUserById(req.query.id);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.updateUserDetails = async (req, res, next) => {
    try {
        let result = await userService.updateUserDetails(req.body);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.deleteUser = async (req, res, next) => {
    try {
        let result = await userService.deleteUser(req.query.id);
        // console.log(result)
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
};
UserController.excelToJson = async (req, res, next) => {
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
            if (!file.filename.includes(CUSTOMER_DATA_SHEET)) {
                return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST,`Invalid file, Please upload the file ${CUSTOMER_DATA_SHEET}`);
                
            }
            const excelData = excelToJson({
                sourceFile: doc_url,
                sheets: [
                    {
                        name: CUSTOMER_DATA_SHEET,
                        header: {
                            rows: 1
                        },
                        columnToKey: landHeaderMapping
                    }
                ]
            });
            console.log("The following is the excelData", excelData);
            req.body.customerData = excelData.customerData;
            console.log("After excel to JSON", req.body.customerData.length);
            let i = 2;
            req.body.customerData = req.body.customerData.map((item) => {
                // item.status = DATA_STATUS.ACTIVE;
                i++;
                console.log("The following is the item", item);
                return item;
            });
            console.log("After processing the files", req.body.customerData.length);
            next();
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.bulkCustomerUpload = async (req, res, next) => {
    try {
        let { customerData } = req.body;
        console.log("The following is the landDetails", customerData);
        let result = await userService.bulkCustomerUpload(customerData);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.createAdminAccount = async (req, res, next) => {
    try {
        let body = req.body;
        let status;
        if(body.status=="0"){
            status="PENDING"
        }else if(body.status=="1"){
            status="APPROVED"
        }else if(body.status=="2"){
              status="REJECTED"
        }else{
            status=body.status
        }
        body.status=status
        let Role= await addRole.findOne({roleId:body.roleId},{roleName:1})
        body.role=Role.roleName

        let result = await userService.createAdminAccount(body);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.editAdminAccount = async (req, res, next) => {
    try {
        let id = req.query.id;
        let body = req.body;
        let status;
        if(body.status=="0"){
            status="PENDING"
        }else if(body.status=="1"){
            status="APPROVED"
        }else if(body.status=="2"){
              status="REJECTED"
        }else{
            status=body.status
        }
        body.status=status
        let Role
        if(body.roleId){
            Role= await addRole.findOne({roleId:body.roleId},{roleName:1})
        }
        body.role=Role.roleName
        let result = await userService.editAdminAccount(id, body);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.editAdminAccountMany = async (req, res, next) => {
    try {
        let body = req.body;
        let status;
        if(body.status=="0"){
            status="PENDING"
        }else if(body.status=="1"){
            status="APPROVED"
        }else if(body.status=="2"){
            status="REJECTED"
        }else{
            status=body.status
        }
        body.status=status
        let result = await userService.editAdminAccountMany( body);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.deleteAdminAccount = async (req, res, next) => {
    try {
        let id = req.query.id;
        let result = await userService.deleteAdminAccount(id);
        if (!result) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.getAllAdmin = async (req, res, next) => {
    try {
        let condition = {
            ...req.query
        };
        console.log("The following is the condition", condition);
        let limit = req.query.limit ? parseInt(req.query.limit) : 10
        let page = req.query.page ? parseInt(req.query.page) : 1
        console.log("The following is the limit", condition, limit, page);
        let result = await userService.getAllAdmin(condition, limit, page);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.getAdminById = async (req, res, next) => {
    try {
        let result = await userService.getAdminById(req.query.id);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.getDashboardList = async (req, res, next) => {
    try {
        // console.log(req.user.roleId)
        // if (req.user.roleId == "622f49ae363d1e3c0e936cd6") {
        //     console.log("admin")
        let result = await userService.getDashboardList(req)
        if (!result?.data) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);

        } else {
            return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
        }
        // } else {
        //     console.log("admin")
        //     return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, "permission Not Granted");
        // }
    } catch (err) {
        console.log(err);
        next(err);
    }
};
UserController.reportGeneration = async (req, res, next) => {
    try {
        let body = req.body;
        let result = await userService.reportGeneration(body);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

UserController.createReportBody = async (req, res, next) => {
    try {
        let applicationId = req.query.id;
        let result = await userService.createReportBody(applicationId);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

UserController.getReportBody = async (req, res, next) => {
    try {
        let applicationId = req.query.id;
        let result = await userService.getReportBody(applicationId);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.updateReportBody = async (req, res, next) => {
    try {
        let applicationId = req.body.appId;
        let payload = req.body;
        let Gender;
        if (payload.gender == "1") {
            Gender = "male"
        }
        if (payload.gender == "2") {
            Gender = "female"
        }
        if (payload.gender == "3") {
            Gender = "others"
        }
        if(payload.gender!='1'&&payload.gender!='2'&&payload.gender!='3'){
            Gender =payload.gender
        }
        payload.gender = Gender;
        let result = await userService.updateReportBody(applicationId, payload);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

UserController.getReportPdf = async (req, res, next) => {
    try {
        let applicationId = req.query.applicationId;
        let result = await userService.getReportPdf(applicationId);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.download = async (req, res, next) => {
    try {
        let query= req.query;
        let totalCount, users;
        let obj= {};
        obj.roleId= {$nin : ["ROLE_5","ROLE_7"]}
        if (query.search) {
            obj.$or = [{
                name: {
                    $regex: query.search,
                    $options: 'i'
                }
            },
            {
                branchCode: {
                    $regex: query.search,
                    $options: 'i'
                }
            },
            {
                emailId: {
                    $regex: query.search,
                    $options: 'i'
                }
            },
            {
                mobileNumber: {
                    $regex: query.search,
                    $options: 'i'
                }
            }
            ]
        }
        
        if (query.status) {
            obj.status = { $regex: query.status, $options: 'i' }
        }
        if (query.startDate && query.endDate) {
            let endDate1 = new Date(query.endDate);
            endDate1.setDate(endDate1.getDate() + 1);
            obj.createdAt = { $gte: new Date(startDate), $lte: endDate1 };
        } else if (query.startDate && !query.endDate) {
            obj.createdAt = { $gte: new Date(query.startDate) }
        } else if (!query.startDate && query.endDate) {
            let endDate1 = new Date(query.endDate)
            endDate1.setDate(endDate1.getDate() + 1);
            obj.createdAt = { $lte: endDate1 }
        }
        // if(email){
        //     let sort ={emailId:email}
        //     totalCount = await user.find(query).countDocuments();
        //     users = await user.find(query)
        //         .skip(parseInt(limit * (page - 1)))
        //         .limit(limit)
        //         .sort(sort);
        // const sendresponse = pagingData(users, page, limit, totalCount)
        //     return {
        //         status: HTTP_OK,
        //         message: "Data Fetched Successfully",
        //         data: sendresponse
        //     }
        // }
        // land = await landRecords.find(obj).sort({
        //     'createdAt': -1
        // });
        users = await admin.find(obj)
            .sort({
                'createdAt': -1
            });
            let workbook = new excelJs.Workbook();
            let worksheet = workbook.addWorksheet("Sheet1");
    
            worksheet.columns = [
                { header: "Name", key: "name", width: 35 },
                { header: "EmailId", key: "emailId", width: 35 },
                { header: "Role", key: "role", width: 35 },
                { header: "MobileNumber", key: "mobileNumber", width: 25 },
                { header: "BranchCode", key: "branchCode", width: 15 },
                { header: "Status", key: "status", width: 25 }
            ];
            worksheet.addRows(users);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "users_list.xlsx"
            );
            await workbook.xlsx.write(res);
            res.status(statusCodes.HTTP_OK).end();

    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}

UserController.createBulkAdmins = async (req, res, next) => {
    try {
        let body = req.body;
        let result = await userService.createBulkAdmin(body);
        if (!result?.data) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.adminResetPassword = async (req, res, next) => {
    try {
        let userId = req.query.id;
        let changePassword = await userService.adminResetPassword(req.body, userId);
        console.log("newPassword ====>", changePassword);
        if (!changePassword.status) {
            return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, changePassword.message ? changePassword : messages.passwordNotMatch);
        }
        return response.success(req, res, statusCodes.HTTP_OK, changePassword, messages.passwordCreated)
    } catch (error) {
        console.log("error", error);
        next({ status: statusCodes.HTTP_INTERNAL_SERVER_ERROR });
    }
}
UserController.getReportWord = async (req, res, next) => {
    try {
        let applicationId = req.query.applicationId;
        let result = await userService.getWordReport(applicationId);
   return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.downloadReport = async (req, res, next) => {
    try {
        let applicationId = req.body.applicationId;
        let result = await userService.downloadReport(applicationId);
        console.log(result)
        if(result.code==400){
            return response.success(req, res, statusCodes.HTTP_BAD_REQUEST,result?.data, result?.message);
        }
   return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
UserController.sessionLoginChange = async (req, res, next) => {
    try {
        //let id = req.query.id;
        let body = req.body;
        let sessionLogin;
        if(body.sessionLogin=="1"){
            sessionLogin= true
        }else{
            sessionLogin= false
        }
        body.sessionLogin=sessionLogin
        let result = await userService.sessionLoginChange(body);
        if (result.status==false) return response.errors(req, res, statusCodes.HTTP_BAD_REQUEST, result?.message);
        return response.success(req, res, statusCodes.HTTP_OK, result.data, result?.message);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
module.exports = UserController;