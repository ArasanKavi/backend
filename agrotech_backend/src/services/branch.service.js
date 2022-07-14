const {
    user,
    admin,
    permission,
    addRole,
    landRecords,
    application,
    bankBranch,
    uploadBranchReport,
    counter
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
    DATA_STATUS
} = require("../constants");
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
const _ = require('underscore');
async function getBulkUploadBranchId() {
    let applicationId = '';
    let counterObj = await counter.findOne({
        name: "BULK-BRANCH"
    });
    if (!counterObj) {
        let newCounter = new counter({
            name: "BULK-BRANCH",
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
class BranchService { }

BranchService.createBranch = async (payload) => {
    try {
        console.log("payload", payload);
        let checkUserExist = await bankBranch.findOne({
            branchCode: payload.branchCode
        })
        if (checkUserExist) {
            console.log("1")
            return {
                status: false,
                message: "branchCode Already Exists"
            }
        } else {
            console.log("2")
            let data = await bankBranch.create(payload)
            let array =[];
            let manager={}
            manager.emailId = `${payload.branchCode}_DM@agrotechindia.com`
            manager.name = payload.branchName;
            manager.password = genHash("Test@123");
            manager.roleId = "ROLE_9";
            manager.role ="Branch Manager"
            manager.branchCode = payload.branchCode;
            manager.status = "APPROVED";
            array.push(manager)
            let bankExecutive={}
            bankExecutive.name = payload.branchName;
            bankExecutive.password = genHash("Test@123");
            bankExecutive.roleId = "ROLE_8";
            bankExecutive.role ="Bank Executive"
            bankExecutive.branchCode = payload.branchCode;
            bankExecutive.status = "APPROVED";
            array.push(bankExecutive)
            let user = await admin.insertMany(array)
            return {
                status: true,
                message: "Branch Created Successfully",
                data: data
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
BranchService.editBranch = async (payload, id) => {
    try {
        console.log("payload", payload, id);
        let checkUserExist = await bankBranch.findOne({
            _id: id
        })
        if (!checkUserExist) {
            return {
                status: false,
                message: "Branch Not Exists"
            }
        } else {
            let data = await bankBranch.findByIdAndUpdate(id, payload)
            let result = await bankBranch.findById(id)
            return {
                status: true,
                message: "Branch Updated Successfully",
                data: result
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
BranchService.deleteBranch = async (id) => {
    try {
        let Application = await bankBranch.findOne({
            _id: id
        });
        if (!Application) {
            return {
                status: false,
                message: "Branch not found"
            };
        } else {
            await bankBranch.deleteOne({
                _id: id
            });
            await admin.deleteMany({branchCode:Application.branchCode})
            return {
                status: true,
                message: "Branch Deleted Successfully"
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
BranchService.getBranch = async (query, limit, page) => {
    try {
        console.log(limit, page)
        let obj = {};
        let land, countDoc;
        if (query.search) {
            obj.$or = [{
                branchCode: {
                    $regex: query.search,
                    $options: 'i'
                }
            },
            {
                branchName: {
                    $regex: query.search,
                    $options: 'i'
                }
            },
            {
                district: {
                    $regex: query.search,
                    $options: 'i'
                }
            }
            ]
        }
        let sort
        if (query.branchName) {
            sort = {
                branchName: query.branchName
            }
        }
        if (query.branchCode) {
            sort = {
                branchCode: query.branchCode
            }
        }
        if (query.AO) {
            sort = {
                AO: query.AO
            }
        }
        if (query.RBO) {
            sort = {
                RBO: query.RBO
            }
        }
        if (query.district) {
            sort = {
                district: query.district
            }
        }
        if (query.numberOfApplications) {
            sort = {
                numberOfApplications: query.numberOfApplications
            }
        }
        if(sort){
            countDoc = await bankBranch.countDocuments(obj)
            land = await bankBranch.find(obj)
                .lean()
                .skip(parseInt(limit * (page - 1)))
                .limit(limit)
                .sort(sort);

                if(land.length>0){
                    for(let branchCodes of land){
                        let branchStats = [];
                        let total = await application.countDocuments({ bankBranchCode: branchCodes.branchCode });
                        let approved = await application.countDocuments({ bankBranchCode: branchCodes.branchCode, status: "APPROVED" });
                        let pending = await application.countDocuments({ bankBranchCode: branchCodes.branchCode, status: "PENDING" });
                        let rejected = await application.countDocuments({ bankBranchCode: branchCodes.branchCode, status: "REJECTED" });
                        let approvedReports = await application.countDocuments({ bankBranchCode: branchCodes.branchCode, status: "APPROVED", reportApprovalStatus: "APPROVED" });
                        let pendingReports = await application.countDocuments({ bankBranchCode: branchCodes.branchCode, status: "PENDING", reportApprovalStatus: "PENDING" });
                        branchStats.push({
                            _id: "TOTAL",
                            value: total
                        });
                        branchStats.push({
                            _id: "PENDING",
                            value: pending
                        });
                        branchStats.push({
                            _id: "APPROVED",
                            value: approved
                        });
                        branchStats.push({
                            _id: "REJECTED",
                            value: rejected
                        });
                        branchStats.push({
                            _id: "APPROVED REPORTS",
                            value: approvedReports
                        });
                        branchStats.push({
                            _id: "PENDING REPORTS",
                            value: pendingReports
                        });
                        branchCodes.applicationStats = branchStats;
                    }
                    return {
                        status: true,
                        message: "Data Fetched Successfully",
                        data: pagingData(land, page, limit, countDoc)
                    }
                }
                    return {
                        status: false,
                        message: "Branch not found"
                    };
        }else{
            countDoc = await bankBranch.countDocuments(obj)
            land = await bankBranch.find(obj)
                .lean()
                .skip(parseInt(limit * (page - 1)))
                .limit(limit)
                .sort({
                    'createdAt': -1
                });
                if(land.length>0){
                    for(let branchCodes of land){
                        let branchStats = [];
                        let total = await application.countDocuments({ bankBranchCode: branchCodes.branchCode });
                        let approved = await application.countDocuments({ bankBranchCode: branchCodes.branchCode, status: "APPROVED" });
                        let pending = await application.countDocuments({ bankBranchCode: branchCodes.branchCode, status: "PENDING" });
                        let rejected = await application.countDocuments({ bankBranchCode: branchCodes.branchCode, status: "REJECTED" });
                        let approvedReports = await application.countDocuments({ bankBranchCode: branchCodes.branchCode, status: "APPROVED", reportApprovalStatus: "APPROVED" });
                        let pendingReports = await application.countDocuments({ bankBranchCode: branchCodes.branchCode, status: "PENDING", reportApprovalStatus: "PENDING" });
                        branchStats.push({
                            _id: "TOTAL",
                            value: total
                        });
                        branchStats.push({
                            _id: "PENDING",
                            value: pending
                        });
                        branchStats.push({
                            _id: "APPROVED",
                            value: approved
                        });
                        branchStats.push({
                            _id: "REJECTED",
                            value: rejected
                        });
                        branchStats.push({
                            _id: "APPROVED REPORTS",
                            value: approvedReports
                        });
                        branchStats.push({
                            _id: "PENDING REPORTS",
                            value: pendingReports
                        });
                        branchCodes.applicationStats = branchStats;
                    }
                    return {
                        status: true,
                        message: "Data Fetched Successfully",
                        data: pagingData(land, page, limit, countDoc)
                        // data:land
                    }
                }
                    return {
                        status: false,
                        message: "Branch not found"
                    };
            }
        
        
        
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
BranchService.getBranchById = async (id) => {
    try {
        if (!id) {
            return {
                status: false,
                message: "Required fields"
            };
        }
        let land = await bankBranch.findOne({
            _id: id
        });
        let branchStats = [];

        let total = await application.countDocuments({ bankBranchCode: land.branchCode });
        if(total==0){
            branchStats.push({
                _id: "TOTAL",
                value: 0,
                percentage: `0%`
            });
            branchStats.push({
                _id: "PENDING",
                value: 0,
                color : "GREEN",
                percentage:`0%` 
            });
            branchStats.push({
                _id: "APPROVED",
                value: 0,
                color : "RED",
                percentage:`0%`
            });
            branchStats.push({
                _id: "REJECTED",
                value: 0,
                color : "RED",
                percentage:`0%`
            });
            branchStats.push({
                _id: "APPROVED REPORTS",
                value: 0,
                color: "RED",
                percentage: `0%`
            });
            branchStats.push({
                _id: "PENDING REPORTS",
                value: 0,
                color: "GREEN",
                percentage:`0%`
            });
            land.applicationStats = branchStats;
            return {
                status: true,
                message: "Get Count Successfully",
                data: land
            };
        }
       // let count = parseInt(applicationCount.numberOfApplications)
        let totalPercentage = ((total/land.numberOfApplications)*100).toFixed(2);
        let approved = await application.countDocuments({ bankBranchCode: land.branchCode, status: "APPROVED" });
        let approvedPercentage = ((approved/parseInt(total))*100).toFixed(2);
        let pending = await application.countDocuments({ bankBranchCode: land.branchCode, status: "PENDING" });
        let pendingPercentage = ((pending/total)*100).toFixed(2);
        let rejected = await application.countDocuments({ bankBranchCode: land.branchCode, status: "REJECTED" });
        let rejectedPercentage = ((rejected/total)*100).toFixed(2);
        let approveColor;
        if (approvedPercentage == 0 ){
            approveColor = "RED";
        } else if (approvedPercentage <= 25 ){
            approveColor = "ORANGE";
        } else if( approvedPercentage <= 50 ){
            approveColor = "YELLOW";
        } else if ( approvedPercentage <= 75 ){
            approveColor = "LIGHT GREEN";
        } else if( approvedPercentage <= 100 ){
            approveColor = "GREEN";
        }
        let pendingColor;
        if (pendingPercentage == 0 ){
            pendingColor = "GREEN";
        } else if (pendingPercentage <= 25 ){
            pendingColor = "LIGHT GREEN";
        } else if( pendingPercentage <= 50 ){
            pendingColor = "YELLOW";
        } else if ( pendingPercentage <= 75 ){
            pendingColor = "ORANGE";
        } else if( pendingPercentage <= 100 ){
            pendingColor = "RED";
        }
        let rejectedColor
        if (rejectedPercentage == 0 ){
            rejectedColor = "RED";
        } else if (rejectedPercentage <= 25 ){
            rejectedColor = "RED";
        } else if( rejectedPercentage <= 50 ){
            rejectedColor = "RED";
        } else if ( rejectedPercentage <= 75 ){
            rejectedColor = "RED";
        } else if( rejectedPercentage <= 100 ){
            rejectedColor = "RED";
        }

        //reports
        let approvedReports = await application.countDocuments({ bankBranchCode: land.branchCode, status: "APPROVED", reportApprovalStatus: "APPROVED" });
        let approvedReportsPercentage = ((approvedReports/parseInt(total))*100).toFixed(2);
        let pendingReports = await application.countDocuments({ bankBranchCode: land.branchCode, status: "PENDING", reportApprovalStatus: "PENDING" });
        let pendingReportsPercentage = ((pendingReports/parseInt(total))*100).toFixed(2);
        
        let approveReportColor
        if (approvedReportsPercentage == 0 ){
            approveReportColor = "RED";
        } else if (approvedReportsPercentage <= 25 ){
            approveReportColor = "ORANGE";
        } else if( approvedReportsPercentage <= 50 ){
            approveReportColor = "YELLOW";
        } else if ( approvedReportsPercentage <= 75 ){
            approveReportColor = "LIGHT GREEN";
        } else if( approvedReportsPercentage <= 100 ){
            approveReportColor = "GREEN";
        }
        let pendingReportColor
        if (pendingReportsPercentage == 0 ){
            pendingReportColor = "GREEN";
        } else if (pendingReportsPercentage <= 25 ){
            pendingReportColor = "LIGHT GREEN";
        } else if( pendingReportsPercentage <= 50 ){
            pendingReportColor = "YELLOW";
        } else if ( pendingReportsPercentage <= 75 ){
            pendingReportColor = "ORANGE";
        } else if( pendingReportsPercentage <= 100 ){
            pendingReportColor = "RED";
        }
        //
        branchStats.push({
            _id: "TOTAL",
            value: total,
            percentage: totalPercentage
        });
        branchStats.push({
            _id: "PENDING",
            value: pending,
            color: pendingColor,
            percentage:pendingPercentage 
        });
        branchStats.push({
            _id: "APPROVED",
            value: approved,
            color: approveColor,
            percentage:approvedPercentage
        });
        branchStats.push({
            _id: "REJECTED",
            value: rejected,
            color: rejectedColor,
            percentage:rejectedPercentage
        });
        branchStats.push({
            _id: "APPROVED REPORTS",
            value: approvedReports,
            color: approveReportColor,
            percentage: approvedReportsPercentage
        });
        branchStats.push({
            _id: "PENDING REPORTS",
            value: pendingReports,
            color: pendingReportColor,
            percentage:pendingReportsPercentage
        });
        land.applicationStats = branchStats;
        if (!land) {
            return {
                status: false,
                message: "Branch not found"
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
BranchService.getBranchByBranchCode = async (branchCode) => {
    try {
        if (!branchCode) {
            return {
                status: false,
                message: "branchCode Required in Token"
            };
        }
        let land = await bankBranch.findOne({
            branchCode:branchCode
        });
        let branchStats = [];

        let total = await application.countDocuments({ bankBranchCode: land.branchCode });
        if(total==0){
            branchStats.push({
                _id: "EXPECTED APPLICATION",
                value: land.numberOfApplications,
                
            });
            branchStats.push({
                _id: "RECIEVED APPLICATION",
                value: 0,
                percentage: `0%`
            });
            branchStats.push({
                _id: "REPORT GENERATED",
                value: 0,
                color:"RED",
                percentage: `0%`
            });
            branchStats.push({
                _id: "PENDING",
                value: 0,
                color : "GREEN",
                percentage:`0%` 
            });
            branchStats.push({
                _id: "APPROVED",
                value: 0,
                color : "RED",
                percentage:`0%`
            });
            branchStats.push({
                _id: "REJECTED",
                value: 0,
                color : "RED",
                percentage:`0%`
            });
            branchStats.push({
                _id: "APPROVED REPORTS",
                value: 0,
                color: "RED",
                percentage: `0%`
            });
            branchStats.push({
                _id: "PENDING REPORTS",
                value: 0,
                color: "GREEN",
                percentage:`0%`
            });
            branchStats.push({
                _id: "REJECTED REPORTS",
                value: 0,
                color: "RED",
                percentage:`0%`
            });
            branchStats.push({
                _id: "COMMENTS ON REPORTS",
                value: 0,
                color: "GREEN",
                percentage:`0%`
            });
            land.applicationStats = branchStats;
            return {
                status: true,
                message: "Get Count Successfully",
                data: land
            };
        }
       // let count = parseInt(applicationCount.numberOfApplications)
        let totalPercentage = ((total/land.numberOfApplications)*100).toFixed(2);
        let approved = await application.countDocuments({ bankBranchCode: land.branchCode, status: "APPROVED" });
        let approvedPercentage = ((approved/parseInt(total))*100).toFixed(2);
        let pending = await application.countDocuments({ bankBranchCode: land.branchCode, status: "PENDING" });
        let pendingPercentage = ((pending/total)*100).toFixed(2);
        let rejected = await application.countDocuments({ bankBranchCode: land.branchCode, status: "REJECTED" });
        let rejectedPercentage = ((rejected/total)*100).toFixed(2);
        let applicationCommentCount = await application.countDocuments({
            bankBranchCode: land.branchCode,
            isNewComment:true
         })
         let commentPercentage = ((applicationCommentCount/total)*100).toFixed(2);
        let approveColor;
        if (approvedPercentage == 0 ){
            approveColor = "RED";
        } else if (approvedPercentage <= 25 ){
            approveColor = "ORANGE";
        } else if( approvedPercentage <= 50 ){
            approveColor = "YELLOW";
        } else if ( approvedPercentage <= 75 ){
            approveColor = "LIGHT GREEN";
        } else if( approvedPercentage <= 100 ){
            approveColor = "GREEN";
        }
        let pendingColor;
        if (pendingPercentage == 0 ){
            pendingColor = "GREEN";
        } else if (pendingPercentage <= 25 ){
            pendingColor = "LIGHT GREEN";
        } else if( pendingPercentage <= 50 ){
            pendingColor = "YELLOW";
        } else if ( pendingPercentage <= 75 ){
            pendingColor = "ORANGE";
        } else if( pendingPercentage <= 100 ){
            pendingColor = "RED";
        }
        let rejectedColor
        if (rejectedPercentage == 0 ){
            rejectedColor = "RED";
        } else if (rejectedPercentage <= 25 ){
            rejectedColor = "RED";
        } else if( rejectedPercentage <= 50 ){
            rejectedColor = "RED";
        } else if ( rejectedPercentage <= 75 ){
            rejectedColor = "RED";
        } else if( rejectedPercentage <= 100 ){
            rejectedColor = "RED";
        }

        //reports
        let reportGenerated = await application.countDocuments({ bankBranchCode: land.branchCode, status: "APPROVED"});
        let reportGeneratedPercentage = ((reportGenerated/parseInt(total))*100).toFixed(2);
        let approvedReports = await application.countDocuments({ bankBranchCode: land.branchCode, status: "APPROVED", reportApprovalStatus: "APPROVED" });
        let approvedReportsPercentage = ((approvedReports/parseInt(reportGenerated))*100).toFixed(2);
        let pendingReports = await application.countDocuments({ bankBranchCode: land.branchCode, status: "APPROVED", reportApprovalStatus: "PENDING" });
        let pendingReportsPercentage = ((pendingReports/parseInt(reportGenerated))*100).toFixed(2);
        let RejectedReports = await application.countDocuments({ bankBranchCode: land.branchCode, status: "APPROVED", reportApprovalStatus: "REJECTED" });
        let rejectReportsPercentage = ((RejectedReports/parseInt(reportGenerated))*100).toFixed(2);
        
        let approveReportColor
        if (approvedReportsPercentage == 0 ){
            approveReportColor = "RED";
        } else if (approvedReportsPercentage <= 25 ){
            approveReportColor = "ORANGE";
        } else if( approvedReportsPercentage <= 50 ){
            approveReportColor = "YELLOW";
        } else if ( approvedReportsPercentage <= 75 ){
            approveReportColor = "LIGHT GREEN";
        } else if( approvedReportsPercentage <= 100 ){
            approveReportColor = "GREEN";
        }
        let pendingReportColor
        if (pendingReportsPercentage == 0 ){
            pendingReportColor = "GREEN";
        } else if (pendingReportsPercentage <= 25 ){
            pendingReportColor = "LIGHT GREEN";
        } else if( pendingReportsPercentage <= 50 ){
            pendingReportColor = "YELLOW";
        } else if ( pendingReportsPercentage <= 75 ){
            pendingReportColor = "ORANGE";
        } else if( pendingReportsPercentage <= 100 ){
            pendingReportColor = "RED";
        }
        let reportGeneratedColor
        if (reportGeneratedPercentage == 0 ){
            reportGeneratedColor = "RED";
        } else if (reportGeneratedPercentage <= 25 ){
            reportGeneratedColor = "ORANGE";
        } else if( reportGeneratedPercentage <= 50 ){
            reportGeneratedColor = "YELLOW";
        } else if ( reportGeneratedPercentage <= 75 ){
            reportGeneratedColor = "LIGHT GREEN";
        } else if( reportGeneratedPercentage <= 100 ){
            reportGeneratedColor = "GREEN";
        }
        let rejectReportColor
        if (rejectReportsPercentage == 0 ){
            rejectReportColor = "RED";
        } else if (rejectReportsPercentage <= 25 ){
            rejectReportColor = "ORANGE";
        } else if( rejectReportsPercentage <= 50 ){
            rejectReportColor = "YELLOW";
        } else if ( rejectReportsPercentage <= 75 ){
            rejectReportColor = "LIGHT GREEN";
        } else if( rejectReportsPercentage <= 100 ){
            rejectReportColor = "GREEN";
        }
        //
        //comentsColour
        let commentColor
        if (commentPercentage == 0 ){
            commentColor = "RED";
        } else if (commentPercentage <= 25 ){
            commentColor = "ORANGE";
        } else if( commentPercentage <= 50 ){
            commentColor = "YELLOW";
        } else if ( commentPercentage <= 75 ){
            commentColor = "LIGHT GREEN";
        } else if( commentPercentage <= 100 ){
            commentColor = "GREEN";
        }
        branchStats.push({
            _id: "EXPECTED APPLICATION",
            value: land.numberOfApplications
        });
        branchStats.push({
            _id: "RECIEVED APPLICATION",
            value: total,
            percentage: totalPercentage
        });
        branchStats.push({
            _id: "REPORT GENERATED",
            value: reportGenerated ,
            color:reportGeneratedColor,
            percentage: reportGeneratedPercentage
        });
        branchStats.push({
            _id: "PENDING",
            value: pending,
            color: pendingColor,
            percentage:pendingPercentage 
        });
        branchStats.push({
            _id: "APPROVED",
            value: approved,
            color: approveColor,
            percentage:approvedPercentage
        });
        branchStats.push({
            _id: "REJECTED",
            value: rejected,
            color: rejectedColor,
            percentage:rejectedPercentage
        });
        branchStats.push({
            _id: "APPROVED REPORTS",
            value: approvedReports,
            color: approveReportColor,
            percentage: approvedReportsPercentage
        });
        branchStats.push({
            _id: "PENDING REPORTS",
            value: pendingReports,
            color: pendingReportColor,
            percentage:pendingReportsPercentage
        });
        branchStats.push({
            _id: "REJECTED REPORTS",
            value: RejectedReports,
            color: rejectReportColor,
            percentage:rejectReportsPercentage
        });
        branchStats.push({
            _id: "COMMENTS ON REPORTS",
            value: applicationCommentCount,
            color: commentColor,
            percentage:commentPercentage
        });
        land.applicationStats = branchStats;
        if (!land) {
            return {
                status: false,
                message: "Branch not found"
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
BranchService.getBranchByCode = async (branchCode) => {
    try {
        if (!branchCode) {
            return {
                status: false,
                message: "Required fields"
            };
        }
        let count = await application.countDocuments({bankBranchCode:branchCode})
        let land = await bankBranch.findOne({
            branchCode: branchCode
        }).lean();
        land.appicationRecieved=count
        if (!land) {
            return {
                status: false,
                message: "Branch not found"
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

BranchService.getDistrict = async (query) => {
    try {
        let obj = {};
        let district, countDoc;

        if (query.search) {
            obj.district = {
                $regex: query.search,
                $options: 'i'
            }
        }

        countDoc = await bankBranch.countDocuments(obj);
        district = await bankBranch.distinct('district', obj);

        if (!district) {
            return {
                status: false,
                message: "District not found"
            };
        }

        return {
            status: true,
            message: "Data Fetched Successfully",
            data: district
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
BranchService.getBranchCode = async (query) => {
    try {
        let obj = {};
        let district, countDoc;

        if (query.search) {
            obj.branchCode = {
                $regex: query.search,
                $options: 'i'
            }
        }

        countDoc = await bankBranch.countDocuments(obj);
        district = await bankBranch.distinct('branchCode', obj);

        if (!district) {
            return {
                status: false,
                message: "Branch not found"
            };
        }

        return {
            status: true,
            message: "Data Fetched Successfully",
            data: district
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}

BranchService.getBranchCount = async (condition) => {
    try {
        let { district, branchName, branchCode } = condition;
        console.log("The following are the passed conditions", condition)
        let branchCount = {};
        if(district) {
            let districtBranches = await bankBranch.find({
                district: district
            }).countDocuments();
            branchCount.district = districtBranches;
            branchCount.totalBranches = await bankBranch.countDocuments();
            if(!districtBranches) {
                return {
                    status: false,
                    message: "Branch not found for the districts",
                };
            } else {
                return {
                    status: true,
                    message: "Data Fetched Successfully",
                    data: branchCount
                }
            } 
        } else {
            let totalBranchCount = await bankBranch.countDocuments();
            branchCount.totalBranches = totalBranchCount;
            if(!totalBranchCount) {
                return {
                    status: false,
                    message: "Branch not found",
                };
            }
            return {
                status: true,
                message: "Data Fetched Successfully",
                data: branchCount
            }
        }
    } catch (err) {
        console.log("error", err);
        throw new Error(JSON.stringify(err))
    }
}
BranchService.getApplicationCountByDistrict = async (condition) => {
    try {
        // let lands = await bankBranch.aggregate([
        //     {
        //         $group: {
        //             _id: '$district',
        //              'Total': {$sum:{ '$toInt': '$numberOfApplications'}}
        //         }
        //     },
        //     { $sort : { _id : 1 } }
        //  ])
         let applicationCount = await application.aggregate([
                {
                    $group: {
                        _id: '$district',
                         'Total': {$sum:1}
                    }
                },
                { $sort : { _id : 1 } }
            ])
        //     console.log(applicationCount)
        // let lands = await bankBranch.aggregate([
        //     {$match:{}},
        //     {
        //         $lookup:{
        //             from: "applications",       // other table name
        //             localField: "branchCode",   // name of users table field
        //             foreignField: "bankBranchCode", // name of userinfo table field
        //             as: "ApplicationDetails"         // alias for userinfo table
        //         }
        //     },
        //     {   $unwind:"$ApplicationDetails" }, 
        //     {"$group" : { _id: '$ApplicationDetails.bankBranchCode',
        //                'count':{$sum:1}}},
        //                {
        //                 $project:{
        //                     district:1,
        //                     count:1
        //                 }
        //                }
           
        // ])
        //  console.log(lands)
        return {
                    status: true,
                    message: "Data Fetched Successfully",
                    data:applicationCount
                }
               
    } catch (err) {
        console.log("error", err);
        throw new Error(JSON.stringify(err))
    }
}

BranchService.createBulkBranch = async (allowedData,errorData,allowedDataCount,errorDataCount) => {
    try {
        //console.log(payload[0]);
        let bulkUploadId = await getBulkUploadBranchId();
        if(allowedData.length && !errorData.length){
            for(let branch of allowedData){
                
                branch.bulkUploadId=bulkUploadId
                branch.isBulkUpload=true
                await bankBranch.create(branch)
                let array =[];
                let manager={}
                manager.emailId = `${branch.branchCode}_DM@agrotechindia.com`
                manager.name = branch.branchName;
                manager.password = genHash("Test@123");
                manager.roleId = "ROLE_9";
                manager.role ="Branch Manager"
                manager.branchCode = branch.branchCode;
                manager.status = "APPROVED";

                array.push(manager)

                let bankExecutive={}
                bankExecutive.name = branch.branchName;
                bankExecutive.password = genHash("Test@123");
                bankExecutive.roleId = "ROLE_8";
                bankExecutive.role ="Bank Executive"
                bankExecutive.branchCode = branch.branchCode;
                bankExecutive.status = "APPROVED";
                array.push(bankExecutive)
                await admin.insertMany(array)
            }
            let updateReport = {
                createdApplication: allowedData,
                createdApplicationCount: allowedDataCount,
                updatedApplication: errorData,
                updatedApplicationCount: errorDataCount,
                bulkUploadId: bulkUploadId
            };
            let finalReport = await uploadBranchReport.create(updateReport)
            return {
                    status: true,
                    message: "Branch Created Successfully",
                    data: updateReport
                }
        }
        else if(allowedData.length && errorData.length){
            for(let branch of allowedData){
                branch.bulkUploadId=bulkUploadId
                branch.isBulkUpload=true
                await bankBranch.create(branch)
                let array =[];
                let manager={}
                manager.emailId = `${branch.branchCode}_DM@agrotechindia.com`
                manager.name = branch.branchName;
                manager.password = genHash("Test@123");
                manager.roleId = "ROLE_9";
                manager.role ="Branch Manager"
                manager.branchCode = branch.branchCode;
                manager.status = "APPROVED";

                array.push(manager)

                let bankExecutive={}
                bankExecutive.name = branch.branchName;
                bankExecutive.password = genHash("Test@123");
                bankExecutive.roleId = "ROLE_8";
                bankExecutive.role ="Bank Executive"
                bankExecutive.branchCode = branch.branchCode;
                bankExecutive.status = "APPROVED";
                array.push(bankExecutive)
                await admin.insertMany(array)
            }
            for(let Branch of errorData){
                Branch.bulkUploadId=bulkUploadId
                Branch.isBulkUpload=true
                await bankBranch.updateOne({branchCode:Branch.branchCode},{$set:{Branch}})
            }
            let updateReport = {
                createdApplication: allowedData,
                createdApplicationCount: allowedDataCount,
                updatedApplication: errorData,
                updatedApplicationCount: errorDataCount,
                bulkUploadId: bulkUploadId
            };
            let finalReport = await uploadBranchReport.create(updateReport)
            return {
                    status: true,
                    message: "Branch Created & Updated Successfully",
                    data: updateReport
                }
        }else {
            for(let Branch of errorData){
                Branch.bulkUploadId=bulkUploadId
                Branch.isBulkUpload=true
                await bankBranch.updateOne({branchCode:Branch.branch},{$set:{Branch}})
            }
            let updateReport = {
                createdApplication: allowedData,
                createdApplicationCount: allowedDataCount,
                updatedApplication: errorData,
                updatedApplicationCount: errorDataCount,
                bulkUploadId: bulkUploadId
            };
            let finalReport = await uploadBranchReport.create(updateReport)
            return {
                    status: true,
                    message: "Branch Updated Successfully",
                    data: updateReport
                }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}

module.exports = BranchService;