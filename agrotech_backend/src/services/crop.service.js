const {
    user,
    permission,
    addRole,
    landRecords,
    crop,
    uploadCropReport,
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
    DATA_STATUS,
    SEARCH_TYPE,
	SEARCH_HEADERS_CROP
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
async function getBulkUploadCropId() {
    let applicationId = '';
    let counterObj = await counter.findOne({
        name: "BULK-CROP"
    });
    if (!counterObj) {
        let newCounter = new counter({
            name: "BULK-CROP",
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
class CropService { }
CropService.createCrop = async (payload) => {
    try {
        console.log("payload", payload);
       
            
            let data = await crop.create(payload)
            return {
                status: true,
                message: "Crop Created Successfully",
                data: data
            }
        
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
CropService.editCrop = async (payload, id) => {
    try {
        console.log("payload", payload, id);
        let checkUserExist = await crop.findOne({
            _id: id
        })
        if (!checkUserExist) {
            return {
                status: false,
                message: "Crop Not Exists"
            }
        } else {
           
            let data = await crop.findByIdAndUpdate(id, payload)
            return {
                status: true,
                message: "Crop Updated Successfully",
                data
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
CropService.deleteCrop = async (id) => {
    try {
        let land = await crop.findOne({
            _id: id
        });
        if (!land) {
            return {
                status: false,
                message: "Crop not found"
            };
        } else {
            await crop.deleteOne({
                _id: id
            });
            return {
                status: true,
                message: "Crop Deleted Successfully"
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
CropService.getCrop = async (query, limit, page) => {
    try {
        let obj = {};
        let land, countDoc;
        console.log(query)
        if (query.searchType == SEARCH_TYPE.NORMAL) {
           // console.log("NOrmal",limit)
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
        if(query.sort && query.sort !="ALL"){
            obj.district = {
                $regex: query.sort,
                $options: 'i'
            }
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
        let sort
        if(query.cadastralNo){
            sort ={cadastralNo:query.cadastralNo}
          }
          if(query.villaCad){
           sort ={villaCad:query.villaCad}
         }
         if(query.cropType){
            sort ={cropType:query.cropType}
          }
         if(query.state){
           sort ={state:query.state}
         }
         if(query.village){
           sort ={village:query.village}
         }
         if(query.mandal){
           sort ={mandal:query.mandal}
         }
         if(query.district){
           sort ={district:query.district}
         }
         
         if(sort){
             console.log("!@#",sort)
            countDoc = await crop.countDocuments(obj)
        land = await crop.find(obj)
            .skip(parseInt(limit * (page - 1)))
            .limit(limit)
            .sort(sort);

        if (!land) {
            return {
                status: false,
                message: "Crop not found"
            };
        }
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: pagingData(land, page, limit, countDoc)
        }
    } else if (limit == 0) {
       // console.log("!@#",sort)
        countDoc = await crop.countDocuments(obj)
        land = await crop.find(obj)
            .skip()
            .limit()
            .sort({
                'createdAt': -1
            });

        if (!land) {
            return {
                status: false,
                message: "Crop not found"
            };
        }
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: pagingData(land, page, limit, countDoc)
        }
    }else{
        countDoc = await crop.countDocuments(obj)
        land = await crop.find(obj)
            .skip(parseInt(limit * (page - 1)))
            .limit(limit)
            .sort({
                'createdAt': -1
            });

        if (!land) {
            return {
                status: false,
                message: "Crop not found"
            };
        }
       
        } 
        }else if (query.searchType == SEARCH_TYPE.DROPDOWN) { 
             //
             if (query.search) {
                if(!query.headerType){
                    return{
                        status:false,
                        message:"Please Enter headerType"
                    }
                }else{
                    obj.$or = [];
                if(query.headerType == SEARCH_HEADERS_CROP.STATE){
                    
                    obj.$or.push({
                        state: {
                            $regex: query.search,
                            $options: 'i'
                        }
                    })
                } else if(query.headerType == SEARCH_HEADERS_CROP.DISTRICT){
                    obj.$or.push({
                        district: {
                            $regex: query.search,
                            $options: 'i'
                        }
                    })
                } else if(query.headerType == SEARCH_HEADERS_CROP.MANDAL){
                    obj.$or.push({
                        mandal: {
                            $regex: query.search,
                            $options: 'i'
                        }
                    })
                }else if(query.headerType == SEARCH_HEADERS_CROP.VILLAGE){
                    obj.$or.push({
                        village: {
                            $regex: query.search,
                            $options: 'i'
                        }
                    })
                }else if(query.headerType == SEARCH_HEADERS_CROP.CADASTRAL_NUMBER){
                    obj.$or.push({
                        cadastralNo: {
                            $regex: query.search,
                            $options: 'i'
                        }
                    })
                } else if(query.headerType == SEARCH_HEADERS_CROP.VILLA_CAD){
                    obj.$or.push({
                        villaCad: {
                            $regex: query.search,
                            $options: 'i'
                        } 
                    })
                } else if(query.headerType == SEARCH_HEADERS_CROP.CROP_NAME){
                    obj.$or.push({
                        cropName: {
                            $regex: query.search,
                            $options: 'i'
                        }
                    })
                } else if(query.headerType == SEARCH_HEADERS_CROP.CROP_TYPE){
                    obj.$or.push({
                        cropType: {
                            $regex: query.search,
                            $options: 'i'
                        }
                    })
                }
              }
            }


            //
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
            let sort
            if(query.cadastralNo){
                sort ={cadastralNo:query.cadastralNo}
              }
              if(query.villaCad){
               sort ={villaCad:query.villaCad}
             }
             if(query.cropType){
                sort ={cropType:query.cropType}
              }
             if(query.state){
               sort ={state:query.state}
             }
             if(query.village){
               sort ={village:query.village}
             }
             if(query.mandal){
               sort ={mandal:query.mandal}
             }
             if(query.district){
               sort ={district:query.district}
             }
             
             if(sort){
                 console.log("!@#",sort)
                countDoc = await crop.countDocuments(obj)
            land = await crop.find(obj)
                .skip(parseInt(limit * (page - 1)))
                .limit(limit)
                .sort(sort);
    
            if (!land) {
                return {
                    status: false,
                    message: "Crop not found"
                };
            }
            return {
                status: true,
                message: "Data Fetched Successfully",
                data: pagingData(land, page, limit, countDoc)
            }
        }else if (limit == 0) {
            console.log("!@#",sort)
            countDoc = await crop.countDocuments(obj)
            land = await crop.find(obj)
                .skip()
                .limit()
                .sort({
                    'createdAt': -1
                });
    
            if (!land) {
                return {
                    status: false,
                    message: "Crop not found"
                };
            }
            return {
                status: true,
                message: "Data Fetched Successfully",
                data: pagingData(land, page, limit, countDoc)
            }
        }else{
            countDoc = await crop.countDocuments(obj)
            land = await crop.find(obj)
                .skip(parseInt(limit * (page - 1)))
                .limit(limit)
                .sort({
                    'createdAt': -1
                });
    
            if (!land) {
                return {
                    status: false,
                    message: "Crop not found"
                };
            }
           
            } 
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
CropService.getCropById = async (id) => {
    try {
        if (!id) {
            return {
                status: false,
                message: "required fields"
            };
        }
        let land = await crop.findOne({
            _id: id
        });
        if (!land) {
            return {
                status: false,
                message: "Crop not found"
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
CropService.getCropByCadastralNo = async (cadastralNo) => {
    try {
        if (!cadastralNo) {
            return {
                status: false,
                message: "required fields"
            };
        }
        let land = await crop.findOne({
            cadastralNo: cadastralNo
        });
        if (!land) {
            return {
                status: false,
                message: "Crop not found"
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
CropService.bulkCreateUpdateCrop = async (allowedData,errorData,allowedDataCount,errorDataCount) => {
    try {
       
        console.log("Hi",allowedData,errorData)
        let bulkUploadId = await getBulkUploadCropId();
        if(errorData.length && !allowedData.length  ){
            for(let Crop of errorData){
                Crop.isBulkUpload=true;
                Crop.bulkUploadId=bulkUploadId
                let updateBulk = await crop.updateOne({cadastralNo:Crop.cadastralNo},{$set:{Crop}})
            }
            let updateReport = {
                createdCrop: allowedData,
                createdCropCount: allowedDataCount,
                updatedCrop: errorData,
                updatedCropCount: errorDataCount,
                bulkUploadId: bulkUploadId
            };
            let finalReport = await uploadCropReport.create(updateReport)
            return{
                status:true,
                message:"data already exists updated Documents",
                data:updateReport
            }
        }else if(errorData.length && allowedData.length  ){
            for (let cropItem of allowedData){
                cropItem.isBulkUpload=true;
                cropItem.bulkUploadId=bulkUploadId
                let create = await crop.create(cropItem)
            }
            for(let Crop of errorData){
                Crop.isBulkUpload=true;
                Crop.bulkUploadId=bulkUploadId
                let updateBulk = await crop.updateOne({cadastralNo:Crop.cadastralNo},{$set:{Crop}})
            }
            
           let updateReport = {
            createdCrop: allowedData,
            createdCropCount: allowedDataCount,
            updatedCrop: errorData,
            updatedCropCount: errorDataCount,
            bulkUploadId: bulkUploadId
        };
        let finalReport = await uploadCropReport.create(updateReport)
             return {
                 status: true,
                 message: "Data created & Updated Successfully",
                 data: updateReport
             }
        }else{
        for (let cropItem of allowedData){
            cropItem.isBulkUpload=true;
            cropItem.bulkUploadId=bulkUploadId
            let create = await crop.create(cropItem)
        }
        let updateReport = {
            createdCrop: allowedData,
            createdCropCount: allowedDataCount,
            updatedCrop: errorData,
            updatedCropCount: errorDataCount,
            bulkUploadId: bulkUploadId
        };
        let finalReport = await uploadCropReport.create(updateReport)
        return {
            status: true,
            message: "Data Created Successfully",
            data: updateReport
        }
     }
    } catch (err) {
        console.log("error", err);
        throw new Error(JSON.stringify(err))
    }
}
CropService.getCount = async (districtName) => {
    try {
        if (!districtName) {
            return {
                status: false,
                message: "required fields"
            };
        }
        let lands = await crop.find({
            districtName
        });
        if (!lands) {
            return {
                status: false,
                message: "Crop not found"
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
CropService.getCropNameCount = async (districtName) => {
    try {
            let lands = await crop.aggregate([
                {
                    $group: {_id: {cropName: '$cropName'}, Total: {$sum: 1}}
                },
                {
                    $sort : { _id : 1 } 
                }
            ])
            let totalCropCount = await crop.count();
            for(let i = 0; i < lands.length; i++){
                lands[i].percentage = ((lands[i].Total/totalCropCount)*100).toFixed(2);
               
            }
            return {
                status: true,
                message: "Data Fetched Successfully",
                data: lands
            }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
// CropService.createBulkCropRecord = async (body) => {
//     try {
//         // body = body.map(b => {
//         //     b['landId'] = getLandId(b);
//         //     return b;
//         // });
//         let data = await landRecords.insertMany(body);
//         return {
//             status: true,
//             message: "Data Created Successfully",
//             data: data
//         }
//     } catch (error) {
//         console.log("error", error);
//         throw new Error(JSON.stringify(error))
//     }
// }
// CropService.deleteBulkLandRecords = async () => {
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
// CropService.getCropByCropId = async (landId) => {
//     try {
//         if (!landId) {
//             return {
//                 status: false,
//                 message: "required fields"
//             };
//         }
//         let land = await crop.findOne({ documentNumber: landId });
//         if (!land) {
//             return {
//                 status: false,
//                 message: "Crop not found"
//             };
//         }
//         return {
//             status: true,
//             message: "Data Fetched Successfully",
//             data: land
//         }
//     } catch (error) {
//         console.log("error", error);
//         throw new Error(JSON.stringify(error))
//     }
// }
// CropService.updateAllLandRecords = async () => {
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
module.exports = CropService;