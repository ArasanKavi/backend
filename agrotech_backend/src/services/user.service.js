const {
    user,
    permission,
    addRole,
    landRecords,
    admin,
    application,
    password,
    bankBranch,
    reportBodyData
} = require('../database/models');
const {
    statusCodes,
    messages,
    config
} = require("../configs");
const bcrypt = require('bcrypt');
const {
    pagingData,
    pagination
} = require("../utils");
const randomstring = require("randomstring");
const emailService = require('../utils/mailService');
const {
    generateAccessToken,
    genHash,
} = require("../utils");
const {
    errorsWithOutReq
} = require('../middleware/responses');
const {
    HTTP_BAD_REQUEST,
    HTTP_OK
} = require('../configs/httpCodes');
const {
    errorObjGeneator
} = require("../middleware").errorHandler;
const fs = require('fs');
const path = require('path')
const Handlebars = require("handlebars");
//const moment = require('moment');
const moment = require('moment-timezone');
const shortid = require('shortid');
const puppeteer = require('puppeteer');
const getStream = require("into-stream");
const FormData = require('form-data');
const s3 = require('s3-client');
const AWS = require('aws-sdk');
const { resourceLimits } = require('worker_threads');
const {
    DATA_STATUS,
    SEARCH_TYPE,
    SEARCH_HEADERS,
    SEARCH_HEADERS_USER,
    SEARCH_HEADERS_ADMIN_USER

} = require("../constants");
const HTMLtoDOCX = require('html-to-docx');
const mongoose = require('mongoose');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

let awsS3Client = new AWS.S3();

let client = s3.createClient({
    s3Client: awsS3Client
});
class UserService { }
UserService.signup = async (payload) => {
    try {
        console.log("payload", payload);
        let checkUserExist = await user.findOne({
            emailId: payload.emailId
        });
        let checkAdminExist = await admin.findOne({
            emailId: payload.emailId
        });
        if (checkUserExist) {
            return {
                status: false,
                message: "EmailId Already Exists a Customer"
            }
        } else if (checkAdminExist) {
            return {
                status: false,
                message: "EmailId Already Exists a Admin User"
            }
        } else if (payload.setPassword !== payload.confirmPassword) {
            return {
                status: false,
                message: "setPassword doesn't match with confirmPassword"
            }
        } else {
            let body = payload;
            body.password = genHash(payload.setPassword);
            body.roleId = "ROLE_6";
            let data = await user.create(body);
            return {
                status: true,
                message: "User Created Successfully",
                data: data
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
UserService.login = async (payload) => {
    try {
        console.log("payload ====>", payload);
        let {
            branchCode,
            emailId,
            password
        } = payload;
        let findCustomer
        let adminUser
        let adminManager
        if(emailId){
            findCustomer = await user.findOne({
                emailId: emailId
            });
            adminUser = await admin.findOne({
                emailId: emailId
            });
        }
        if(branchCode){
            console.log("checking flow")
            findCustomer = await user.findOne({
                branchCode: branchCode
            });
            adminUser = await admin.findOne({
                branchCode: branchCode,
                roleId:"ROLE_8"
            });
            if(branchCode.includes("BM")){
                branchCode = branchCode.replace(/[^0-9]/g,'');
                adminManager = await admin.findOne({
                    branchCode: branchCode,
                    roleId: "ROLE_9"
                });
            }
        }
        if (findCustomer) {
            let checkPassword = await bcrypt.compare(password, findCustomer.password);
            if (!checkPassword) {
                return {
                    status: false,
                    message: "Invalid Password"
                }
            } else if (findCustomer.approvalStatus === "PENDING") {
                return {
                    status: false,
                    message: `Your account is pending waiting for admin approval .please contact Agrotech admin`,
                    approveStatus:findCustomer.approvalStatus
                }
            } else if (findCustomer.approvalStatus === "Unapproved" || findCustomer.approvalStatus.toLowerCase() === "rejected") {
                return {
                    status: false,
                    message: `Your account is Rejected by Agrotech admin. Please contact Agrotech customer care.`,
                    approveStatus:findCustomer.approvalStatus
                }
            } else if (findCustomer.approvalStatus === "Inactive") {
                return {
                    status: false,
                    message: `Your account is Inactive. Please contact Agrotech customer care.`
                }
            } else {
                let role = await addRole.findOne({
                    roleId: findCustomer.role
                });
                let tokenData = {
                    id: findCustomer._id,
                    roleId: findCustomer.role,
                    permissions: role.permissions,
                    isAdminUser: false,
                    name: `${findCustomer.firstName} ${findCustomer.lastName}`,
                    branchCode: findCustomer.branchCode
                    
                };
                let token = generateAccessToken(tokenData);
                let date=moment().tz('Asia/kolkata').format('YYYY-MM-DD-hh:mm A');
                console.log(date)
                let lastLogin = await admin.findOneAndUpdate({_id: findCustomer._id},{lastLogin:date})
                return {
                    status: true,
                    message: "Login Successfully",
                    accessToken: token
                }
            }
        } else if (adminUser) {
            
            let checkPassword = await bcrypt.compare(password, adminUser.password);
            if (!checkPassword) {
                return {
                    status: false,
                    message: "Invalid Password"
                }
            } else if (adminUser.status.toLowerCase() == "rejected" || adminUser.status.toLowerCase() == "Unapproved") {
                console.log("11",adminUser.status)
                return {
                    status: false,
                    message: `Your account is ${adminUser.status}. Please contact Agrotech admin.`
                }
            } else if (adminUser.status.toLowerCase() === "pending") {
                return {
                    status: false,
                    message: `Your account is pending waiting for admin approval .please contact Agrotech admin`
                }
            
            } else if (adminUser.sessionLogin === true) {
                return {
                    status: false,
                    message: `Your Logging in UnOffice Time.Admin Blocked Session Login`
                }
            
            } else {
                let role = await addRole.findOne({
                    roleId: adminUser.roleId
                });
                let isAdminUser
                if(adminUser.roleId=="ROLE_5"||adminUser.roleId=="ROLE_7"){
                    isAdminUser=true
                }else{
                    isAdminUser=false
                }
                let date=moment().tz('Asia/kolkata').format('YYYY-MM-DD-hh:mm A');
                let tokenData = {
                    id: adminUser._id,
                    roleId: adminUser.roleId,
                    permissions: role.permissions,
                    isAdminUser: isAdminUser,
                    name: `${adminUser.name}`,
                    branchCode: adminUser.branchCode,
                    lastLogin:date
                };
                let token = generateAccessToken(tokenData);
                let lastLogin = await admin.findOneAndUpdate({_id: adminUser._id},{lastLogin:date})
                return {
                    status: true,
                    message: "Login Successfully",
                    accessToken: token
                }
            }
        } else if(adminManager) {
            let checkPassword = await bcrypt.compare(password, adminManager.password);
            if (!checkPassword) {
                return {
                    status: false,
                    message: "Invalid Password"
                }
            } else if (adminManager.status.toLowerCase() == "rejected" || adminManager.status.toLowerCase() == "Unapproved") {
                console.log("11",adminManager.status)
                return {
                    status: false,
                    message: `Your account is ${adminManager.status}. Please contact Agrotech admin.`
                }
            } else if (adminManager.status.toLowerCase() === "pending") {
                return {
                    status: false,
                    message: `Your account is pending waiting for admin approval .please contact Agrotech admin`
                }
            
            } else if (adminManager.sessionLogin === true) {
                return {
                    status: false,
                    message: `Your Logging in UnOffice Time.Admin Blocked Session Login`
                }
            
            } else {
                let role = await addRole.findOne({
                    roleId: adminManager.roleId
                });
                let isAdminUser
                if(adminManager.roleId=="ROLE_5"||adminManager.roleId=="ROLE_7"){
                    isAdminUser=true
                }else{
                    isAdminUser=false
                }
                let date=moment().tz('Asia/kolkata').format('YYYY-MM-DD-hh:mm A');
                let tokenData = {
                    id: adminManager._id,
                    roleId: adminManager.roleId,
                    permissions: role.permissions,
                    isAdminUser: isAdminUser,
                    name: `${adminManager.name}`,
                    branchCode: adminManager.branchCode,
                    lastLogin:date
                };
                let token = generateAccessToken(tokenData);
                let lastLogin = await admin.findOneAndUpdate({_id: adminManager._id},{lastLogin:date})
                return {
                    status: true,
                    message: "Login Successfully",
                    accessToken: token
                }
            }
        } else {
            if(branchCode && !adminUser){
                
                return {
                    status: false,
                    message: "BranchCode not registered, Please Sign-up."
                };
            }
            return {
                status: false,
                message: "Email not registered, Please Sign-up."
            };
            
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}
UserService.forgetPassword = async (payload) => {
    try {
        
        let adminUser = await admin.findOne({
            emailId: payload.emailId
        });
        if (!adminUser) {
            return {
                status: false,
                message: 'Email ID not registered'
            }
        };
        
        let emailVerificationCode = randomstring.generate({
            length: 4,
            charset: 'numeric',
            //capitalization: 'uppercase'
        })
        
        if (adminUser && adminUser.status!="REJECTED") {
            emailService.userForgetPasswordVerification({
                email: payload.emailId,
                emailVerificationCode: emailVerificationCode
            });
            await admin.updateOne({
                _id: adminUser._id
            }, {
                otp: emailVerificationCode,
            });
            return {
                status: true,
                message: 'Forgot password verification code send to mail'
            }
        }else{
            return {
                status: false,
                message: 'Your Account is Rejected.You Cannot Reset Your Password'
            }
        }
        // if (customer && customer.approvalStatus!="REJECTED") {
        //     emailService.userForgetPasswordVerification({
        //         email: payload.emailId,
        //         emailVerificationCode: emailVerificationCode
        //     });
        //     await user.updateOne({
        //         _id: customer._id
        //     }, {
        //         otp: emailVerificationCode,
        //     });
        //     return {
        //         status: true,
        //         message: 'Forgot password verification code send to mail'
        //     }
        // }else{
        //     return {
        //         status: false,
        //         message: 'Your Account Status is Rejected.You Cannot Reset Your Password'
        //     }
        // }
        
    } catch (error) {
        console.log("error", error);
        throw new Error(error);
    }
}
UserService.verifyOtp = async (payload) => {
    try {
        console.log("payload ====> ", payload);
        let customer = await user.findOne({
            emailId: payload.emailId
        });
        let adminUser = await admin.findOne({
            emailId: payload.emailId
        });
        if (!customer && !adminUser) {
            return {
                status: false,
                message: 'Email not registered, Please Sign-up.'
            }
        };
        if (adminUser) {
            if (adminUser.otp === payload.otp) {
                let token = generateAccessToken({
                    id: adminUser._id
                });
                return {
                    status: true,
                    message: "Otp verified Successfully",
                    accessToken: token
                }
            } else {
                return {
                    status: false,
                    message: "Invalid OTP"
                }
            }
        };
        if (customer) {
            if (customer.otp === payload.otp) {
                let token = generateAccessToken({
                    id: customer._id
                });
                return {
                    status: true,
                    message: "Otp verified Successfully",
                    accessToken: token
                }
            } else {
                return {
                    status: false,
                    message: "Invalid OTP"
                }
            }
        };
    } catch (error) {
        console.log("error", error);
    }
}
UserService.resetPassword = async (payload, userId) => {
    try {
        console.log("payload ====> ", payload, "userId", userId);
        let {
            newPassword,
            confirmPassword
        } = payload;
        let Regex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})");

        if(payload.newPassword == "" || payload.confirmPassword == ""){
            return {
                status: false,
                message: "Password can't be empty, Please enter password"
            }
        }
        let customer = await user.findOne({
            _id: userId
        });
        let adminUser = await admin.findOne({
            _id: userId
        });
        if (!customer && !adminUser) {
            return {
                status: false,
                message: 'Email is not registered, Please Sign-up.'
            }
        };
        if (newPassword !== confirmPassword) {
            return {
                status: false,
                message: "Password does not match with confirmPassword, please try again"
            };
        }
        let savePassword;
        if (adminUser) {
            let checkPassword = await bcrypt.compare(newPassword, adminUser.password);
            if(checkPassword){
                return{
                    status: false,
                    message: "New password can not be same as old password"
                }
            } else{
                savePassword = await admin.updateOne({
                    _id: userId
                }, {
                    password: genHash(newPassword),
                });
            }
        }
        if (customer) {
            let checkPassword = await bcrypt.compare(newPassword, customer.password);
            if(checkPassword){
                return{
                    status: false,
                    message: "New password can not be same as old password"
                }
            }else{
            savePassword = await user.updateOne({
                _id: userId
            }, {
                password: genHash(newPassword),
            });
            } 
        }
        if (!savePassword) {
            return {
                status: false,
                message: "User not found"
            };
        }
        return {
            status: true,
            message: "Password updated successfully"
        };
    } catch (error) {
        console.log("error", error);
    }
}
UserService.adminResetPassword = async (payload, userId) => {
    try {
        console.log("payload ====> ", payload, "userId", userId);
       
       
        let adminUser = await admin.findOne({
            _id: userId
        });
        if (!adminUser) {
            return {
                status: false,
                message: 'user not found'
            }
        }else{
            let Random = randomstring.generate({
                length: 4,
                charset: 'numeric',
                //capitalization: 'uppercase'
            })
            
            let newPassword=`Test@${Random}`
            
               let savePassword = await admin.updateOne({
                    _id: userId
                }, {
                    password: genHash(newPassword),
                });
                let Password = await password.create({
                    userId:userId,
                    password:newPassword
                })
                let data={}
                if(adminUser.emailId){
                    data.emailId=adminUser.emailId
                }
                if(adminUser.branchCode){
                    data.branchCode=adminUser.branchCode
                }
                data.password=newPassword
                return{
                    status:true,
                    message:"Password updated successfully",
                    data
                }
            
        }
        
        
    } catch (error) {
        console.log("error", error);
    }
}
UserService.changePassword = async (payload, userId) => {
    try {
        let {
            oldPassword,
            newPassword,
            confirmPassword
        } = payload;
        if (newPassword !== confirmPassword) {
            return {
                status: false,
                message: "Both the passwords do not match, Please try again."
            };
        };
        let customer = await user.findOne({
            _id: userId
        });
        let adminUser = await admin.findOne({
            _id: userId
        });
        if (!customer && !adminUser) {
            return {
                status: false,
                message: 'User not found'
            }
        };
        let comparePassword;
        if (adminUser) {
            comparePassword = await bcrypt.compare(oldPassword, adminUser.password);
        }
        if (customer) {
            comparePassword = await bcrypt.compare(oldPassword, customer.password);
        }
        if (!comparePassword) {
            return {
                status: false,
                message: "Incorrect password"
            };
        }
        let savePassword;
        if (adminUser) {
            savePassword = await admin.updateOne({
                _id: userId
            }, {
                password: genHash(newPassword),
            });
        }
        if (customer) {
            savePassword = await user.updateOne({
                _id: userId
            }, {
                password: genHash(newPassword),
            });
        }
        if (!savePassword) {
            return {
                status: false,
                message: "Password Changed failed"
            };
        }
        return {
            status: true,
            message: "Password Changed successfully"
        };
    } catch (error) {
        console.log("error", error);
    }
}
UserService.editProfile = async (payload, id) => {
    try {
        console.log("payload", payload, id);
        let checkUserExist = await user.findOne({
            _id: id
        })
        if (!checkUserExist) {
            return {
                status: false,
                message: "User Not Exists"
            }
        } else {
            const body = payload
            let data = await user.findByIdAndUpdate(id, payload)
            let result = await user.find({
                _id: id
            }, {
                password: 0
            })
            return {
                status: true,
                message: "Profile Updated Successfully",
                data: result
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
UserService.getPendingList = async (payload, id) => {
    try {
        let checkUserExist = await user.find({
            approvalStatus: "PENDING"
        })
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: checkUserExist
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
UserService.createUserByStaff = async (payload) => {
    try {
        console.log("payload", payload);
        let checkUserExist = await user.findOne({
            emailId: payload.emailId
        });
        let checkAdminExist = await admin.findOne({
            emailId: payload.emailId
        });
        if (checkUserExist) {
            return {
                status: false,
                message: "EmailId Already Exists a Customer"
            }
        } else if (checkAdminExist) {
            return {
                status: false,
                message: "EmailId Already Exists a Admin user"
            }
        } else {
            let body = payload;
            let password ="Test@123"
            body.password = genHash(password )
            body.role = "ROLE_6";
            let data = await user.create(body);
            emailService.userEmailVerification({
                email: data.emailId,
                password: password
            });
            return {
                status: true,
                message: "User Created Successfully",
                data
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
UserService.approveStatus = async (payload, status, id) => {
    try {
        let checkUserExist = await user.findOne({
            _id: id
        });
        
        if (!checkUserExist) {
            return {
                status: false,
                message: "User Not Exists"
            }
        } else {
            
                let User = await user.findOne({
                    _id: id
                });
                let insertObj = {
                    name: `${User.firstName} ${User.lastName}`,
                    emailId: User.emailId,
                    mobileNumber: User.mobileNumber,
                    roleId: payload.roleId,
                    role: payload.role,
                    password: User.password,
                    status: status,
                    branchCode: User.branchCode
                };
                await admin.create(insertObj);
                await user.deleteOne({
                    emailId: User.emailId
                });
                emailService.userApprovalStatus({
                    email: checkUserExist.emailId,
                    status:status,
                    name:insertObj.name
                });
                return {
                    status: true,
                    message: `${status} Successfully`,
                    data: insertObj
                }

            
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
UserService.completeForm = async (payload) => {
    try {
        let requestUser, requestForm;
        if (!payload) {
            return {
                status: HTTP_BAD_REQUEST,
                message: "Please provide the data",
            }
        } else {
            if (payload.userId) {
                requestUser = await user.findOne({
                    _id: payload.userId
                });
                if (requestUser) {
                    requestForm = await user.findByIdAndUpdate(payload.userId, payload);
                    // console.log("1",requestForm)
                    return {
                        status: HTTP_OK,
                        message: "Data has been updated",
                        data: requestForm
                    }
                } else {
                    return {
                        status: HTTP_BAD_REQUEST,
                        message: "The user does not exist."
                    }
                }
            } else {
                payload.password = genHash("Test@123");
                payload.role = "ROLE_6";
                console.log(payload)
                requestForm = await user.create(payload)
                return {
                    status: HTTP_OK,
                    message: "Data has been updated",
                    data: requestForm
                }
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}
UserService.getAllUsers = async (condition, limit, page) => {
    try {
        console.log("123",condition)
        let {
            search,
            searchType,
            headerType,
            status,
            startDate,
            endDate,
            email,
            name
        } = condition;
        
        let totalCount, users,sendresponse;
        let query = {};
        if(searchType == SEARCH_TYPE.NORMAL){
            if (search) {
                query.$or = [{
                    firstName: {
                        $regex: search,
                        $options: 'i'
                    }
                },
                {
                    lastName: {
                        $regex: search,
                        $options: 'i'
                    }
                },
                {
                    emailId: {
                        $regex: search,
                        $options: 'i'
                    }
                },
                {
                    mobileNumber: {
                        $regex: search,
                        $options: 'i'
                    }
                }
                ]
            }
            if (status &&status != "ALL" ) {
                query.approvalStatus = { $regex: status, $options: 'i' }
            }
            if (startDate && endDate) {
                let endDate1 = new Date(endDate);
                endDate1.setDate(endDate1.getDate() + 1);
                query.createdAt = { $gte: new Date(startDate), $lte: endDate1 };
            } else if (startDate && !endDate) {
                query.createdAt = { $gte: new Date(startDate) }
            } else if (!startDate && endDate) {
                let endDate1 = new Date(endDate)
                endDate1.setDate(endDate1.getDate() + 1);
                query.createdAt = { $lte: endDate1 }
            }
            let sort
            if (email) {
                sort = {
                    emailId: email
                }
            }
            if (name) {
                sort = {
                    firstName: name
                }
            }

            if(sort){
                console.log("sortings",sort)
                totalCount = await user.find(query).countDocuments();
                users = await user.find(query)
                    .skip(parseInt(limit * (page - 1)))
                    .limit(limit)
                    .sort(sort);  
                  
              sendresponse = pagingData(users, page, limit, totalCount)
                return {
                    status: HTTP_OK,
                    message: "Data Fetched Successfully",
                    data: sendresponse
                }
            }
            if(limit== 0){
                console.log("1",query,limit,page)
                totalCount = await user.find(query).countDocuments();
            users = await user.find(query)
                .skip()
                .limit()
                .sort({
                    'createdAt': -1
                });
            sendresponse = pagingData(users, page, limit, totalCount)
            return {
                status: HTTP_OK,
                message: "Data Fetched Successfully",
                data: sendresponse
            }
            }
            totalCount = await user.find(query).countDocuments();
            users = await user.find(query)
                .skip(parseInt(limit * (page - 1)))
                .limit(limit)
                .sort({
                    'createdAt': -1
                });
            sendresponse = pagingData(users, page, limit, totalCount)
            return {
                status: HTTP_OK,
                message: "Data Fetched Successfully",
                data: sendresponse
            }
        }else if(searchType == SEARCH_TYPE.DROPDOWN){
            if (search) {
                if(!headerType){
                    return{
                        status:false,
                        message:"Please Enter headerType"
                    }
                }else{
                query.$or = [];
                if(headerType == SEARCH_HEADERS_USER.NAME){
                    
                    query.$or.push({
                        firstName: {
                            $regex: search,
                            $options: 'i'
                        }
                    })
                } else if(headerType == SEARCH_HEADERS_USER.EMAIL){
                    query.$or.push({
                        emailId: {
                            $regex: search,
                            $options: 'i'
                        }
                    })
                }
              }
            }
            if (status &&status != "ALL" ) {
                query.approvalStatus = { $regex: status, $options: 'i' }
            }
            if (startDate && endDate) {
                let endDate1 = new Date(endDate);
                endDate1.setDate(endDate1.getDate() + 1);
                query.createdAt = { $gte: new Date(startDate), $lte: endDate1 };
            } else if (startDate && !endDate) {
                query.createdAt = { $gte: new Date(startDate) }
            } else if (!startDate && endDate) {
                let endDate1 = new Date(endDate)
                endDate1.setDate(endDate1.getDate() + 1);
                query.createdAt = { $lte: endDate1 }
            }
            let sort
            if (email) {
                sort = {
                    emailId: email
                }
            }
            if (name) {
                sort = {
                    firstName: name
                }
            }

            if(sort){
                console.log("sorting",sort)
                totalCount = await user.find(query).countDocuments();
                users = await user.find(query)
                    .skip(parseInt(limit * (page - 1)))
                    .limit(limit)
                    .sort(sort);  
                  
              sendresponse = pagingData(users, page, limit, totalCount)
                return {
                    status: HTTP_OK,
                    message: "Data Fetched Successfully",
                    data: sendresponse
                }
            }
            if(limit== 0){
                console.log("1",query,limit,page)
                totalCount = await user.find(query).countDocuments();
            users = await user.find(query)
                .skip()
                .limit()
                .sort({
                    'createdAt': -1
                });
            sendresponse = pagingData(users, page, limit, totalCount)
            return {
                status: HTTP_OK,
                message: "Data Fetched Successfully",
                data: sendresponse
            }
            }
            totalCount = await user.find(query).countDocuments();
            users = await user.find(query)
                .skip(parseInt(limit * (page - 1)))
                .limit(limit)
                .sort({
                    'createdAt': -1
                });
            sendresponse = pagingData(users, page, limit, totalCount)
            return {
                status: HTTP_OK,
                message: "Data Fetched Successfully",
                data: sendresponse
            }
        }
        // if (search) {
        //     query.$or = [{
        //         firstName: {
        //             $regex: search,
        //             $options: 'i'
        //         }
        //     },
        //     {
        //         lastName: {
        //             $regex: search,
        //             $options: 'i'
        //         }
        //     },
        //     {
        //         emailId: {
        //             $regex: search,
        //             $options: 'i'
        //         }
        //     },
        //     {
        //         mobileNumber: {
        //             $regex: search,
        //             $options: 'i'
        //         }
        //     }
        //     ]
        // }
        
        // if (status &&status != "ALL" ) {
        //     query.approvalStatus = { $regex: status, $options: 'i' }
        // }
        // if (startDate && endDate) {
        //     let endDate1 = new Date(endDate);
        //     endDate1.setDate(endDate1.getDate() + 1);
        //     query.createdAt = { $gte: new Date(startDate), $lte: endDate1 };
        // } else if (startDate && !endDate) {
        //     query.createdAt = { $gte: new Date(startDate) }
        // } else if (!startDate && endDate) {
        //     let endDate1 = new Date(endDate)
        //     endDate1.setDate(endDate1.getDate() + 1);
        //     query.createdAt = { $lte: endDate1 }
        // }
        
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
        // if(name){
        //     let sort ={firstName:name}
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
        // if(limit== 0){
        //     console.log("1",query,limit,page)
        //     totalCount = await user.find(query).countDocuments();
        // users = await user.find(query)
        //     .skip()
        //     .limit()
        //     .sort({
        //         'createdAt': -1
        //     });
        // const sendresponse = pagingData(users, page, limit, totalCount)
        // return {
        //     status: HTTP_OK,
        //     message: "Data Fetched Successfully",
        //     data: sendresponse
        // }
        // }
        // totalCount = await user.find(query).countDocuments();
        // users = await user.find(query)
        //     .skip(parseInt(limit * (page - 1)))
        //     .limit(limit)
        //     .sort({
        //         'createdAt': -1
        //     });
        // const sendresponse = pagingData(users, page, limit, totalCount)
        return {
            status: HTTP_OK,
            message: "Data Fetched Successfully",
            data: sendresponse
        }

    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}
UserService.getUserById = async (id) => {
    try {
        let data = await user.findById(id);
        if (!data) {
            return {
                status: HTTP_BAD_REQUEST,
                message: "No Data exists"
            }
        }
        return {
            status: HTTP_OK,
            message: "Data Fetched Successfully",
            data: data
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}
UserService.updateUserDetails = async (payload) => {
    try {
        let data = await user.findByIdAndUpdate(payload._id, payload);
        if (!data) {
            return {
                status: HTTP_BAD_REQUEST,
                message: "No Data exists"
            }
        }
        return {
            status: HTTP_OK,
            message: "Data Updated Successfully"
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}
UserService.deleteUser = async (id) => {
    try {
        let data = await user.findOne({
            _id: id
        });
        if (!data) {
            return {
                status: false,
                message: "User Not Found"
            };
        } else {
            await user.deleteOne({
                _id: id
            });
            return {
                status: true,
                message: "User Deleted Successfully"
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
UserService.bulkCustomerUpload = async (payload) => {
    try {
        let bulkUploadData = await user.insertMany(payload);
        console.log("The following is the bulkUploadData", bulkUploadData);
        return {
            status: true,
            message: "Data Updated Successfully",
            data: bulkUploadData
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
UserService.createAdminAccount = async (payload) => {
    try {
        console.log("payload", payload);
        let checkUserExist = await user.findOne({
            emailId: payload.emailId
        });
        let checkAdminExist = await admin.findOne({
            emailId: payload.emailId
        });
        if (checkUserExist) {
            return {
                status: false,
                message: "EmailId Already Exists a Customer"
            }
        } else if (checkAdminExist) {
            return {
                status: false,
                message: "EmailId Already Exists a Admin user"
            }
        } else {
            let body = payload;
            let password ="Test@123"
            body.password = genHash(password )
            let data = await admin.create(body);
            emailService.userEmailVerification({
                email: data.emailId,
                password: password 
            });
            return {
                status: true,
                message: "User Created Successfully",
                data
            }

        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
UserService.editAdminAccount = async (id, payload) => {
    try {
        let data = await admin.findByIdAndUpdate(id, payload);
        if (!data) {
            return {
                status: HTTP_BAD_REQUEST,
                message: "No Data exists"
            }
        }
        return {
            status: HTTP_OK,
            message: "Data Updated Successfully",
            data: data
        }
    } catch (err) {
        console.log("error", err);
        throw new Error(JSON.stringify(err))
    }
}
UserService.editAdminAccountMany = async ( payload) => {
    try {
        let data = await admin.updateMany({roleId:payload.roleId},{ $set: {  role: payload.role }});
        if (!data) {
            return {
                status: HTTP_BAD_REQUEST,
                message: "No Data exists"
            }
        }
        return {
            status: HTTP_OK,
            message: "Data Updated Successfully",
            data: data
        }
    } catch (err) {
        console.log("error", err);
        throw new Error(JSON.stringify(err))
    }
}
UserService.deleteAdminAccount = async (id) => {
    try {
        let data = await admin.findOne({
            _id: id
        });
        if (!data) {
            return {
                status: false,
                message: "User Not Found"
            };
        } else {
            await admin.deleteOne({
                _id: id
            });
            return {
                status: true,
                message: "User Deleted Successfully"
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
UserService.getAllAdmin = async (condition, limit, page) => {
    try {
        let {
            search,
            searchType,
            headerType,
            status,
            sort,
            name,
            emailId,
            mobileNumber,
            startDate,
            endDate,
            role,
            branchCode,
        } = condition;
        console.log("1", condition)
        let totalCount, users,sendresponse;
        let query = {};
        // if (search) {
        //     //let query = {};
        //     query.$or = [{
        //         name: {
        //             $regex: search,
        //             $options: 'i'
        //         }
        //     },
        //     {
        //     branchCode: {
        //         $regex: search,
        //         $options: 'i'
        //        }
        //      },
            
        //     {
        //         emailId: {
        //             $regex: search,
        //             $options: 'i'
        //         }
        //     },
        //     {
        //         mobileNumber: {
        //             $regex: search,
        //             $options: 'i'
        //         }
        //     }
        //     ]
        //     if (status) {
        //         query.status = status
        //     }
        //     //query.status = status;
        //     console.log(query)

        // }
    //     if(sort){
    //         query.branchCode = {
    //             $regex: sort,
    //             $options: 'i'
    //         }
    //     }
    //     let Sort
    //     if(name){
    //         console.log("checj")
    //         Sort={name:name}
            
    //     }
    //     if(emailId){
    //         Sort={emailId:emailId}
    //     }
    //     if(mobileNumber){
    //         Sort={mobileNumber:mobileNumber}
    //     }
    //     if(role){
    //         Sort={role:role}
    //     }
    //     if(branchCode){
    //         Sort={branchCode:branchCode}
    //     }
    //     if(Sort){
    //         console.log("122",Sort)
    //     totalCount = await admin.find(query).countDocuments();  
    //     adminRes = await admin.find(query).sort(
    //         Sort
    //     ).skip(parseInt(limit * (page - 1))).limit(limit);
    //     console.log("Checking data", adminRes, page, limit, totalCount);
    //     const sendResponse = pagingData(adminRes, page, limit, totalCount);
    //     return {
    //         status: HTTP_OK,
    //         message: "Data Fetched Successfully",
    //         data: sendResponse
    //     }
    //     }else if(limit== 0){
    //         console.log("limit HIII")
    //         totalCount = await admin.find(query).countDocuments();
           
    //        adminRes = await admin.find(query).sort({
    //            createdAt: -1
    //        }).skip()
    //        .limit();
    //        console.log("Checking data", adminRes, page, limit, totalCount);
    //        const sendResponse = pagingData(adminRes, page, limit, totalCount);
    //        return {
    //            status: HTTP_OK,
    //            message: "Data Fetched Successfully",
    //            data: sendResponse
    //        }
    //    }else{
    //      totalCount = await admin.find(query).countDocuments();
        
    //     adminRes = await admin.find(query).sort({
    //         createdAt: -1
    //     }).skip(parseInt(limit * (page - 1))).limit(limit);
    //     console.log("Checking data", adminRes, page, limit, totalCount);
    //     const sendResponse = pagingData(adminRes, page, limit, totalCount);
    //     return {
    //         status: HTTP_OK,
    //         message: "Data Fetched Successfully",
    //         data: sendResponse
    //     }
        
        
    // }
    ////tryyy
    if(searchType == SEARCH_TYPE.NORMAL){
        if (search) {
            query.$or = [{
                name: {
                    $regex: search,
                    $options: 'i'
                }
            },
            {
            branchCode: {
                $regex: search,
                $options: 'i'
               }
             },
            
            {
                emailId: {
                    $regex: search,
                    $options: 'i'
                }
            },
            {
                mobileNumber: {
                    $regex: search,
                    $options: 'i'
                }
            },
            {
               role: {
                    $regex: search,
                    $options: 'i'
                }
            }
            ]
        }
        if (status &&status != "ALL" ) {
            query.status = { $regex: status, $options: 'i' }
        }
        if(sort){
                    query.branchCode = {
                        $regex: sort,
                        $options: 'i'
                    }
                }
        if (startDate && endDate) {
            let endDate1 = new Date(endDate);
            endDate1.setDate(endDate1.getDate() + 1);
            query.createdAt = { $gte: new Date(startDate), $lte: endDate1 };
        } else if (startDate && !endDate) {
            query.createdAt = { $gte: new Date(startDate) }
        } else if (!startDate && endDate) {
            let endDate1 = new Date(endDate)
            endDate1.setDate(endDate1.getDate() + 1);
            query.createdAt = { $lte: endDate1 }
        }
        
        let Sort
            if(name){
                console.log("checj")
                Sort={name:name}
                
            }
            if(emailId){
                Sort={emailId:emailId}
            }
            if(mobileNumber){
                Sort={mobileNumber:mobileNumber}
            }
            if(role){
                Sort={role:role}
            }
            if(branchCode){
                Sort={branchCode:branchCode}
            }
           console.log("HIIDI",query)
        if(Sort){
            console.log("sortings",sort)
            totalCount = await admin.find(query).countDocuments();
            users = await admin.find(query)
                .skip(parseInt(limit * (page - 1)))
                .limit(limit)
                .sort(Sort);  
              
          sendresponse = pagingData(users, page, limit, totalCount)
            return {
                status: HTTP_OK,
                message: "Data Fetched Successfully",
                data: sendresponse
            }
        }
        if(limit== 0){
            console.log("1",query,limit,page)
            totalCount = await admin.find(query).countDocuments();
        users = await admin.find(query)
            .skip()
            .limit()
            .sort({
                'createdAt': -1
            });
        sendresponse = pagingData(users, page, limit, totalCount)
        return {
            status: HTTP_OK,
            message: "Data Fetched Successfully",
            data: sendresponse
        }
        }
        totalCount = await admin.find(query).countDocuments();
        users = await admin.find(query)
            .skip(parseInt(limit * (page - 1)))
            .limit(limit)
            .sort({
                'createdAt': -1
            });
        sendresponse = pagingData(users, page, limit, totalCount)
        return {
            status: HTTP_OK,
            message: "Data Fetched Successfully",
            data: sendresponse
        }
    }else if(searchType == SEARCH_TYPE.DROPDOWN){
        if (search) {
            if(!headerType){
                return{
                    status:false,
                    message:"Please Enter headerType"
                }
            }else{
            query.$or = [];
            if(headerType == SEARCH_HEADERS_ADMIN_USER.NAME){
                
                query.$or.push({
                    name: {
                        $regex: search,
                        $options: 'i'
                    }
                })
            } else if(headerType == SEARCH_HEADERS_ADMIN_USER.ROLE){
                query.$or.push({
                    role: {
                        $regex: search,
                        $options: 'i'
                    }
                })
            }
            else if(headerType == SEARCH_HEADERS_ADMIN_USER.MOBILE){
                query.$or.push({
                    mobileNumber: {
                        $regex: search,
                        $options: 'i'
                    }
                })
            }
            else if(headerType == SEARCH_HEADERS_ADMIN_USER.EMAIL){
                query.$or.push({
                    emailId: {
                        $regex: search,
                        $options: 'i'
                    }
                })
            }
            else if(headerType == SEARCH_HEADERS_ADMIN_USER.BRANCH_CODE){
                query.$or.push({
                    branchCode: {
                        $regex: search,
                        $options: 'i'
                    }
                })
            }
          }
        }
        if (status &&status != "ALL" ) {
            query.approvalStatus = { $regex: status, $options: 'i' }
        }
        if(sort){
            query.branchCode = {
                $regex: sort,
                $options: 'i'
            }
        }
        if (startDate && endDate) {
            let endDate1 = new Date(endDate);
            endDate1.setDate(endDate1.getDate() + 1);
            query.createdAt = { $gte: new Date(startDate), $lte: endDate1 };
        } else if (startDate && !endDate) {
            query.createdAt = { $gte: new Date(startDate) }
        } else if (!startDate && endDate) {
            let endDate1 = new Date(endDate)
            endDate1.setDate(endDate1.getDate() + 1);
            query.createdAt = { $lte: endDate1 }
        }
        let Sort
        if(name){
            console.log("checj")
            Sort={name:name}
            
        }
        if(emailId){
            Sort={emailId:emailId}
        }
        if(mobileNumber){
            Sort={mobileNumber:mobileNumber}
        }
        if(role){
            Sort={role:role}
        }
        if(branchCode){
            Sort={branchCode:branchCode}
        }

        if(Sort){
            console.log("sorting",sort)
            totalCount = await admin.find(query).countDocuments();
            users = await admin.find(query)
                .skip(parseInt(limit * (page - 1)))
                .limit(limit)
                .sort(Sort);  
              
          sendresponse = pagingData(users, page, limit, totalCount)
            return {
                status: HTTP_OK,
                message: "Data Fetched Successfully",
                data: sendresponse
            }
        }
        if(limit== 0){
            console.log("1",query,limit,page)
            totalCount = await admin.find(query).countDocuments();
        users = await admin.find(query)
            .skip()
            .limit()
            .sort({
                'createdAt': -1
            });
        sendresponse = pagingData(users, page, limit, totalCount)
        return {
            status: HTTP_OK,
            message: "Data Fetched Successfully",
            data: sendresponse
        }
        }
        totalCount = await admin.find(query).countDocuments();
        users = await admin.find(query)
            .skip(parseInt(limit * (page - 1)))
            .limit(limit)
            .sort({
                'createdAt': -1
            });
        sendresponse = pagingData(users, page, limit, totalCount)
        return {
            status: HTTP_OK,
            message: "Data Fetched Successfully",
            data: sendresponse
        }
    }

    } catch (err) {
        console.log("error", err);
        throw new Error(JSON.stringify(err));
    }
}
UserService.getAdminById = async (id) => {
    try {
        let data = await admin.findById(id);
        if (!data) {
            return {
                status: HTTP_BAD_REQUEST,
                message: "No Data exists"
            }
        }
        console.log(data)
        let role = await addRole.findOne({roleId:data.roleId},{roleName:1})
        data.role=role.roleName
        return {
            status: HTTP_OK,
            message: "Data Fetched Successfully",
            data: data
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}
UserService.getDashboardList = async (payload, id) => {
    try {
        let dashboard = {}
        let approveList = await user.countDocuments({
            approvalStatus: "APPROVED"
        });
        let pendingList = await user.countDocuments({
            approvalStatus: "PENDING"
        });
        let totalUserList = await user.countDocuments({})
        let landList = await landRecords.countDocuments({})
        let applicationApproved = await application.countDocuments({status:"APPROVED"})
        let applicationPending = await application.countDocuments({status:"PENDING"})
        let applicationRejected = await application.countDocuments({status:"REJECTED"})

        dashboard.activeUser = approveList;
        dashboard.pendingUser = pendingList;
        dashboard.totalUser = totalUserList;
        dashboard.landList = landList;
        dashboard.applicationApproved = applicationApproved;
        dashboard.applicationPending = applicationPending;
        dashboard.applicationRejected = applicationRejected
        console.log(dashboard)
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: dashboard
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
UserService.reportGeneration = async (payload) => {
    try {

        let dataValidation = {};
        dataValidation.surveyNo = false;
        dataValidation.accountNumber = false;
        dataValidation.graduateName = false;
        dataValidation.spouseName = false;
        dataValidation.village = false;
        dataValidation.zone = false;
        dataValidation.district = false
        let applicationData = await application.findOne({
            _id: payload.applicationId
        });
        console.log("checking", applicationData.surveyNo)
        let userLandData = await landRecords.findOne({
            surveyNo: applicationData.surveyNo
        });
        console.log("The following is the application data", applicationData);
        console.log("The following is the user land data", userLandData);
        if (applicationData && userLandData) {

            dataValidation.surveyNo = true;
            userLandData.accountNumber.toLowerCase() == applicationData.accountNumber.toLowerCase() ? dataValidation.accountNumber = true : dataValidation.accountNumber = false;
            userLandData.graduateName.toLowerCase() == applicationData.firstName.toLowerCase() ? dataValidation.graduateName = true : dataValidation.graduateName = false;
            userLandData.fatherHusbandSpouseName.toLowerCase() == applicationData.spouseName.toLowerCase() ? dataValidation.spouseName = true : dataValidation.spouseName = false;
            userLandData.villageName.toLowerCase() == applicationData.village.toLowerCase() ? dataValidation.village = true : dataValidation.village = false;
            userLandData.zoneName.toLowerCase() == applicationData.zone.toLowerCase() ? dataValidation.zone = true : dataValidation.zone = false;
            userLandData.districtName.toLowerCase() == applicationData.district.toLowerCase() ? dataValidation.district = true : dataValidation.district = false;
        }
        console.log("123", applicationData.village.toLowerCase())
        console.log("The following is the validation results", dataValidation);
        if (!applicationData || !userLandData) {
            return {
                status: false,
                message: "Records not found",
            }
        }
        return {
            status: true,
            message: "The data has been validated with records",
            data: dataValidation
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}
UserService.createReportBody = async (applicationId) => {
    try {
        let checkReportBody = await reportBodyData.findOne({
            applicationId
        });
        if(checkReportBody) {
            return {
                status: false,
                message: "The application body already exists"
            }
        }
        let applicationData = await application.findOne({
            _id: applicationId
        });
        let branchData = await bankBranch.findOne({
            branchCode: applicationData.bankBranchCode
        })
        let newAllApplications = applicationData;
        let individualSurveyData = [];
        let checkSurveyNumberTotal = applicationData.surveyNo.split(",");
        console.log("123", checkSurveyNumberTotal);
        console.log("Survey Number length", checkSurveyNumberTotal.length);
        if (checkSurveyNumberTotal.length - 1 == '') {
            checkSurveyNumberTotal.splice(checkSurveyNumberTotal.length - 1);
        }
        if(checkSurveyNumberTotal.length <= 1){
            let newSingleSurvey = await application.findOne({ _id: applicationId });
            console.log("The following is the survey Number", newSingleSurvey);
            newSingleSurvey.surveyNo = checkSurveyNumberTotal[0];
            newSingleSurvey._id = new mongoose.Types.ObjectId();
            individualSurveyData.push(newSingleSurvey);
        } else {
            for(let i = 0; i < checkSurveyNumberTotal.length; i++){
                let newSingleSurvey = await application.findOne({ _id: applicationId });
                console.log("The following is the survey Number", newSingleSurvey);
                newSingleSurvey.surveyNo = checkSurveyNumberTotal[i];
                newSingleSurvey._id = new mongoose.Types.ObjectId();
                individualSurveyData.push(newSingleSurvey);
            }
        }
        let reportData = {
            "farmerName": applicationData.firstName && applicationData.lastName ? applicationData.firstName + " " + applicationData.lastName : applicationData.firstName,
            "cifAccountNumber": applicationData.accountNumber ? applicationData.accountNumber : "",
            "branchName": branchData?.branchName + " " + `${(branchData?.branchCode)}`,
            "landDetails": applicationData?.village + ", " + applicationData?.zone + ", " + applicationData?.district + ", " + applicationData?.state,
            "spouseOrFatherName": applicationData?.spouseName,
            "state": applicationData?.state,
            "farmerMobileNumber": applicationData?.mobileNumber,
            "district": applicationData?.district,
            "farmerResidentialAddress": applicationData?.address,
            "subDistrict": applicationData?.zone,
            "mandal": applicationData?.zone,
            "village": applicationData?.village,
            "pinCode": applicationData?.pincode,
            "khasraNumber": applicationData?.surveyNo,
            "khataDetails": applicationData?.khataDetails,
            "plotNo": applicationData?.plotNo ? applicationData.plotNo : "NA",
            "surveyNo": applicationData?.surveyNo,
            "totalLandArea": "NA",
            "landAreaOfFarmer": applicationData?.landArea,
            "bankBranchCode": applicationData?.bankBranchCode,
            "allApplicationData": individualSurveyData,
            "firstName": applicationData.firstName,
            "lastName": applicationData.lastName,
            "gender": applicationData.gender,
            "kccAccountNumber": applicationData.kccAccountNumber,
            "loanReferenceNumber": applicationData.loanReferenceNumber,
            "mortageDetails": applicationData.mortageDetails,
            "verifiedDate": moment.now()
            //"loanReferenceNumber":applicationData?.loanReferenceNumber,
            //"kccAccountNumber":applicationData?.kccAccountNumber
        };
        reportData.applicationId = applicationId;
        console.log("The following is the report data", reportData);
        let applicationCompleteBody = await reportBodyData.create(reportData);
        return {
            status: true,
            message: "Body prepared",
            data: applicationCompleteBody
        }
    } catch (error) {
        console.log("error", error)
    }
}
UserService.getReportBody = async (applicationId) => {
    try {
        if(!applicationId){
            return {
                status: false,
                message: "Please enter ApplicationId"
            }
        }
        let result = await reportBodyData.find({
            applicationId
        })
        if(!result) {
            return {
                status: false,
                message: "Please enter valid ApplicationId"
            }
        }
        return {
            status: true,
            message: "Fetched Report Application Body Successfully",
            data: result
        }
    } catch (error) {
        console.log("error", error)
    }
}
UserService.updateReportBody = async (applicationid, payload) => {
    try {
        // console.log('AppId-->', applicationid)
        let result = await reportBodyData.findOne({
            applicationId: applicationid
        }).lean()
        if(!result) {
            return {
                status: false,
                message: "No Application with that application id exists"
            }
        }
        // console.log("0",result)
        let previousData = {...result || ""};
        previousData['cifAccountNumber'] = payload['cifAccountNumber'] ? payload['cifAccountNumber'] : previousData['cifAccountNumber'];
        previousData['branchName'] = payload['branchName'] ? payload['branchName'] : previousData['branchName'];
        previousData['landDetails'] = payload['landDetails'] ? payload['landDetails'] : previousData['landDetails'];
        previousData['spouseOrFatherName'] = payload['spouseOrFatherName'] ? payload['spouseOrFatherName'] : previousData['spouseOrFatherName'];
        previousData['state'] = payload['state'] ? payload['state'] : previousData['state'];
        previousData['farmerMobileNumber'] = payload['farmerMobileNumber'] ? payload['farmerMobileNumber'] : previousData['farmerMobileNumber'];
        previousData['district'] = payload['district'] ? payload['district'] : previousData['district'];
        previousData['farmerResidentialAddress'] = payload['farmerResidentialAddress'] ? payload['farmerResidentialAddress'] : previousData['farmerResidentialAddress'];
        previousData['subDistrict'] = payload['subDistrict'] ? payload['subDistrict'] : previousData['subDistrict'];
        previousData['mandal'] = payload['mandal'] ? payload['mandal'] : previousData['mandal'];
        previousData['pinCode'] = payload['pinCode'] ? payload['pinCode'] : previousData['pinCode'];
        previousData['khasraNumber'] = payload['khasraNumber'] ? payload['khasraNumber'] : previousData['khasraNumber'];
        previousData['khataDetails'] = payload['khataDetails'] ? payload['khataDetails'] : previousData['khataDetails'];
        previousData['plotNo'] = payload['plotNo'] ? payload['plotNo'] : previousData['plotNo'];
        previousData['surveyNo'] = payload['surveyNo'] ? payload['surveyNo'] : previousData['surveyNo'];
        previousData['totalLandArea'] = payload['totalLandArea'] ? payload['totalLandArea'] : previousData['totalLandArea'];
        previousData['landAreaOfFarmer'] = payload['landAreaOfFarmer'] ? payload['landAreaOfFarmer'] : previousData['landAreaOfFarmer'];
        previousData['bankBranchCode'] = payload['bankBranchCode'] ? payload['bankBranchCode'] : previousData['bankBranchCode'];
        //
        previousData['kccAccountNumber'] = payload['kccAccountNumber'] ? payload['kccAccountNumber'] : previousData['kccAccountNumber'];
        previousData['loanReferenceNumber'] = payload['loanReferenceNumber'] ? payload['loanReferenceNumber'] : previousData['loanReferenceNumber'];
        previousData['gender'] = payload['gender'] ? payload['gender'] : previousData['gender'];
        previousData['firstName'] = payload['firstName'] ? payload['firstName'] : previousData['firstName'];
        previousData['lastName'] = payload['lastName'] ? payload['lastName'] : previousData['lastName'];
        previousData['mortageDetails'] = payload['mortageDetails'] ? payload['mortageDetails'] : previousData['mortageDetails'];
        previousData['allApplicationData'] = payload['allApplicationData'] ? payload['allApplicationData'] : previousData['allApplicationData'];
        //  console.log("1",previousData)
        let _id = result['_id'];
        console.log('_id-->', _id);
        let resultData = await reportBodyData.findByIdAndUpdate(_id, previousData);
        // let response = await reportBodyData.findById(_id);
        return {
            status: true,
            message: "Report body updated",
            data: resultData
        }
    } catch (error) {
        console.log("error", error);
    }
}
UserService.getReportPdf = async (applicationId) => {
    try {
        let applicationData = await application.findOne({
            _id: applicationId
        });
        console.log("The following is the applicationData", applicationData)
        let branchData = await bankBranch.findOne({
            branchCode: applicationData.bankBranchCode
        })
        console.log("The following is the applicationData", applicationData);
        console.log("======================>", branchData);
        // let userLandData = await landRecords.findOne({
        //     surveyNo: applicationData.surveyNo
        // });
        let newAllApplications = applicationData;
        let individualSurveyData = [];
        let checkSurveyNumberTotal = applicationData.surveyNo.split(",");
        console.log("123", checkSurveyNumberTotal)
        if (checkSurveyNumberTotal.length - 1 == '') {
            checkSurveyNumberTotal.splice(checkSurveyNumberTotal.length - 1);
        }
        for(let i = 0; i < checkSurveyNumberTotal.length; ++i){
            let newSingleSurvey = await application.findOne({ _id: applicationId });
            // console.log("The following is applicationSurveyNo", newSingleSurvey.surveyNo);
            // console.log("The following is singleSurvey", checkSurveyNumberTotal[i]);
            newSingleSurvey.surveyNo = checkSurveyNumberTotal[i];
            individualSurveyData.push(newSingleSurvey);
            // console.log("The following is applicationSurveyNo", newSingleSurvey.surveyNo);
        }
        // console.log("----------------------", individualSurveyData);
        let newUploadData = await reportBodyData.findOne({ applicationId: applicationId }).lean();
        console.log("The following is the newUploadData ---> ", newUploadData)
        // let reportData = {
        //     "farmerName": applicationData.firstName && applicationData.lastName ? applicationData.firstName + " " + applicationData.lastName : "",
        //     "cifAccountNumber": applicationData?.accountNumber,
        //     "branchName": branchData?.branchName + " " + `${(branchData?.branchCode)}`,
        //     "landDetails": applicationData?.village + ", " + applicationData?.zone + ", " + applicationData?.district + ", " + applicationData?.state,
        //     "spouseOrFatherName": applicationData?.spouseName,
        //     "state": applicationData?.state,
        //     "farmerMobileNumber": applicationData?.mobileNumber,
        //     "district": applicationData?.district,
        //     "farmerResidentialAddress": applicationData?.address,
        //     "subDistrict": applicationData?.zone,
        //     "mandal": applicationData?.zone,
        //     "village": applicationData?.village,
        //     "pinCode": applicationData?.pincode,
        //     "khasraNumber": applicationData?.surveyNo,
        //     "khataDetails": applicationData?.khataDetails,
        //     "plotNo": applicationData?.plotNo,
        //     "surveyNo": applicationData?.surveyNo,
        //     "totalLandArea": "NA",
        //     "landAreaOfFarmer": applicationData?.landArea,
        //     "bankBranchCode": applicationData?.bankBranchCode,
        //     "allApplicationData": individualSurveyData,
        //     //"loanReferenceNumber":applicationData?.loanReferenceNumber,
        //     //"kccAccountNumber":applicationData?.kccAccountNumber
        // };
        let reportData = newUploadData;
        reportData.applicationId = applicationId;
        reportData.allApplicationData.forEach(item => {
            reportData.spouseOrFatherName = item.spouseName;
            reportData.pinCode = item.pincode;
            const formatYmd = date => date.toISOString().slice(0, 10);
            item.reportGeneratedDate = `${formatYmd(new Date())} - ${(new Date()).getHours()}:${(new Date()).getMinutes()}`;
            // console.log("The following is the item", item);
            if(item.spouseNameValidation && item.spouseNameValidation == true){
                console.log("Spouse Name Validation", item.spouseNameValidation);
                item.spouseName = `<span style="color: red; font-weight: bold">${item.spouseName}</span>`
            }

            if(item.firstNameValidation == true || item.lastNameValidation == true){
                item.farmerName = `<span style="color: red; font-weight: bold">${item.firstName} ${item.lastName}</span>`
            }
            if(item.landAreaValidation == true && item.landArea != ''){
                item.landArea = `<span style="color: red; font-weight: bold">${item.landArea}</span>`
            }
            if(item.surveyNumberValidation == true && item.surveyNo != '') {
                item.surveyNo = `<span style="color: red; font-weight: bold">${item.surveyNo}</span>`
            }
            if(item.khataNumberValidation == true && item.khataDetails != '') {
                item.khataDetails = `<span style="color: red; font-weight: bold">${item.khataDetails}</span>`
            }
            if(item.villageValidation == true && item.village != '') {
                item.village = `<span style="color: red; font-weight: bold">${item.village}</span>`
            }
            if(item.mortageValidation == true && item.mortageDetails != '') {
                item.mortageDetails = `<span style="color: red; font-weight: bold">${item.mortageDetails}</span>`
            }
            console.log("The following is the item", item);
        })
        const filePath = path.join(__dirname, '../reportTemplate/agrotech.html');
        let readFile = fs.readFileSync(filePath, 'utf-8').toString();
        // let uniqueSuffix = "report-" + reportData?.applicationId + "-" + Date.now() + '.pdf';
        let uniqueSuffix = reportData.cifAccountNumber + "_" + reportData.bankBranchCode + ".pdf";
        let fileDestination = `./../../public/uploads/${uniqueSuffix}`;
        let html = Handlebars.compile(readFile)({ reportData });
        console.log("Starting Puppeteer");
        let browser = await puppeteer.launch({
            // headless: false,
            executablePath: process.env.CHROMIUM_PATH,
            args: [
                '--no-sandbox',
                // '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                // '--disable-accelerated-2d-canvas',
                // '--no-first-run',
                // '--no-zygote',
                // '--single-process', // <- this one doesn't works in Windows
                '--disable-gpu'
            ],
            javaScriptEnabled: true,
        });
        console.log("Creating new page");
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0);
        page.setDefaultTimeout(30000000);
        page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36 WAIT_UNTIL=load"
        );
        console.log("Getting HTML file");
        await page.setContent(html, {
            timeout: 0,
            waitUntil: "networkidle0",
        });
        console.log("PDF Creation in process");
        const pdf = await page.pdf({
            format: "A4",
            printBackground: false,
            margin: {
                top: "0",
                right: "0",
                bottom: "0",
                left: "0",
            },
        });
        const stream = getStream(pdf);
        stream.pipe(fs.createWriteStream(path.join(__dirname + fileDestination)));
        let newFileDestination = "reports/";
        let uniqueFileName = newFileDestination + uniqueSuffix;
        // setTimeout(() => {
        //     const s3 = new AWS.S3({
        //         accessKeyId: process.env.AWS_ACCESS_KEY,
        //         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        //     });
        //     const params = {
        //         Bucket: 'pre-prod-agrotech',
        //         Key: uniqueFileName,
        //         Body: readFile
        //     }
        //
        //     const s3UploadData = new Promise((resolve, reject) => {
        //         s3.upload(params, (err, data) => {
        //             if (err) {
        //                 throw err;
        //             }
        //             console.log(`File uploaded successfully. ${data.Location}`);
        //             resolve(data.Location);
        //         });
        //     });
        //     let filePathS3Data = await s3UploadData;
        //
        //     filePathS3Data.on('end', () => {
        //         console.log("File uploaded successfully");
        //         fs.unlinkSync(path.join(__dirname + fileDestination));
        //     })
        // }, 1000);
        setTimeout(() => {
            console.log(path.join(__dirname, fileDestination))
            let params = {
                localFile: path.join(__dirname, fileDestination),
                s3Params: {
                    Bucket: process.env.bucketName,
                    Key: 'reports' + "/" + uniqueSuffix,
                    ACL: 'public-read'
                }
            };

            let uploader = client.uploadFile(params);

            uploader.on('end', function () {
                console.log("Uploaded to S3");
                fs.unlinkSync(path.join(__dirname, fileDestination));
            });
        }, 1000);
        // fs.unlinkSync(fileDestination);
        await browser.close();
        // fs.unlinkSync(fileDestination);
        await application.findByIdAndUpdate(applicationId, {
            isReportCreated: true,
            reportGeneratedDate: new Date()
        });
        return {
            code: 200,
            message: "Report Generated Successfully.",
            data: {
                ...reportData
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}

UserService.createBulkAdmin = async (payload) => {
    try {  
        payload.password = "Test@123"
        payload.forEach((element) => {
            element.emailId = `${element.branchCode}_DM@agrotechindia.com`
            element.name = element.branchName;
            element.password = genHash(payload.password);
            element.roleId = "ROLE_9";
            element.branchCode = element.branchCode;
            element.status = "APPROVED";
        });
        let bulkData = await admin.insertMany(payload);
        return {
            code: 200,
            message: "Bulk Admin Created Successfully.",    
            data: bulkData
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}
UserService.getWordReport = async (applicationId) => {
    try
    {
    let applicationData = await application.findOne({
        _id: applicationId
    });
    let branchData = await bankBranch.findOne({
        branchCode: applicationData.bankBranchCode
    })
   
    // let userLandData = await landRecords.findOne({
    //     surveyNo: applicationData.surveyNo
    // });
    
    let individualSurveyData = [];
    let checkSurveyNumberTotal = applicationData.surveyNo.split(",");
    console.log("123", checkSurveyNumberTotal)
    if (checkSurveyNumberTotal.length - 1 == '') {
        checkSurveyNumberTotal.splice(checkSurveyNumberTotal.length - 1);
    }
    for(let i = 0; i < checkSurveyNumberTotal.length; ++i){
        let newSingleSurvey = await application.findOne({ _id: applicationId });
        // console.log("The following is applicationSurveyNo", newSingleSurvey.surveyNo);
        // console.log("The following is singleSurvey", checkSurveyNumberTotal[i]);
        newSingleSurvey.surveyNo = checkSurveyNumberTotal[i];
        individualSurveyData.push(newSingleSurvey);
        // console.log("The following is applicationSurveyNo", newSingleSurvey.surveyNo);
    }
    let reportData = {
        "farmerName": applicationData.firstName && applicationData.lastName ? applicationData.firstName + " " + applicationData.lastName : "",
        "cifAccountNumber": applicationData?.accountNumber,
        "branchName": branchData?.branchName + " " + `${(branchData?.branchCode)}`,
        "landDetails": applicationData?.village + ", " + applicationData?.zone + ", " + applicationData?.district + ", " + applicationData?.state,
        "spouseOrFatherName": applicationData?.spouseName,
        "state": applicationData?.state,
        "farmerMobileNumber": applicationData?.mobileNumber,
        "district": applicationData?.district,
        "farmerResidentialAddress": applicationData?.address,
        "subDistrict": applicationData?.zone,
        "mandal": applicationData?.zone,
        "village": applicationData?.village,
        "pinCode": applicationData?.pincode,
        "khasraNumber": applicationData?.surveyNo,
        "khataDetails": applicationData?.khataDetails,
        "plotNo": applicationData?.plotNo,
        "surveyNo": applicationData?.surveyNo,
        "totalLandArea": "NA",
        "landAreaOfFarmer": applicationData?.landArea,
        "bankBranchCode": applicationData?.bankBranchCode,
        "allApplicationData": individualSurveyData,
        //"loanReferenceNumber":applicationData?.loanReferenceNumber,
        //"kccAccountNumber":applicationData?.kccAccountNumber
    };
    
        reportData['applicationId'] = applicationId;
        
        const filePath = path.join(__dirname, '../reportTemplate/agrotech_report.html');
        let readFile = fs.readFileSync(filePath, 'utf-8').toString();
        let uniqueSuffix = "report-" + reportData?.applicationId + "-" + Date.now() + '.docx';
        let fileDestination = `./../../public/uploads/${uniqueSuffix}`;
        let fileName = path.join(__dirname + fileDestination);
       // var html = readFile;     
       let html = Handlebars.compile(readFile)({ reportData });
        var docx =await  HTMLtoDOCX(html);
        const usedData = new Promise((resolve, reject) => {
                        fs.writeFile(fileName,docx, function ( err){
                            if (err) return console.log(err);
                            console.log('done');
                            resolve(fileName)
                        });
        });
        let filePathData = await usedData;
        const s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });
        
            // Read content from the file
            const fileContent = fs.readFileSync(filePathData);
            const pathData = 'WordReport/';  // folder name
            const name = 'Report_' + Date.now() + '.docx';
            let uniqueFileName = pathData + name;
            // Setting up S3 upload parameters
            const params = {
                Bucket: 'pre-prod-agrotech',
                Key: uniqueFileName, // File name you want to save as in S3
                Body: fileContent
            };
        

            const s3UploadData = new Promise((resolve, reject) => {
                s3.upload(params, function(err, data) {
                    if (err) {
                        throw err;
                    }
                    console.log(`File uploaded successfully. ${data.Location}`);
                    resolve(data.Location);
                });
            });
            // Uploading files to the bucket            
            let filePathS3Data = await s3UploadData;
            //  Unlink a file
            fs.unlinkSync(filePathData);
      
       return {
            code: 200,
            message: "Word Report Generated Successfully.",
            data: {url: filePathS3Data}
       }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}
UserService.downloadReport = async (applicationId) => {
    try {
        console.log("Hi",applicationId)
        let url =[];
        for(let applications of applicationId){
            let applicationData = await application.findOne({
                _id: applications,
                reportApprovalStatus:"APPROVED"
            });
            if(applicationData){
                url.push(applicationData.generatedReportUrl)
            }
           
        }
        
     if(!!url.length){
        return {
            code: 200,
            message: "fetched successfully",
            data: url
       }
     }else{
        return {
            code: 400,
            message: "Invalid applicationId or report status is not approved"
       }
     }
      
      
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}
UserService.sessionLoginChange = async ( payload) => {
    try {
       
        let id =payload.id
        if(id.length==0){
            return {
                status: false,
                message: `Please Select User`
            }
        }
        let userId
        let notUpdatedUserId =[]
        for (let i =0;i<id.length;i++) {
            userId=id[i]
            let find = await admin.findOne({_id:userId},{roleId:1})
           // console.log(find)
            if(find.roleId=="ROLE_2"  || find.roleId =="ROLE_5"){
                
                notUpdatedUserId.push(userId)
            }else{
                
                if(payload.sessionLogin== true){
                   await admin.findByIdAndUpdate(userId, {
                    sessionLogin: payload.sessionLogin
                });
               
                 }
                 if(payload.sessionLogin== false){
                    
                    await admin.findByIdAndUpdate(userId, {
                        sessionLogin: payload.sessionLogin
                    });
                } 
            } 
        }
        return {
            status: true,
            message: `SessionLogin Status Updated Successfully`
        }
    } catch (err) {
        console.log("error", err);
        throw new Error(JSON.stringify(err))
    }
}
module.exports = UserService;