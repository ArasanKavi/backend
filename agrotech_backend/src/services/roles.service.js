const { user,admin, permission, addRole, roleType, userSession, address, counter } = require('../database/models');
const {
    statusCodes,
    messages,
    config
} = require("../configs");
const bcrypt = require('bcrypt');
const { pagingData, pagination } = require("../utils");
const emailService = require('../utils/mailService');
const { generateAccessToken, genHash, } = require("../utils");
const { errorsWithOutReq } = require('../middleware/responses');
const { HTTP_BAD_REQUEST, HTTP_OK } = require('../configs/httpCodes');
const {
    errorObjGeneator
} = require("../middleware").errorHandler;

async function getPermissionId() {
    let applicationId = '';
    let counterObj = await counter.findOne({ name: "Permission" });
    if (!counterObj) {
        let newCounter = new counter({
            name: "Permission",
            seq: 2
        });
        applicationId = "APP01";
        await newCounter.save();
    }
    applicationId = counterObj.seq < 10 ? `PER0_${counterObj.seq}` : `PER_${counterObj.seq}`;
    counterObj.seq = counterObj.seq + 1;
    await counterObj.save();
    return applicationId;
}

class RolesService { }
RolesService.addPermission = async (payload) => {
    try {
        console.log("payload", payload);
        let checkUserExist = await permission.findOne({ name: payload.name });
        if (checkUserExist) {
            return {
                status: false,
                message: "permission Already Exists"
            }
        } else {
            const body = payload;
            body['permissionId'] = await getPermissionId();
            let data = await permission.create(body);
            let superAdminRole = await addRole.findOne({ roleName: 'Super Admin' });
            let superAdminPermissions = superAdminRole.permissions;
            let finded = superAdminPermissions.find( p => p === body.permissionId );
            if (!finded) {
                superAdminPermissions.push(body.permissionId);
            }
            await addRole.findByIdAndUpdate(superAdminRole._id, superAdminRole);
            return {
                status: true,
                message: "permission Created Successfully",
                data
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
RolesService.editPermission = async (payload, id) => {
    try {
        console.log("payload", payload, id);
        let checkUserExist = await permission.findOne({ _id: id })
        if (!checkUserExist) {
            return {
                status: false,
                message: "permission Not Exists"
            }
        } else {
            const body = payload
            let data = await permission.findByIdAndUpdate(id, payload)
            console.log("1", data)
            return {
                status: true,
                message: "permissionName Created Successfully",
                data
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
RolesService.getPermission = async (payload, id) => {
    try {
        let checkUserExist = await permission.find({})
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
RolesService.addRole = async (payload) => {
    try {
        console.log("payload", payload);
        let checkUserExist = await addRole.findOne({ roleName: payload.roleName });
        if (checkUserExist) {
            return {
                status: false,
                message: "RoleName Already Exists"
            }
        } else {
            const body = payload;
            let count = await addRole.findOne({},{roleId:1,roleName:1}).sort({ 'createdAt': -1 });
             let roleId = count.roleId
             let number = roleId.slice(5);
            body['roleId'] = `ROLE_${parseInt(number)+ 1}`;
            let data = await addRole.create(body);
            return {
                status: true,
                message: "Role Created Successfully",
                data
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
RolesService.getRole = async (search, limit, page) => {
    try {
        if (search == "ALL") {
            let countDoc = await addRole.countDocuments({ roleName: { $ne: "Super Admin" } });
            let checkUserExist = await addRole.find({ roleName: { $ne: "Super Admin" } })
                .skip(parseInt(limit * (page - 1)))
                .limit(limit)
                .sort({ 'createdAt': -1 })
            console.log(checkUserExist)
            return {
                status: true,
                message: "Data Fetched Successfully",
                data: pagingData(checkUserExist, page, limit, countDoc)
            }
        } else {
            //let countDoc = await addRole.countDocuments({ roleName: { $regex: search, $options: 'i' } })
            let checkUserExist = await addRole.find({ roleName: { $regex: search, $options: 'i' } })
                .skip(parseInt(limit * (page - 1)))
                .limit(limit)
                .sort({ 'createdAt': -1 })
                let result = checkUserExist.filter(function (el) {
                    return el.roleName!= 'Super Admin';
                });
                let countDoc =result.length
            return {
                status: true,
                message: "Data Fetched Successfully",
                data: pagingData(result, page, limit, countDoc)
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
RolesService.getRolebyId = async (id) => {
    try {
        if (!id) {
            return {
                status: false,
                message: "required fields"
            };
        }
        let role = await addRole.findOne({ _id: id });
        if (!role) {
            return {
                status: false,
                message: "Role not found"
            };
        }
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: role
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
RolesService.updateRole = async (payload, id) => {
    try {
        if (!id) {
            return {
                status: false,
                message: "required fields"
            };
        }
        let role = await addRole.findOne({ _id: id });
        if (!role) {
            return {
                status: false,
                message: "Role not found"
            };
        }
        let data = await addRole.findByIdAndUpdate(id, payload);
        //await admin.updateMany({roleId:role.roleId},{ $set: { roleId: payload.roleId, role:payload.roleName }})
        return {
            status: true,
            message: "Role Updated Successfully",
            data
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
RolesService.deleteRole = async (id) => {
    try {
        if (!id) {
            return {
                status: false,
                message: "required fields"
            };
        }
        let role = await addRole.findOne({ _id: id });
        if (!role) {
            return {
                status: false,
                message: "Role not found"
            };
        }
        await addRole.deleteOne({ _id: id });
       // await admin.updateMany({roleId:role.roleId},{ $set: {  roleId: "",role:"" }})
        return {
            status: true,
            message: "Role Deleted Successfully"
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
RolesService.addRoleType = async (payload) => {
    try {
        console.log("payload", payload);
        let checkUserExist = await roleType.findOne({ roleType: payload.roleType })
        if (checkUserExist) {
            return {
                status: false,
                message: "RoleName Already Exists"
            }
        } else {
            const body = payload
            let data = await roleType.create(body)
            console.log("1", data)
            return {
                status: true,
                message: "Role Created Successfully",
                data
            }
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
RolesService.getRoleType = async (search) => {
    try {
        let checkUserExist = await roleType.find({})
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
RolesService.getRoleTypebyId = async (id) => {
    try {
        if (!id) {
            return {
                status: false,
                message: "required fields"
            };
        }
        let role = await roleType.findOne({ _id: id });
        if (!role) {
            return {
                status: false,
                message: "Role not found"
            };
        }
        return {
            status: true,
            message: "Data Fetched Successfully",
            data: role
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
RolesService.updateRoleType = async (payload, id) => {
    try {
        if (!id) {
            return {
                status: false,
                message: "required fields"
            };
        }
        let role = await roleType.findOne({ _id: id });
        if (!role) {
            return {
                status: false,
                message: "Role not found"
            };
        }
        await roleType.findByIdAndUpdate(id, payload);
        return {
            status: true,
            message: "Role Updated Successfully"
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
RolesService.deleteRoleType = async (id) => {
    try {
        if (!id) {
            return {
                status: false,
                message: "required fields"
            };
        }
        let role = await roleType.findOne({ _id: id });
        if (!role) {
            return {
                status: false,
                message: "Role not found"
            };
        }
        await roleType.deleteOne({ _id: id });
        return {
            status: true,
            message: "Role Deleted Successfully"
        }
    } catch (error) {
        console.log("error", error);
        throw new Error(JSON.stringify(error))
    }
}
module.exports = RolesService;