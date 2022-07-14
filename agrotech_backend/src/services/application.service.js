const {
    user,
    permission,
    addRole,
    landRecords,
    application,
    counter,
    agrotechApplication,
    bankBranch,
    bulkUploadReport
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
const {
    DATA_STATUS,
    SEARCH_TYPE,
    SEARCH_HEADERS
} = require("../constants");
const emailService = require('../utils/mailService');
const userService = require('./user.service');
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
const _ = require('underscore');
const axios =require('axios')
const moment = require('moment-timezone');
const { ThirdPartyServices } = require("../externalServices/thirdParties");

async function getApplicationId() {
    let applicationId = '';
    let counterObj = await counter.findOne({
        name: "Application"
    });
    if (!counterObj) {
        let newCounter = new counter({
            name: "Application",
            seq: 2
        });
        applicationId = "APP01";
        await newCounter.save();
    }
    applicationId = counterObj.seq < 10 ? `APP0${counterObj.seq}` : `APP${counterObj.seq}`;
    counterObj.seq = counterObj.seq + 1;
    await counterObj.save();
    return applicationId;
}

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

let uniqueAgrotechId = async (branchId, applicationData) => {
    let uniqueId, prefix;
    let counter = await ApplicationService.getCount();
    console.log("Count in recursive", applicationData)
    // count = count + 1;
    uniqueId = `AGRO-${branchId}-` + applicationData;
    let checkIfUniqueIdExists = await ApplicationService.getAgroApplicationById(uniqueId);
    if (checkIfUniqueIdExists && checkIfUniqueIdExists.data) {
        console.log("repeat", uniqueId)
        return await uniqueAgrotechId(applicationData)
    } else {
        console.log("Fixed", uniqueId)
        return uniqueId;
    }
}

class ApplicationService {}
ApplicationService.createApplication = async (payload) => {
    try {
        if (!payload.loanReferenceNumber) {
            return {
                status: false,
                message: "Please fill necessary fields"
            }
        }
        console.log(payload.bankBranchCode)
        let checkUserExist = await application.findOne({
            accountNumber: payload.accountNumber
        })
        if (checkUserExist) {
            return {
                status: false,
                message: "CIF Number Already Exists"
            }
        } else {
            let applicationCount = await application.countDocuments({bankBranchCode:payload.bankBranchCode})
            let branchApplicationCount = await bankBranch.findOne({branchCode:payload.bankBranchCode},{numberOfApplications:1})
            if(!branchApplicationCount){
                return {
                    status: false,
                    message: "BranchCode Not Exist"
                }
            }
            //if(applicationCount<branchApplicationCount.numberOfApplications){
                payload.applicationId = await getApplicationId();
                let data = await application.create(payload);
                let checkSurveyNumberTotal = payload.surveyNo.split(",");
                console.log("123", checkSurveyNumberTotal)
                if (checkSurveyNumberTotal.length - 1 == '') {
                    checkSurveyNumberTotal.splice(checkSurveyNumberTotal.length - 1);
                }
                let applicationDetail = {
                    ...payload || ""
                };
                for (const applicationData of checkSurveyNumberTotal) {
                    console.log("The following is applicationData", applicationData);
                    applicationDetail.surveyNo = applicationData;
                    let applicationCount = await agrotechApplication.find({
                        bankBranchCode: payload.bankBranchCode
                    }).countDocuments();
                    applicationDetail.applicationId = await uniqueAgrotechId(payload.bankBranchCode, applicationData);
                    console.log("The following is the application detail", applicationDetail);
                    let finalData = await agrotechApplication.create(applicationDetail);
                    console.log("The following transposed application is uploaded", finalData);
                }
                return {
                    status: true,
                    message: "Application Created Successfully",
                    data: data
                }
            // }else{
            //     return{
            //         status:false,
            //         message:"The limit for the application has reached, please contact Agrotech team."
            //     }
            // }
           
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}

ApplicationService.getCount = async (branchId) => {
    try {
        let count = await application.findOne({
            bankBranchCode: branchId
        }).countDocuments();
        return {
            status: true,
            data: count
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}

ApplicationService.editApplication = async (payload, id) => {
    try {
        console.log("payload", payload, id);
        let checkUserExist = await application.findOne({
            _id: id
        }).lean()
        if (!checkUserExist) {
            return {
                status: false,
                message: "Application Not Exists"
            }
        } else {
            let previousData = {...checkUserExist || ""};
            //let previousData = {...payload || ""};      
           // console.log("payload11", previousData,checkUserExist, id);
            previousData['updatedAt'] = moment().utcOffset("+05:30").format("YYYY-MM-DD hh:mm A");
            let updateData = moment().utcOffset("+05:30").format("DD/MM/YYYY hh:mm A");
            previousData['reportApprovalStatus'] = payload['reportApprovalStatus'];
            //
            let accountNumber = previousData['accountNumber'];
            //
            previousData['accountNumber'] = payload['accountNumber'] ? payload['accountNumber'] : previousData['accountNumber'];
            previousData['bankBranchCode'] = payload['bankBranchCode'] ? payload['bankBranchCode'] : previousData['bankBranchCode'];
            previousData['firstName'] = payload['firstName'] ? payload['firstName'] : previousData['firstName'];
            previousData['lastName'] = payload['lastName'] ? payload['lastName'] : previousData['lastName'];
            previousData['address'] = payload['address'] ? payload['address'] : previousData['address'];
            previousData['spouseName'] = payload['spouseName'] ? payload['spouseName'] : previousData['spouseName'];
            previousData['mobileNumber'] = payload['mobileNumber'] ? payload['mobileNumber'] : previousData['mobileNumber'];
            previousData['gender'] = payload['gender'] ? payload['gender'] : previousData['gender'];
            previousData['loanReferenceNumber'] = payload['loanReferenceNumber'] ? payload['loanReferenceNumber'] : previousData['loanReferenceNumber'];
            previousData['kccAccountNumber'] = payload['kccAccountNumber'] ? payload['kccAccountNumber'] : previousData['kccAccountNumber'];
            previousData['surveyNo'] = payload['surveyNo'] ? payload['surveyNo'] : previousData['surveyNo'];
            previousData['khataDetails'] = payload['khataDetails'] ? payload['khataDetails'] : previousData['khataDetails'];
            previousData['pincode'] = payload['pincode'] ? payload['pincode'] : previousData['pincode'];
            previousData['village'] = payload['village'] ? payload['village'] : previousData['village'];
            previousData['zone'] = payload['zone'] ? payload['zone'] : previousData['zone'];
            previousData['district'] = payload['district'] ? payload['district'] : previousData['district'];
            previousData['state'] = payload['state'] ? payload['state'] : previousData['state'];
            previousData['landArea'] = payload['landArea'] ? payload['landArea'] : previousData['landArea'];
            previousData['mortageDetails'] = payload['mortageDetails'] ? payload['mortageDetails'] : previousData['mortageDetails'];
            previousData['plotNo'] = payload['plotNo'] ? payload['plotNo'] : previousData['plotNo'];
            //console.log("payload112", previousData,checkUserExist, id);
            await application.findByIdAndUpdate(id, previousData);           
            await agrotechApplication.updateMany({accountNumber:accountNumber},{$set:{reportApprovalStatus: payload['reportApprovalStatus'], updatedAt: updateData}})           
            let result = await application.findById(id)
            return {
                status: true,
                message: "Application Updated Successfully",
                data: result
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.deleteApplication = async (id) => {
    try {
        let Application = await application.findOne({
            _id: id
        });
        if (!Application) {
            return {
                status: false,
                message: "Application not found"
            };
        } else {
            await application.deleteOne({
                _id: id
            });
            await agrotechApplication.deleteMany({accountNumber:Application.accountNumber})
            return {
                status: true,
                message: "Application Deleted Successfully"
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.deleteApplicationByBulkUploadId = async (bulkUploadId) => {
    try {
        let Application = await application.find({
            bulkUploadId: bulkUploadId
        });
        if (Application.length==0) {
            return {
                status: false,
                message: "Application not found"
            };
        } else {
            await application.deleteMany({
                bulkUploadId:bulkUploadId
            });
            await bulkUploadReport.deleteOne({
                bulkUploadId:bulkUploadId
            })
            return {
                status: true,
                message: "Application Deleted Successfully"
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.getAllApplications = async (query, limit, page) => {
    try {
        console.log("Inside get all applications");
        let applicationDetail, totalCount;
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
                console.log("reverting")
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
            if (query.gender) {
                queryObj.gender = {
                    $regex: query.gender,
                    $options: 'i'
                }
            }
            if (query.isReportCreated) {
                console.log("revert")
                queryObj.isReportCreated = query.isReportCreated;
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
            console.log("Check", queryObj,limit, sort)
            if (sort) {
                console.log("!", sort)
                totalCount = await application.find(queryObj).countDocuments();
                applicationDetail = await application.find(queryObj)
                    .skip(parseInt(limit * (page - 1)))
                    .limit(limit)
                    .sort(sort);

                if (!applicationDetail) {
                    return {
                        status: false,
                        message: "Application not found."
                    }
                }
                return {
                    status: true,
                    message: "Data fetched successfully",
                    data: pagingData(applicationDetail, page, limit, totalCount)
                }
            } else if (limit == 0) {
                console.log("HII")
                totalCount = await application.find(queryObj).countDocuments();
                applicationDetail = await application.find(queryObj)
                    .skip()
                    .limit()
                    .sort({
                        'createdAt': -1
                    });
                if (!applicationDetail) {
                    return {
                        status: false,
                        message: "Application not found."
                    }
                }
                return {
                    status: true,
                    message: "Data fetched successfully",
                    data: pagingData(applicationDetail, page, limit, totalCount)
                }
            } else {
                console.log("!!!revertts",queryObj)
                totalCount = await application.find(queryObj).countDocuments();
                applicationDetail = await application.find(queryObj)
                    .skip(parseInt(limit * (page - 1)))
                    .limit(limit)
                    .sort({
                        'createdAt': -1
                    });
                 console.log("response",applicationDetail)
                if (!applicationDetail) {
                    return {
                        status: false,
                        message: "Application not found."
                    }
                }
                return {
                    status: true,
                    message: "Data fetched successfully",
                    data: pagingData(applicationDetail, page, limit, totalCount)
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
                }else if(query.headerType == SEARCH_HEADERS.COMMENTS){
                    queryObj.$or.push({
                        isNewComment:true
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
            if (query.isReportCreated) {
                queryObj.isReportCreated = query.isReportCreated;
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
                totalCount = await application.find(queryObj).countDocuments();
                applicationDetail = await application.find(queryObj)
                    .skip(parseInt(limit * (page - 1)))
                    .limit(limit)
                    .sort(sort);

                if (!applicationDetail) {
                    return {
                        status: false,
                        message: "Application not found."
                    }
                }
                return {
                    status: true,
                    message: "Data fetched successfully",
                    data: pagingData(applicationDetail, page, limit, totalCount)
                }
            } else if (limit == 0) {
                totalCount = await application.find(queryObj).countDocuments();
                applicationDetail = await application.find(queryObj)
                    .skip()
                    .limit()
                    .sort({
                        'createdAt': -1
                    });

                if (!applicationDetail) {
                    return {
                        status: false,
                        message: "Application not found."
                    }
                }
                return {
                    status: true,
                    message: "Data fetched successfully",
                    data: pagingData(applicationDetail, page, limit, totalCount)
                }
            } else {
                console.log("!!")
                totalCount = await application.find(queryObj).countDocuments();
                applicationDetail = await application.find(queryObj)
                    .skip(parseInt(limit * (page - 1)))
                    .limit(limit)
                    .sort({
                        'createdAt': -1
                    });

                if (!applicationDetail) {
                    return {
                        status: false,
                        message: "Application not found."
                    }
                }
                return {
                    status: true,
                    message: "Data fetched successfully",
                    data: pagingData(applicationDetail, page, limit, totalCount)
                }
            }
        }
        return {
            status: true,
            message: "Data fetched successfully",
            data: pagingData(applicationDetail, page, limit, totalCount)
        }

        ///
        
    } catch(error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}

ApplicationService.getApplicationById = async (id) => {
    try {
       
        if (!id) {
            return {
                status: false,
                message: "Please enter application ID"
            };
        }
        let land = await application.findOne({
            _id: id
        }).lean({ virtuals: true })
       
        if (!land) {
            return {
                status: false,
                message: "Application not found"
            };
        } else {
        let branchDetail = await bankBranch.findOne({branchCode:land.bankBranchCode})
        let result ={
            applicationDetails:land,
            branchDetails:branchDetail
        }
       // console.log("123",result)
        let reportBody = await userService.createReportBody(id);
        //console.log("The following is the", reportBody)
       
        let data = await ThirdPartyServices.getReportUrlStatus({
            "url": land.generatedReportUrl 
        });
        //console.log("768",data)
        if(data==200){
            result.applicationDetails.generatedReportUrlStatus = true
        }else{
            result.applicationDetails.generatedReportUrlStatus = false
        }
       
           return {
            status: true,
            message: "Data Fetched Successfully",
            data: result
           }

        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}

ApplicationService.getAgroApplicationById = async (id) => {
    try {
        if (!id) {
            return {
                status: false,
                message: "Please enter application ID"
            };
        }
        let land = await agrotechApplication.findOne({
            applicationId: id
        });
        if (!land) {
            return {
                status: false,
                message: "Application not found"
            };
        }
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: land
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}

ApplicationService.getApplicationByBulkId = async (bulkId) => {
    try {
        if (!bulkId) {
            return {
                status: false,
                message: "Please pass bulk Application Id"
            };
        }
        let result = await application.find({
            bulkUploadId: bulkId
        })
        if (!result) {
            return {
                status: false,
                message: "Application not found"
            };
        }
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: result
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}

ApplicationService.getApplicationCommentById = async (id) => {
    try {
        if (!id) {
            return {
                status: false,
                message: "Please enter application ID"
            };
        }
        let land = await application.findOne({
            _id: id
        }, {
            applicationComment: 1
        });
        if (!land) {
            return {
                status: false,
                message: "Application not found"
            };
        }
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: land
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.getApplicationRejectCommentById = async (id) => {
    try {
        if (!id) {
            return {
                status: false,
                message: "Please enter application ID"
            };
        }
        let land = await application.findOne({
            _id: id
        }, {
            rejectApplication: 1
        });
        if (!land) {
            return {
                status: false,
                message: "Application not found"
            };
        }
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: land
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.getApplicationByBranchCode = async (branchCode, status) => {
    try {
        
        if (!branchCode) {
            return {
                status: false,
                message: "Branch code is required."
            };
        }
        let land = await application.find({
            bankBranchCode: branchCode,
            status : {
                $regex: status,
                $options: 'i'
            }
        });
        if (!land) {
            return {
                status: false,
                message: "Application not found"
            };
        }
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: land
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
// ApplicationService.approveStatus = async (payload, status, id) => {
//     try {
        
//         let checkUserExist = await application.findOne({
//             _id: id
//         });

//         if (!checkUserExist) {
//             return {
//                 status: false,
//                 message: "Application does not exist"
//             }
//         } else {

//             await application.findByIdAndUpdate(applicationId, {
//                 status: status
//             });
//             return {
//                 status: true,
//                 message: `${status} Successfully`
//             }
            
//        }
   


//     } catch (error) {
//         console.log("error", error);
//         throw new Error(JSON.stringify(error))
//     }
// }
ApplicationService.approveStatus = async (payload, status, id) => {
    try {
        let id =payload.id
        let applicationId
        for (let i =0;i<id.length;i++) {
         applicationId=id[i]
         let date;
         if(status=="APPROVED"){
             console.log("clear")
           date=moment().tz('Asia/kolkata').format('YYYY-MM-DD')
           await application.findByIdAndUpdate(applicationId, {
            status: status,
            applicationApprovedDate:date

        });
        let find = await application.findOne({_id:applicationId})
        let Update = await agrotechApplication.updateMany({accountNumber:find.accountNumber},{ $set: {  status: status,applicationApprovedDate:date }})
         }
         if(status=="REJECTED"){
             console.log("All")
            date=moment().tz('Asia/kolkata').format('YYYY-MM-DD')
            await application.findByIdAndUpdate(applicationId, {
                status: status,
                applicationRejectedDate:date
            });
            let find = await application.findOne({_id:applicationId})
            let Update = await agrotechApplication.updateMany({accountNumber:find.accountNumber},{ $set: {  status: status,applicationApprovedDate:date }})
         }
         if(status=="PENDING"){
         console.log("lite")
         await application.findByIdAndUpdate(applicationId, {
            status: status
        });
        let find = await application.findOne({_id:applicationId})
        let Update = await agrotechApplication.updateMany({accountNumber:find.accountNumber},{ $set: {  status: status}})
    }
  }
    return {
        status: true,
        message: `${status} Successfully`
    }

    

    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.bulkApproveApplications = async (payload, status) => {
    try {   
        let data 
        if(payload.branchCode){
            data = await application.find({status:"PENDING",bankBranchCode:payload.branchCode}) 
            if(data.length>0){
               let date=moment().tz('Asia/kolkata').format('YYYY-MM-DD')
                if(status=="APPROVED"){
                    
                    await application.updateMany({status:"PENDING",bankBranchCode:payload.branchCode},{ $set: {  status: status,applicationApprovedDate:date }})
                    return {
                        status: true,
                        message: `${status} Successfully`
                        
                    }
                }
                
                    await application.updateMany({status:"PENDING",bankBranchCode:payload.branchCode},{ $set: {  status: status,applicationRejectedDate:date }})
               
                    return {
                        status: true,
                        message: `${status} Successfully`
                        
                    }
            }
                return {
                    status: false,
                    message: "Application Pending list is empty"
                    
                }
        }else {
            data = await application.find({status:"PENDING"}) 
            if(data.length>0){
                let date=moment().tz('Asia/kolkata').format('YYYY-MM-DD')
                if(status=="APPROVED"){
                    let applications = await application.updateMany({status:"PENDING"},{ $set: {  status: status,applicationApprovedDate:date }})
                    return {
                        status: true,
                        message: `${status} Successfully`
                        
                    } 
                }
                let applications = await application.updateMany({status:"PENDING"},{ $set: {  status: status,applicationRejectedDate:date }})
            return {
                status: true,
                message: `${status} Successfully`
                
            } 
        }
                return {
                    status: false,
                    message: "Application pending list is empty"
                    
                }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}

ApplicationService.getApplicationStatusCount = async (branchCode, user) => {
    try {
        console.log(branchCode, user)
        let res=[]
        let totalCount
        if (!branchCode) {
            //console.log("HII branch")
            let lands = await bankBranch.aggregate([
                    {
                        $group: {
                            _id: '',
                             'Total': {$sum:{ '$toInt': '$numberOfApplications'}}
                        }
                    },
                    { $sort : { _id : 1 } }
                 ])
                 console.log(lands)
                 console.log(lands[0].Total)
            let expected = {
                name:"EXPECTED",
                value:lands[0].Total
            }
            let applications = await application.countDocuments({})
            
            let applicationApproved = await application.countDocuments({status:"APPROVED"})
            let approvedApplicationPercentage = ((applicationApproved/applications)*100).toFixed(2);
            let approve = {
                name:"APPROVED",
                value:applicationApproved,
                percentage: `${approvedApplicationPercentage}%`
            }
            let applicationPending = await application.countDocuments({status:"PENDING"})
            let pendingApplicationPercentage = ((applicationPending/applications)*100).toFixed(2);
            let Pending = {
                name:"PENDING",
                value:applicationPending,
                percentage: `${pendingApplicationPercentage}%`
            }
           
            let applicationRejected = await application.countDocuments({status:"REJECTED"})
            let rejectedPercentage = ((applicationRejected/applications)*100).toFixed(2);

            let Rejected = {
                name:"REJECTED",
                value:applicationRejected,
                percentage : `${rejectedPercentage}%`
            }
            let recievedApplication = (applicationPending+applicationApproved)
            let recievedApplicationPercentage = ((recievedApplication/lands[0].Total)*100).toFixed(2);
            let Total = {
                name:"TOTAL",
                value:applications,
                percentage:`${recievedApplicationPercentage}%`
            }
             let recieved = {
                name:"RECEIVED",
                value:recievedApplication,
                percentage:`${recievedApplicationPercentage}%`
            }
            
            if (approvedApplicationPercentage == 0 ){
                approve.color = "RED";
            } else if (approvedApplicationPercentage <= 25 ){
                approve.color = "ORANGE";
            } else if( approvedApplicationPercentage <= 50 ){
                approve.color = "YELLOW";
            } else if ( approvedApplicationPercentage <= 75 ){
                approve.color = "LIGHT GREEN";
            } else if( approvedApplicationPercentage <= 100 ){
                approve.color = "GREEN";
            }
            
            if (pendingApplicationPercentage == 0 ){
                Pending.color = "GREEN";
            } else if (pendingApplicationPercentage <= 25 ){
                Pending.color = "LIGHT GREEN";
            } else if( pendingApplicationPercentage <= 50 ){
                Pending.color = "YELLOW";
            } else if ( pendingApplicationPercentage <= 75 ){
                Pending.color = "ORANGE";
            } else if( pendingApplicationPercentage <= 100 ){
                Pending.color = "RED";
            }

            if (rejectedPercentage == 0 ){
                Rejected.color = "RED";
            } else if (rejectedPercentage <= 25 ){
                Rejected.color = "RED";
            } else if( rejectedPercentage <= 50 ){
                Rejected.color = "RED";
            } else if ( rejectedPercentage <= 75 ){
                Rejected.color = "RED";
            } else if( rejectedPercentage <= 100 ){
                Rejected.color = "RED";
            }
            if (recievedApplicationPercentage == 0 ){
                recieved.color = "ORANGE";
                Total.color = "ORANGE";
            } else if (recievedApplicationPercentage <= 25 ){
                recieved.color = "ORANGE";
                Total.color = "ORANGE";
            } else if( recievedApplicationPercentage <= 50 ){
                recieved.color = "ORANGE";
                Total.color = "ORANGE";
            } else if ( recievedApplicationPercentage <= 75 ){
                recieved.color = "ORANGE";
                Total.color = "ORANGE";
            } else if( recievedApplicationPercentage <= 100 ){
                recieved.color = "ORANGE";
                Total.color = "ORANGE";
            }
            res.push(expected)
            res.push(recieved)
            res.push(Pending)
            res.push(approve)
            res.push(Rejected)
            res.push(Total)
        } else {
             console.log("HII branch")
            let applicationCount = await bankBranch.findOne({branchCode:branchCode},{numberOfApplications:1})
            let count = parseInt(applicationCount.numberOfApplications)
            let applications = await application.countDocuments({ bankBranchCode: branchCode})
            if(applications==0){
                let expected = {
                    name: "EXPECTED",
                    value: count
                }
                let Total = {
                    name:"TOTAL",
                    value:applications,
                    percentage: `0%`
                }
                let approve = {
                    name:"APPROVED",
                    value:0,
                    color : "RED",
                    percentage: `0%`
                }
                let Pending = {
                    name:"PENDING",
                    value:0,
                    color : "GREEN",
                    percentage: `0%`
                }
                let Rejected = {
                    name:"REJECTED",
                    value:0,
                    color : "RED",
                    percentage : `0%`
                }
                res.push(Rejected)
                res.push(Pending)
                res.push(approve)
                res.push(Total)
               // res.push(expected)
                return {
                    status: true,
                    message: "Get Count Successfully",
                    data: res
                };
            }
            let expected = {
                name: "EXPECTED",
                value: count
            }
            let totalPercentage = ((applications/count)*100).toFixed(2);
            let Total = {
                name:"TOTAL",
                value:applications,
                percentage: `${totalPercentage}%`
            }
            let applicationApproved = await application.countDocuments({status:"APPROVED", bankBranchCode: branchCode});
            console.log(applications,applicationApproved)
            let approvedPercentage = ((applicationApproved/parseInt(applications))*100).toFixed(2);
            let approve = {
                name:"APPROVED",
                value:applicationApproved,
                percentage: `${approvedPercentage}%`
            }
            let applicationPending = await application.countDocuments({status:"PENDING", bankBranchCode: branchCode});
            let pendingPercentage = ((applicationPending/applications)*100).toFixed(2);
            let Pending = {
                name:"PENDING",
                value:applicationPending,
                percentage: `${pendingPercentage}%`
            }
            let applicationRejected = await application.countDocuments({status:"REJECTED", bankBranchCode: branchCode});
            let rejectedPercentage = ((applicationRejected/applications)*100).toFixed(2);
            let Rejected = {
                name:"REJECTED",
                value:applicationRejected,
                percentage : `${rejectedPercentage}%`
            }
            let recievedApplication = applicationApproved+applicationPending
            let recievedPercentage = ((recievedApplication/count)*100).toFixed(2);
            let recieved = {
                name:"RECEIVED",
                value:recievedApplication,
                percentage: `${recievedPercentage}%`
            }
            if (approvedPercentage == 0 ){
                approve.color = "RED";
            } else if (approvedPercentage <= 25 ){
                approve.color = "ORANGE";
            } else if( approvedPercentage <= 50 ){
                approve.color = "YELLOW";
            } else if ( approvedPercentage <= 75 ){
                approve.color = "LIGHT GREEN";
            } else if( approvedPercentage <= 100 ){
                approve.color = "GREEN";
            }
            
            if (pendingPercentage == 0 ){
                Pending.color = "GREEN";
            } else if (pendingPercentage <= 25 ){
                Pending.color = "LIGHT GREEN";
            } else if( pendingPercentage <= 50 ){
                Pending.color = "YELLOW";
            } else if ( pendingPercentage <= 75 ){
                Pending.color = "ORANGE";
            } else if( pendingPercentage <= 100 ){
                Pending.color = "RED";
            }

            if (rejectedPercentage == 0 ){
                Rejected.color = "RED";
            } else if (rejectedPercentage <= 25 ){
                Rejected.color = "RED";
            } else if( rejectedPercentage <= 50 ){
                Rejected.color = "RED";
            } else if ( rejectedPercentage <= 75 ){
                Rejected.color = "RED";
            } else if( rejectedPercentage <= 100 ){
                Rejected.color = "RED";
            }
            if (totalPercentage == 0 ){
                Total.color = "ORANGE";
                recieved.color = "ORANGE";
            } else if (totalPercentage <= 25 ){
                Total.color = "ORANGE";
                recieved.color = "ORANGE";
            } else if( totalPercentage <= 50 ){
                Total.color = "ORANGE";
                recieved.color = "ORANGE";
            } else if (totalPercentage <= 75 ){
                Total.color = "ORANGE";
                recieved.color = "ORANGE";
            } else if( totalPercentage <= 100 ){
                Total.color = "ORANGE";
                recieved.color = "ORANGE";
            }
            res.push(expected)
            res.push(recieved)
            res.push(Rejected)
            res.push(Pending)
            res.push(approve)
            res.push(Total)
            
            
        }
        return {
            status: true,
            message: "Get Count Successfully",
            data: res
        };

    } catch (error) {
        console.log(error)
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.getApplicationReportStatusCount = async (branchCode, user) => {
    try {
        console.log(branchCode, user)
        let res=[];
        if (!branchCode) {
            let lands = await bankBranch.aggregate([
                {
                    $group: {
                        _id: '',
                         'Total': {$sum:{ '$toInt': '$numberOfApplications'}}
                    }
                },
                { $sort : { _id : 1 } }
             ])
            
            let applications = await application.countDocuments({status:"APPROVED"})
            let totalPercentage = ((applications/applications)*100).toFixed(2);
            let Total ={
                name:"TOTAL",
                value:applications,
                percentage:`${totalPercentage}%`
            }
            let applicationApproved = await application.countDocuments({status:"APPROVED",reportApprovalStatus:"APPROVED"})
            let approvedPercentage = applicationApproved/applications * 100;
            let approve ={
                name:"APPROVED",
                value:applicationApproved,
                percentage: `${approvedPercentage.toFixed(2)}%`
            }
            let applicationPending = await application.countDocuments({status:"APPROVED",reportApprovalStatus:"PENDING"})
            let pendingPercentage = applicationPending/applications * 100;
            let Pending ={
                name:"PENDING",
                value:applicationPending,
                percentage: `${pendingPercentage.toFixed(2)}%`
            }
            if (approvedPercentage == 0 ){
                approve.color = "RED";
            } else if (approvedPercentage <= 25 ){
               approve.color = "ORANGE";
            } else if( approvedPercentage <= 50 ){
               approve.color = "YELLOW";
            } else if ( approvedPercentage <= 75 ){
               approve.color = "LIGHT GREEN";
            } else if( approvedPercentage <= 100 ){
               approve.color = "GREEN";
            }
            
            if (pendingPercentage == 0 ){
                Pending.color = "GREEN";
            } else if (pendingPercentage <= 25 ){
               Pending.color = "LIGHT GREEN";
            } else if( pendingPercentage <= 50 ){
               Pending.color = "YELLOW";
            } else if ( pendingPercentage <= 75 ){
               Pending.color = "ORANGE";
            } else if( pendingPercentage <= 100 ){
               Pending.color = "RED";
            }
            if (totalPercentage == 0 ){
                Total.color = "ORANGE";
            } else if (totalPercentage <= 25 ){
                Total.color = "ORANGE";
            } else if( totalPercentage <= 50 ){
                Total.color = "ORANGE";
            } else if ( totalPercentage <= 75 ){
                Total.color = "ORANGE";
            } else if( totalPercentage <= 100 ){
                Total.color = "ORANGE";
            }
            res.push(Total)
            res.push(approve)
            res.push(Pending)
            // let applicationRejected = await application.countDocuments({reportApprovalStatus:"REJECTED"})
            // let Rejected ={
            //     name:"REJECTED",
            //     value:applicationRejected
            // }
            //res.push(Rejected)
        } else {
            let applicationCount = await bankBranch.findOne({branchCode:branchCode},{numberOfApplications:1})
            let count = parseInt(applicationCount.numberOfApplications)
            let applicationApproved = await application.countDocuments({reportApprovalStatus:"APPROVED",status:"APPROVED", bankBranchCode: branchCode})
            let applications = await application.countDocuments({ bankBranchCode: branchCode,status:"APPROVED"})
            if(applications==0){
                let Total ={
                    name:"TOTAL",
                    value:0,
                    percentage: `0%`
                }
                let approve ={
                    name:"APPROVED",
                    value:0,
                    color : "RED",
                    percentage: `0%`
                }
                let Pending ={
                    name:"PENDING",
                    value:0,
                    color : "GREEN",
                    percentage: `0%`
                }
                res.push(Pending)
                res.push(approve)
                res.push(Total)
                return {
                    status: true,
                    message: "Get Count Successfully",
                    data: res
                };
            }
            let approvedPercentage = applicationApproved/applications * 100;
            let totalPercentage = ((applications/applications)*100).toFixed(2);
            let Total ={
                name:"TOTAL",
                value:applications,
                percentage: `${totalPercentage}%`
            }
            let approve ={
                name:"APPROVED",
                value:applicationApproved,
                percentage: `${approvedPercentage.toFixed(2)}%`
            }
            let applicationPending = await application.countDocuments({reportApprovalStatus:"PENDING",status:"APPROVED", bankBranchCode: branchCode})
            let pendingPercentage = applicationPending/applications * 100;
            let Pending ={
                name:"PENDING",
                value:applicationPending,
                percentage: `${pendingPercentage.toFixed(2)}%`
            }
            if (approvedPercentage == 0 ){
                approve.color = "RED";
            } else if (approvedPercentage <= 25 ){
               approve.color = "ORANGE";
            } else if( approvedPercentage <= 50 ){
               approve.color = "YELLOW";
            } else if ( approvedPercentage <= 75 ){
               approve.color = "LIGHT GREEN";
            } else if( approvedPercentage <= 100 ){
               approve.color = "GREEN";
            }
            
            if (pendingPercentage == 0 ){
                Pending.color = "GREEN";
            } else if (pendingPercentage <= 25 ){
               Pending.color = "LIGHT GREEN";
            } else if( pendingPercentage <= 50 ){
               Pending.color = "YELLOW";
            } else if ( pendingPercentage <= 75 ){
               Pending.color = "ORANGE";
            } else if( pendingPercentage <= 100 ){
               Pending.color = "RED";
            }
            // let applicationRejected = await application.countDocuments({reportApprovalStatus:"REJECTED", bankBranchCode: branchCode})
            // let Rejected ={
            //     name:"REJECTED",
            //     value:applicationRejected
            // }
            //res.push(Rejected)
            res.push(Pending)
            res.push(approve)
            res.push(Total)
        }
        return {
            status: true,
            message: "Get Count Successfully",
            data: res
        };
    } catch (error) {
        console.log(error)
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.getApplicationCommentsCount = async (branchCode, user) => {
    try {
        console.log(branchCode, user)
        let res=[];
        let commentCount=[];
        let errorData=[];
        if (!branchCode) {
            let applications = await application.countDocuments({
                isNewComment:true
            })
            //console.log(applications)
            //let count =applications.length
            let data = await application.aggregate([{$project:{final:{$size:"$applicationComment"}}}])
           // console.log(count,data)
            for(let applications of data){
                if(applications.final>0){
                    let find = await application.findOne({_id:applications._id})
                    applications.applicationId =find.applicationId
                    commentCount.push(applications)
                }else{
                    errorData.push(applications)
                }
            }
            
        //     let applications = await application.countDocuments({
        //     //     $expr: {
        //     //     $eq: [{ $size: { $ifNull: ["$applicationComment", []] } }, 1]
        //     // }
        // })
        //console.log("12",data)
            let Total ={
                name:"ApplicationCommentCount",
                value:commentCount.length
            }
           
            res.push(Total)
            res.push(commentCount)
            
        } else {
            let applications = await application.countDocuments({
                bankBranchCode:branchCode,
                isNewComment:true
             })
            
            let data = await application.aggregate([{$match:{bankBranchCode:branchCode}},{$project:{final:{$size:"$applicationComment"}}}])
            for(let applications of data){
                if(applications.final>0){
                    let find = await application.findOne({_id:applications._id})
                    applications.applicationId =find.applicationId
                    commentCount.push(applications)
                }else{
                    errorData.push(applications)
                }
            }
            // let data = await application.aggregate([
            //     { $project: {     numberOfDocuments: { $cond: { if: { $isArray: "$applicationComment" }, 
            //     then: { $size: "$applicationComment" }, else: "No Documents"} }}}
            // ])
           // console.log("1",data)
           let Total ={
            name:"ApplicationCommentCount",
            value:commentCount.length
        }
             res.push(Total)
             res.push(commentCount)
        }
        return {
            status: true,
            message: "Get Count Successfully",
            data: res
        };
    } catch (error) {
        console.log(error)
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.commentApplication = async (payload, id) => {
    try {
        console.log(id)
        let checkUserExist = await application.findById({
            _id: id
        })
        console.log(checkUserExist)
        if (checkUserExist) {
            let data = await application.updateOne({
                _id: id
            }, {
                $push: {
                    applicationComment: payload
                }

            });
            let res= await application.updateOne({ _id: id},{
                isNewComment: true
            })
            let result = await application.findOne({
                _id: id
            }, {
                applicationComment: 1
            })
            return {
                status: true,
                message: "Comment Created Successfully",
                data: result
            }
        } else {
            return {
                status: false,
                message: "Application Does Not Exist"
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.commentApplicationDelete = async (payload, id) => {
    try {
        let checkUserExist = await application.findOne({
            _id: id
        })
        if (checkUserExist) {
            if(payload.commentType==1){
                let data = await application.updateOne({
                    _id: id
                }, {
                    $pull: {
                        applicationComment: {_id:payload.commentId}
                    }
    
                },{
                     multi: true
               })
                let result = await application.findOne({
                    _id: id
                }, {
                    applicationComment: 1
                })
                return {
                    status: true,
                    message: "Comment Deleted Successfully",
                    data: result
                }
            }else{
                console.log("hiii")
            let data = await application.updateOne({
                _id: id
            }, {
                $pull: {
                    rejectApplication:{ _id: payload.commentId }
                }

            },{
                 multi: true
           })
            let result = await application.findOne({
                _id: id
            }, {
                rejectApplication: 1
            })
            return {
                status: true,
                message: "RejectComment Deleted Successfully",
                data: result
            }
          }
        } else {
            return {
                status: false,
                message: "Application Does Not Exist"
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.rejectCommentApplication = async (payload, id) => {
    try {
        let id =payload.id
        let applicationId
        for (let i =0;i<id.length;i++) {
         applicationId=id[i]
         console.log(applicationId)
         payload.applicationId=applicationId
            await application.updateOne({
                _id: applicationId
            }, {
                $push: {
                    rejectApplication: payload
                }
            })
            }
            return {
            status: true,
            message: "Comment Created Successfully",

            }
         
        
       
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.rejectCommentApplicationBulk = async (payload, id) => {
    try {
        let data
        if(payload.branchCode){
            data = await application.find({status:"PENDING",bankBranchCode:payload.branchCode}) 
            if(data.length>0){
                    let applications = await application.updateMany({
                        status:"PENDING",bankBranchCode:payload.branchCode
                    },{
                        $push: {   rejectApplication: payload}
                    })
                    return {
                        status: true,
                        message: `Reject Comment created Successfully`
                    }
            }
                return {
                    status: false,
                    message: "Application Pending list is empty"
                    
                }
        }else{
            data = await application.find({status:"PENDING"}) 
            if(data.length>0){
                    let applications = await application.updateMany({
                        status:"PENDING"
                    },{
                        $push: {   rejectApplication: payload}
                    })
                    return {
                        status: true,
                        message: `Reject Comment Created Successfully`
                        
                    }
            }
                return {
                    status: false,
                    message: "Application Pending list is empty"
                    
                }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.bulkApplicationUpload = async (landDetails,BranchCode,fileName,bulkUploadId) => {
    try {
        let checkBranchCode, bulkUploadData = [], result;
        let createdApplicationData = [], createdApplicationCount = 0, updatedApplicationData = [], updatedApplicationCount = 0, notUpdatedApplication = [], notUpdatedApplicationCount = 0;
        //let bulkUploadId = await getBulkUploadId();
        if(!BranchCode){
            console.log("checking admina as uploading")
            for (const applicationItem of landDetails) {
                applicationItem.applicationId = await getApplicationId();
                applicationItem.isBulkUpload = true;
                applicationItem.bulkUploadId = bulkUploadId;
                checkBranchCode = await bankBranch.find({
                    branchCode: applicationItem.bankBranchCode
                });
                console.log("The following is the bank branch code", checkBranchCode);
                if (checkBranchCode.length == 0) {
                    notUpdatedApplication.push(applicationItem);
                    notUpdatedApplicationCount++;
                    applicationItem.rejectionReason = `Branch Code ${applicationItem.bankBranchCode} Not Exist`;
                    continue;
                }
                let checkKccStatus = await application.find({
                    accountNumber: applicationItem.accountNumber
                });
                console.log("The following is the KCC Status", checkKccStatus);
                if (checkKccStatus.length != 0) {
                    await application.updateOne({accountNumber: applicationItem.accountNumber},{$set:{applicationItem}})
                    updatedApplicationData.push(applicationItem);
                    updatedApplicationCount++;
                    continue;
                }
                console.log("The following is the Application account number", applicationItem.accountNumber);
                console.log("The following is the KCC Status", checkKccStatus);
                // let applicationCount = await application.countDocuments({bankBranchCode:applicationItem.bankBranchCode})
                // console.log("ApplicationCount", applicationCount);
                // let branchApplicationCount = await bankBranch.findOne({branchCode:applicationItem.bankBranchCode},{numberOfApplications:1})
                // console.log("branchCount", branchApplicationCount.numberOfApplications);
                // if(applicationCount>=branchApplicationCount.numberOfApplications){
                //     console.log("compareCount")
                //     notUpdatedApplication.push(applicationItem);
                //     notUpdatedApplicationCount++;
                //     applicationItem.rejectionReason = `BranchCode numberOfApplications ${branchApplicationCount.numberOfApplications} is same as applicationCount ${applicationCount}`;
                   
                //     continue;
                // }
                result = await application.create(applicationItem);
                console.log("------------------------------>", result);
                if(result){
                    createdApplicationData.push(result);
                    createdApplicationCount++;
                    bulkUploadData.push(result);
                }
            }
            let updateReport = {
                createdApplication: createdApplicationData,
                createdApplicationCount: createdApplicationCount,
                updatedApplication: updatedApplicationData,
                updatedApplicationCount: updatedApplicationCount,
                notUpdatedApplication: notUpdatedApplication,
                notUpdatedApplicationCount: notUpdatedApplicationCount,
                bulkUploadId: bulkUploadId,
                fileName: fileName
            };
            console.log("The following is the bulkUploadData", bulkUploadData);
            let finalReportStatus = await bulkUploadReport.create(updateReport);
            console.log("The following is the finalReportStatus", finalReportStatus);
            bulkUploadData.length == 0 ? bulkUploadData = null : bulkUploadData;
            return {
                status: true,
                message: "File Uploaded successfully",
                data: updateReport
            }
        }
        console.log("Array")
        for (const applicationItem of landDetails) {
            applicationItem.applicationId = await getApplicationId();
            applicationItem.isBulkUpload = true;
            applicationItem.bulkUploadId = bulkUploadId;
            if(applicationItem.bankBranchCode != BranchCode){
                notUpdatedApplication.push(applicationItem);
                notUpdatedApplicationCount++;
                applicationItem.rejectionReason = `Your Uploading other BranchApplication ${applicationItem.bankBranchCode}`;
                continue;
            }
            checkBranchCode = await bankBranch.find({
                branchCode: applicationItem.bankBranchCode
            });
            console.log("The following is the bank branch code", checkBranchCode);
            if (checkBranchCode.length == 0) {
                notUpdatedApplication.push(applicationItem);
                notUpdatedApplicationCount++;
                applicationItem.rejectionReason = `Invalid branch code ${applicationItem.bankBranchCode}`;
                continue;
            }
            let checkKccStatus = await application.find({
                accountNumber: applicationItem.accountNumber
            });
            console.log("The following is the KCC Status", checkKccStatus);
            if (checkKccStatus.length != 0) {
                await application.updateOne({accountNumber: applicationItem.accountNumber},{$set:{applicationItem}})
                updatedApplicationData.push(applicationItem);
                updatedApplicationCount++;
                continue;
            }
            console.log("The following is the Application account number", applicationItem.accountNumber);
            console.log("The following is the KCC Status", checkKccStatus);
            // let applicationCount = await application.countDocuments({bankBranchCode:applicationItem.bankBranchCode})
            //     console.log("ApplicationCount", applicationCount);
            //     let branchApplicationCount = await bankBranch.findOne({branchCode:applicationItem.bankBranchCode},{numberOfApplications:1})
            //     console.log("branchCount", branchApplicationCount.numberOfApplications);
            //     if(applicationCount>=branchApplicationCount.numberOfApplications){
            //         console.log("compareCount")
            //         notUpdatedApplication.push(applicationItem);
            //         notUpdatedApplicationCount++;
            //         applicationItem.rejectionReason = `The count of Application matches the count provided for this branch, Please contact Agrotech team.`;
            //         continue;
            //     }
           
            result = await application.create(applicationItem);
            console.log("------------------------------>", result);
            if(result){
                createdApplicationData.push(result);
                createdApplicationCount++;
                bulkUploadData.push(result);
            }
        }
        let updateReport = {
            createdApplication: createdApplicationData,
            createdApplicationCount: createdApplicationCount,
            updatedApplication: updatedApplicationData,
            updatedApplicationCount: updatedApplicationCount,
            notUpdatedApplication: notUpdatedApplication,
            notUpdatedApplicationCount: notUpdatedApplicationCount,
            bulkUploadId: bulkUploadId,
            fileName: fileName,
            branchCode:BranchCode
        };
        console.log("The following is the bulkUploadData", bulkUploadData);
        let finalReportStatus = await bulkUploadReport.create(updateReport);
        console.log("The following is the finalReportStatus", finalReportStatus);
        bulkUploadData.length == 0 ? bulkUploadData = null : bulkUploadData;
        return {
            status: true,
            message: "File Uploaded successfully",
            data: updateReport
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}

ApplicationService.getBulkUploadReport = async (bulkUploadId) => {
    try {
        console.log(bulkUploadId)
        let bulkUploadReportData = await bulkUploadReport.findOne({
            bulkUploadId: bulkUploadId
        }).lean({ virtuals: true });
        let count = await bulkUploadReport.countDocuments({
            bulkUploadId: bulkUploadId
        }).lean();
        console.log(count)
        return {
            status: true,
            message: "Bulk Upload Report data fetched successfully.",
            data: bulkUploadReportData
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}

ApplicationService.getAllBulkUploads = async (limit, page,branchCode) => {
    try {
        if(branchCode){
            let countDoc = await bulkUploadReport.countDocuments({branchCode:branchCode})
        let bulkUploadData = await bulkUploadReport.find({branchCode:branchCode})
            .skip(parseInt(limit * (page - 1)))
            .limit(limit)
            .sort({
                'createdAt': -1
            }).lean({ virtuals: true });
        return {
            status: true,
            message: "Bulk Upload data fetched successfully.",
            data:pagingData(bulkUploadData, page, limit, countDoc) 
        }
        }
        let countDoc = await bulkUploadReport.countDocuments({})
        let bulkUploadData = await bulkUploadReport.find({})
            .skip(parseInt(limit * (page - 1)))
            .limit(limit)
            .sort({
                'createdAt': -1
            }).lean({ virtuals: true });
        return {
            status: true,
            message: "Bulk Upload data fetched successfully.",
            data:pagingData(bulkUploadData, page, limit, countDoc) 
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}

ApplicationService.report = async (payload) => {
    try {
          return{
              status:true,
              data:"http://doodlebluelive.com:2122/public/uploads/11506779433_6052.pdf"
          }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}

ApplicationService.getStateDistrict = async (pinCode) => {
    try {
        let data = await ThirdPartyServices.getStateDistrict({
            "pinCode": pinCode 
        });
        let sample = data[0].PostOffice[0]
        // let result ={}
        // result.pinCode=pinCode
        // result.state=data[0].PostOffice[0].State
        // result.district =data[0].PostOffice[0].District
        // console.log("123",data[0].PostOffice[0].District)
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: sample
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.getAllAgrotechApplications = async (query, limit, page) => {
    try {
        console.log("Inside get all applications");
        let applicationDetail, totalCount;
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
            console.log("Check", queryObj,limit, sort)
            if (sort) {
                console.log("!", sort)
                totalCount = await agrotechApplication.find(queryObj).countDocuments();
                applicationDetail = await agrotechApplication.find(queryObj)
                    .skip(parseInt(limit * (page - 1)))
                    .limit(limit)
                    .sort(sort);

                if (!applicationDetail) {
                    return {
                        status: false,
                        message: "Application not found."
                    }
                }
                return {
                    status: true,
                    message: "Data fetched successfully",
                    data: pagingData(applicationDetail, page, limit, totalCount)
                }
            } else if (limit == 0) {
                console.log("HII")
                totalCount = await agrotechApplication.find(queryObj).countDocuments();
                applicationDetail = await agrotechApplication.find(queryObj)
                    .skip()
                    .limit()
                    .sort({
                        'createdAt': -1
                    });

                if (!applicationDetail) {
                    return {
                        status: false,
                        message: "Application not found."
                    }
                }
                return {
                    status: true,
                    message: "Data fetched successfully",
                    data: pagingData(applicationDetail, page, limit, totalCount)
                }
            } else {
                console.log("!!")
                totalCount = await agrotechApplication.find(queryObj).countDocuments();
                applicationDetail = await agrotechApplication.find(queryObj)
                    .skip(parseInt(limit * (page - 1)))
                    .limit(limit)
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
                totalCount = await agrotechApplication.find(queryObj).countDocuments();
                applicationDetail = await agrotechApplication.find(queryObj)
                    .skip(parseInt(limit * (page - 1)))
                    .limit(limit)
                    .sort(sort);

                if (!applicationDetail) {
                    return {
                        status: false,
                        message: "Application not found."
                    }
                }
                return {
                    status: true,
                    message: "Data fetched successfully",
                    data: pagingData(applicationDetail, page, limit, totalCount)
                }
            } else if (limit == 0) {
                totalCount = await agrotechApplication.find(queryObj).countDocuments();
                applicationDetail = await agrotechApplication.find(queryObj)
                    .skip()
                    .limit()
                    .sort({
                        'createdAt': -1
                    });

                if (!applicationDetail) {
                    return {
                        status: false,
                        message: "Application not found."
                    }
                }
                return {
                    status: true,
                    message: "Data fetched successfully",
                    data: pagingData(applicationDetail, page, limit, totalCount)
                }
            } else {
                console.log("!!")
                totalCount = await agrotechApplication.find(queryObj).countDocuments();
                applicationDetail = await agrotechApplication.find(queryObj)
                    .skip(parseInt(limit * (page - 1)))
                    .limit(limit)
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
        return {
            status: true,
            message: "Data fetched successfully",
            data: pagingData(applicationDetail, page, limit, totalCount)
        }
    } catch(error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.getAgrotechApplicationById = async (id) => {
    try {
        if (!id) {
            return {
                status: false,
                message: "Please enter application ID"
            };
        }
        let land = await agrotechApplication.findOne({
            applicationId: id
        });
        if (!land) {
            return {
                status: false,
                message: "Application not found"
            };
        }
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: land
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.getAgrotechApplicationByAccountNumber = async (accountNumber) => {
    try {
        
        if (!accountNumber) {
            return {
                status: false,
                message: "Branch code is required."
            };
        }
        let land = await agrotechApplication.find({
            accountNumber: accountNumber
        });
        if (!land) {
            return {
                status: false,
                message: "Application not found"
            };
        }
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: land
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
ApplicationService.agrotechApproveStatus = async (payload, status, id) => {
    try {
        let id =payload.id
        let applicationId
        for (let i =0;i<id.length;i++) {
         applicationId=id[i]
         let date;
            if(status=="APPROVED"){
                console.log("clear")
            date=moment().tz('Asia/kolkata').format('YYYY-MM-DD')
                    await agrotechApplication.findByIdAndUpdate(applicationId, {
                        status: status,
                        applicationApprovedDate:date
                        });
                                
            }
            if(status=="REJECTED"){
                console.log("All")
                date=moment().tz('Asia/kolkata').format('YYYY-MM-DD')
                await agrotechApplication.findByIdAndUpdate(applicationId, {
                    status: status,
                    applicationRejectedDate:date
                });
                                
            }
            if(status=="PENDING"){
                console.log("lite")
                await agrotechApplication.findByIdAndUpdate(applicationId, {
                    status: status
                });
                               
            }
        }
    return {
        status: true,
        message: `${status} Successfully`
    }


    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}

ApplicationService.agrotechbulkApproveApplications = async (payload, status) => {
    try {   
        let data 
        if(payload.branchCode){
            data = await agrotechApplication.find({status:"PENDING",bankBranchCode:payload.branchCode}) 
            if(data.length>0){
               let date=moment().tz('Asia/kolkata').format('YYYY-MM-DD')
                if(status=="APPROVED"){
                    
                    await agrotechApplication.updateMany({status:"PENDING",bankBranchCode:payload.branchCode},{ $set: {  status: status,applicationApprovedDate:date }})
                    return {
                        status: true,
                        message: `${status} Successfully`
                        
                    }
                }
                
                    await agrotechApplication.updateMany({status:"PENDING",bankBranchCode:payload.branchCode},{ $set: {  status: status,applicationRejectedDate:date }})
               
                    return {
                        status: true,
                        message: `${status} Successfully`
                        
                    }
            }
                return {
                    status: false,
                    message: "Application Pending list is empty"
                    
                }
        }else {
            data = await agrotechApplication.find({status:"PENDING"}) 
            if(data.length>0){
                let date=moment().tz('Asia/kolkata').format('YYYY-MM-DD')
                if(status=="APPROVED"){
                    let applications = await agrotechApplication.updateMany({status:"PENDING"},{ $set: {  status: status,applicationApprovedDate:date }})
                    return {
                        status: true,
                        message: `${status} Successfully`
                        
                    } 
                }
                let applications = await agrotechApplication.updateMany({status:"PENDING"},{ $set: {  status: status,applicationRejectedDate:date }})
            return {
                status: true,
                message: `${status} Successfully`
            } 
        }
                return {
                    status: false,
                    message: "Application pending list is empty"
                    
                }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}

ApplicationService.updateFlag = async (payload) => {
    try {
        let applications = await application.findOne({
            _id: payload._id
        })
        if(applications){
            await application.updateOne({
                _id: payload._id
            }, {
                $set: {
                    flagApplication: payload.flagApplication
                }
            })
            return {
                status: true,
                message: "Flag updated successfully"
            }
        } else {
            return {
                status: false,
                message: "Application not found"
            }
        }
    } catch (error){
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}

ApplicationService.resolveApplicationComment = async (payload) => {
    try {
        let applications = await application.findOne({
            _id: payload._id
        });
        if(applications){
            await application.updateOne({
                _id: payload._id
            }, {
                $set: {
                    isNewComment: payload.commentStatus
                }
            })
            return {
                status: true,
                message: "Comment updated successfully"
            }
        } else {
            return {
                status: false,
                message: "Application not found"
            }
        }
    } catch (error){
        console.log("error", error);
        throw new Error(JSON.stringify(error));
    }
}

ApplicationService.getapplicationsDataGraph = async (keyType, branchCode) => {
    try {
        // *******KeyType*******
        // 1- ActiveUser 2- Inprogress 3- Approved 4- ResolvedCases  5- REJECTED
        let statusKey = "PENDING"
        if (keyType == 1){
            statusKey = "PENDING"
        } else if(keyType == 2){
            statusKey = "APPROVED"
        } else if(keyType == 3){
            statusKey = "RESOLVED"
        }else if(keyType == 4){
            statusKey = "REJECTED"
        }
        if(branchCode){
            // let find =await application.find({status:statusKey,bankBranchCode})
            // let count =await application.countDocuments({status:statusKey})
            // console.log(statusKey,count)
                let applicationsData = await application.aggregate(
                    [{
                        $match: { status: statusKey,bankBranchCode:branchCode }
                    },
                    {
                        $group: {
                            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                            total_application_count: { $sum:1} 
                        }
                    }
                    ]);  
                    console.log(applicationsData)
                    let arrayData = [];
                    applicationsData.map((data) =>{
                        arrayData.push({month: data._id['month'], total_application_count: data.total_application_count})                  
                     return 1;
                     });

                let res =[1,2,3,4,5,6,7,8,9,10,11,12]
                let number =[];
                for(let i =0;i<arrayData.length;i++){
                    number.push(arrayData[i].month)
                }
                res = res.filter( function( el ) {
                    return !number.includes( el );
                  } );
            
                for(let numbers of res){
                   // console.log("inside",numbers)
                    if(numbers=="1"){
                        //console.log("ch")
                        arrayData.push({month: 1, total_application_count: 0})
                     }
                     if(numbers=="2"){
                        arrayData.push({month: 2, total_application_count: 0})
                     }
                     if(numbers=="3"){
                        arrayData.push({month: 3, total_application_count: 0})
                     }
                     if(numbers=="4"){
                        arrayData.push({month: 4, total_application_count: 0})
                     }
                     if(numbers=="5"){
                        arrayData.push({month: 5, total_application_count: 0})
                     }
                     if(numbers=="6"){
                        arrayData.push({month: 6, total_application_count: 0})
                     }
                     if(numbers=="7"){
                        arrayData.push({month: 7, total_application_count: 0})
                     }
                     if(numbers=="8"){
                        arrayData.push({month: 8, total_application_count: 0})
                     }
                     if(numbers=="9"){
                        arrayData.push({month: 9, total_application_count: 0})
                     }
                     if(numbers=="10"){
                        arrayData.push({month: 10, total_application_count: 0})
                     }
                     if(numbers=="11"){
                        arrayData.push({month: 11, total_application_count: 0})
                     }
                     if(numbers=="12"){
                        arrayData.push({month: 12, total_application_count: 0})
                     }
                }
                     arrayData.sort((a,b) => a.month - b.month); 
             
            return {
                status: true,
                message: "Get Graph Data Successfully",
                data: arrayData
            };
        }
        let find =await application.find({status:statusKey})
        let count =await application.countDocuments({status:statusKey})
        console.log(statusKey,count)
            let applicationsData = await application.aggregate(
                [{
                    //$match: { reportApprovalStatus: statusKey }
                    $match: { status: statusKey }
                },
                {
                    $group: {
                        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                        total_application_count: { $sum:1} 
                    }
                }
                ]);  
                console.log(applicationsData)

                let arrayData = [];
                applicationsData.map((data) =>{
                    arrayData.push({month: data._id['month'], total_application_count: data.total_application_count})                  
                 return 1;
                 });
               
                let res =[1,2,3,4,5,6,7,8,9,10,11,12]
                let number =[];
                for(let i =0;i<arrayData.length;i++){
                    number.push(arrayData[i].month)
                }
                res = res.filter( function( el ) {
                    return !number.includes( el );
                  } );
                 // console.log("check",number,res)
              //  let numbers =[]
                // for(let i=1; i<=12;i++){
                //     numbers.push({month: i,total_application_count:0})
                // }
                // for(let i=0;i<number.length;i++){
                //     console.log("monthNumber",number[i].month)
                //     let data =number[i].month
                //     numbers.month[data].total_application_count=7//=arrayData.month[data].total_application_count
                //     console.log("monthvalue",arrayData.month[data].total_application_count)
                // }
                //  console.log(number,numbers)
                // console.log(number)
                for(let numbers of res){
                   // console.log("inside",numbers)
                    if(numbers=="1"){
                        //console.log("ch")
                        arrayData.push({month: 1, total_application_count: 0})
                     }
                     if(numbers=="2"){
                        arrayData.push({month: 2, total_application_count: 0})
                     }
                     if(numbers=="3"){
                        arrayData.push({month: 3, total_application_count: 0})
                     }
                     if(numbers=="4"){
                        arrayData.push({month: 4, total_application_count: 0})
                     }
                     if(numbers=="5"){
                        arrayData.push({month: 5, total_application_count: 0})
                     }
                     if(numbers=="6"){
                        arrayData.push({month: 6, total_application_count: 0})
                     }
                     if(numbers=="7"){
                        arrayData.push({month: 7, total_application_count: 0})
                     }
                     if(numbers=="8"){
                        arrayData.push({month: 8, total_application_count: 0})
                     }
                     if(numbers=="9"){
                        arrayData.push({month: 9, total_application_count: 0})
                     }
                     if(numbers=="10"){
                        arrayData.push({month: 10, total_application_count: 0})
                     }
                     if(numbers=="11"){
                        arrayData.push({month: 11, total_application_count: 0})
                     }
                     if(numbers=="12"){
                        arrayData.push({month: 12, total_application_count: 0})
                     }
                }
               
                 arrayData.sort((a,b) => a.month - b.month); 
                 
         
        return {
            status: true,
            message: "Get Graph Data Successfully",
            data: arrayData
        };
    } catch (error) {
        console.log(error)
        throw new Error(JSON.stringify(error))
    }
};

ApplicationService.getLandApprovedCount = async (keyType, branchCode) => {
    try {

        if(branchCode){
       
            let applicationsData = await application.aggregate(
                [{
                    $match: { bankBranchCode:branchCode,status: "APPROVED" }
                },
                {
                    $group: {
                        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                        total_application_count: { $sum:1} 
                    }
                }
                ]);
               
               let arrayData = [];
               applicationsData.map((data) =>{
                   arrayData.push({month: data._id['month'], total_application_count: data.total_application_count})                  
                return 1;
                });
                let res =[1,2,3,4,5,6,7,8,9,10,11,12]
                let number =[];
                for(let i =0;i<arrayData.length;i++){
                    number.push(arrayData[i].month)
                }
                res = res.filter( function( el ) {
                    return !number.includes( el );
                  } );
            
                for(let numbers of res){
                   // console.log("inside",numbers)
                    if(numbers=="1"){
                        //console.log("ch")
                        arrayData.push({month: 1, total_application_count: 0})
                     }
                     if(numbers=="2"){
                        arrayData.push({month: 2, total_application_count: 0})
                     }
                     if(numbers=="3"){
                        arrayData.push({month: 3, total_application_count: 0})
                     }
                     if(numbers=="4"){
                        arrayData.push({month: 4, total_application_count: 0})
                     }
                     if(numbers=="5"){
                        arrayData.push({month: 5, total_application_count: 0})
                     }
                     if(numbers=="6"){
                        arrayData.push({month: 6, total_application_count: 0})
                     }
                     if(numbers=="7"){
                        arrayData.push({month: 7, total_application_count: 0})
                     }
                     if(numbers=="8"){
                        arrayData.push({month: 8, total_application_count: 0})
                     }
                     if(numbers=="9"){
                        arrayData.push({month: 9, total_application_count: 0})
                     }
                     if(numbers=="10"){
                        arrayData.push({month: 10, total_application_count: 0})
                     }
                     if(numbers=="11"){
                        arrayData.push({month: 11, total_application_count: 0})
                     }
                     if(numbers=="12"){
                        arrayData.push({month: 12, total_application_count: 0})
                     }
                }
                arrayData.sort((a,b) => a.month - b.month); 
                    return {
                        status: true,
                        message: "Get Land Data Successfully",
                        data: arrayData
                    };
        }
       
            let applicationsData = await application.aggregate(
                [{
                    $match: { status: "APPROVED" }
                },
                {
                    $group: {
                        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                        total_application_count: { $sum:1} 
                    }
                }
                ]);
               
               let arrayData = [];
               applicationsData.map((data) =>{
                   arrayData.push({month: data._id['month'], total_application_count: data.total_application_count})                  
                return 1;
                });
                let res =[1,2,3,4,5,6,7,8,9,10,11,12]
                let number =[];
                for(let i =0;i<arrayData.length;i++){
                    number.push(arrayData[i].month)
                }
                res = res.filter( function( el ) {
                    return !number.includes( el );
                  } );
            
                for(let numbers of res){
                   // console.log("inside",numbers)
                    if(numbers=="1"){
                        //console.log("ch")
                        arrayData.push({month: 1, total_application_count: 0})
                     }
                     if(numbers=="2"){
                        arrayData.push({month: 2, total_application_count: 0})
                     }
                     if(numbers=="3"){
                        arrayData.push({month: 3, total_application_count: 0})
                     }
                     if(numbers=="4"){
                        arrayData.push({month: 4, total_application_count: 0})
                     }
                     if(numbers=="5"){
                        arrayData.push({month: 5, total_application_count: 0})
                     }
                     if(numbers=="6"){
                        arrayData.push({month: 6, total_application_count: 0})
                     }
                     if(numbers=="7"){
                        arrayData.push({month: 7, total_application_count: 0})
                     }
                     if(numbers=="8"){
                        arrayData.push({month: 8, total_application_count: 0})
                     }
                     if(numbers=="9"){
                        arrayData.push({month: 9, total_application_count: 0})
                     }
                     if(numbers=="10"){
                        arrayData.push({month: 10, total_application_count: 0})
                     }
                     if(numbers=="11"){
                        arrayData.push({month: 11, total_application_count: 0})
                     }
                     if(numbers=="12"){
                        arrayData.push({month: 12, total_application_count: 0})
                     }
                }
                arrayData.sort((a,b) => a.month - b.month); 

            // let ArrayTempData = [
            //     {
            //         "month": 1,
            //         "total_application_count": 29
            //     },
            //     {
            //         "month": 3,
            //         "total_application_count": 59
            //     },
            //     {
            //         "month": 4,
            //         "total_application_count": 20
            //     },
               
            //     {
            //         "month": 6,
            //         "total_application_count": 25
            //     },
            //     {
            //         "month": 8,
            //         "total_application_count": 40
            //     },
            //     {
            //         "month": 9,
            //         "total_application_count": 22
            //     },              
            //     {
            //         "month": 10,
            //         "total_application_count": 11
            //     },
              
            //     {
            //         "month":12,
            //         "total_application_count": 18
            //     }
             
            // ];

        return {
            status: true,
            message: "Get Land Data Successfully",
            data: arrayData
        };
    } catch (error) {
        console.log(error)
        throw new Error(JSON.stringify(error))
    }
}
module.exports = ApplicationService;