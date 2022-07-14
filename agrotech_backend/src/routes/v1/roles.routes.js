const { verifyToken, verifySession } = require("../../middleware");
const { rolesController } = require("../../controllers/index");
const { verifyUserToken } = require('../../hooks');

const express = require("express");
const rolesRoutes = express.Router();

let validator = require('express-joi-validation').createValidator({
    passError: true
});

const {
    addPermission,
    editPermission,
    addRoleType,
    updateRoleType,
    getRoleTypeById,
    addRole,
    updateRole,
    getRolebyId,
    deleteRole
} = require('../../validators/roles.validator');

//rolesRoutes.get('/approvalPending/list', userController.getPendingList);
//rolesRoutes.put('/approveStatus', userController.approveStatus);

//permission
rolesRoutes.post('/addPermission', addPermission, rolesController.addPermission);
rolesRoutes.put('/editpermission', editPermission, rolesController.editPermission);
rolesRoutes.get('/getpermission', rolesController.getPermission);
//roleType
rolesRoutes.post('/addRoleType', addRoleType, rolesController.addRoleType)
rolesRoutes.get('/getRoleType', rolesController.getRoleType);
rolesRoutes.put('/updateRoleType/:id', updateRoleType, rolesController.updateRoleType);
rolesRoutes.get('/getRoleTypeById', getRoleTypeById, rolesController.getRoleTypeById);
rolesRoutes.delete('/deleteRoleType', rolesController.deleteRoleType);
//roles
rolesRoutes.post('/addRole', addRole, rolesController.addRole);
rolesRoutes.get('/getRole', rolesController.getRole);
rolesRoutes.get('/getRolebyId', getRolebyId, rolesController.getRolebyId);
rolesRoutes.put('/updateRole/:id', updateRole, rolesController.updateRole);
rolesRoutes.delete('/deleteRole', deleteRole, rolesController.deleteRole);



module.exports = rolesRoutes;