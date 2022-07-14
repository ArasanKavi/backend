const {
    user,
    permission,
    addRole,
    landRecords,
    userSession,
    address
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
const excel = require("exceljs");
function getLandId(payload) {
    let landId = '';
    if (payload.districtName && payload.zoneName && payload.villageName) {
        let districtShortName = payload.districtName.slice(0, 2).toUpperCase();
        let zoneShortName = payload.zoneName.slice(0, 2).toUpperCase();
        let villageShortName = payload.villageName.slice(0, 2).toUpperCase();
        landId = `${districtShortName}${zoneShortName}${villageShortName}${payload.surveyNo}`;
    }
    return landId;
}
let documentRecursive = async (count) => {
    count = count + 1;
    let documentNumber = "ASDGH2022" + count;
    let checkIfDocumentExists = await LandService.getLandByLandId(documentNumber);
    if (checkIfDocumentExists && checkIfDocumentExists.data) {
        return await documentRecursive(count)
    } else {
        console.log("Lead order Id final", documentNumber)
        return documentNumber;
    }
}
class LandService { }
LandService.createLand = async (payload) => {
    try {
        console.log("payload", payload);
        let checkUserExist = await landRecords.findOne({
            surveyNo: payload.surveyNo
        })
        if (checkUserExist) {
            return {
                status: false,
                message: "SurveyNo Already Exists"
            }
        } else {
            payload['landId'] = getLandId(payload);
            let data = await landRecords.create(payload)
            return {
                status: true,
                message: "Land Created Successfully",
                data: data
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
LandService.editLand = async (payload, id) => {
    try {
        console.log("payload", payload, id);
        let checkUserExist = await landRecords.findOne({
            _id: id
        })
        if (!checkUserExist) {
            return {
                status: false,
                message: "LandRecords Not Exists"
            }
        } else {
            payload['landId'] = getLandId(payload);
            let data = await landRecords.findByIdAndUpdate(id, payload)
            return {
                status: true,
                message: "LandRecords Updated Successfully",
                data
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
LandService.deleteLand = async (id) => {
    try {
        let land = await landRecords.findOne({
            _id: id
        });
        if (!land) {
            return {
                status: false,
                message: "Land not found"
            };
        } else {
            await landRecords.deleteOne({
                _id: id
            });
            return {
                status: true,
                message: "Land Deleted Successfully"
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
LandService.getLand = async (query, limit, page) => {
    try {
        let obj = {};
        let land, countDoc;
        query.branchCode ? obj.branchCode = query.branchCode : "";
        if (query.search) {
            obj.$or = [
                {
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
                }
            ]
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
        
        countDoc = await landRecords.countDocuments(obj)
        land = await landRecords.find(obj)
            .skip(parseInt(limit * (page - 1)))
            .limit(limit)
            .sort({
                'createdAt': -1
            });

        if (!land) {
            return {
                status: false,
                message: "Land not found"
            };
        }
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: pagingData(land, page, limit, countDoc)
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
LandService.getLandById = async (id) => {
    try {
        if (!id) {
            return {
                status: false,
                message: "required fields"
            };
        }
        let land = await landRecords.findOne({
            _id: id
        });
        if (!land) {
            return {
                status: false,
                message: "Land not found"
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
LandService.bulkCreateUpdateLands = async (payload) => {
    try {
        payload.forEach(async (data) => {
            data['landId'] = getLandId(data);
        })
        let bulkUploadData = await landRecords.insertMany(payload);
        console.log("The following is the bulkUploadData", bulkUploadData);
        return {
            status: true,
            message: "Data Updated Successfully",
            data: bulkUploadData
        }
    } catch (err) {
        console.log("error", err);
        throw new Error(JSON.stringify(err))
    }
}
LandService.getCount = async (districtName) => {
    try {
        if (!districtName) {
            return {
                status: false,
                message: "required fields"
            };
        }
        let lands = await landRecords.find({
            districtName
        });
        if (!lands) {
            return {
                status: false,
                message: "Land not found"
            };
        }
        var groupByZoneName = _.groupBy(lands, 'zoneName');
        let data = Object.keys(groupByZoneName).map(z => {
            let obj = {
                zoneName: z,
                villageCount: groupByZoneName[z].length
            }
            return obj;
        });
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: {
                totalZoneCount: data.length,
                totalVillageCount: lands.length,
                zoneData: data
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
LandService.createBulkLandRecord = async (body) => {
    try {
        body = body.map(b => {
            b['landId'] = getLandId(b);
            return b;
        });
        let data = await landRecords.insertMany(body);
        return {
            status: true,
            message: "Data Created Successfully",
            data: data
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
// LandService.deleteBulkLandRecords = async () => {
//     try {
//         let data = await landRecords.find({ landDescription : "Total nacreage"})
//         if(data.length > 0){
//             data.forEach(async (d) => {
//                 await landRecords.deleteOne({ _id: d._id })
//             });
//             return {
//                 status: true,
//                 message: "Data Deleted Successfully"
//             }
//         }
//     } catch (error) {
//         console.log("error", error);
//         throw new Error(JSON.stringify(error))
//     }
// }
LandService.getLandByLandId = async (landId) => {
    try {
        if (!landId) {
            return {
                status: false,
                message: "required fields"
            };
        }
        let land = await landRecords.findOne({ documentNumber: landId });
        if (!land) {
            return {
                status: false,
                message: "Land not found"
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
// LandService.updateAllLandRecords = async () => {
//     try {
//         let data = await landRecords.find({});
//         let count = 0;
//         let totalLandCount = await landRecords.countDocuments({});
//         console.log("The following is the data length", data.length);
//         data.forEach(async (d) => {
//             d['documentNumber'] = await documentRecursive(totalLandCount);
//             await landRecords.updateOne({
//                 _id: d._id,
//             }, d);
//             count++;
//         })
//         console.log("Total Number of processed documents", count);
//         return {
//             status: true,
//             message: "Data Updated Successfully",
//         }
//     } catch (error) {
//         console.log("error", error);
//         throw new Error(JSON.stringify(error))
//     }
// }
module.exports = LandService;