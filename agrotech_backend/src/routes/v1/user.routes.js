const { userController } = require("../../controllers/index");
const { verifyToken, verifySession } = require("../../middleware");
const { verifyUserToken } = require('../../hooks');

const express = require("express");
const userRoutes = express.Router();
const { upload, uploadExcel } = require("../../utils");
let validator = require('express-joi-validation').createValidator({
    passError: true
});
const {
    signUp,
    signIn,
    forgetPassword,
    verifyOtp,
    resetPassword,
    editprofile,
    changePassword,
    completeForm,
    getAllUsers,
    getUserById,
    updateUserDetails,
    adminSignUp,
    adminUpdate,
    createCustomer
} = require('../../validators/user.validator');

userRoutes.post('/signup', signUp, userController.signup);
userRoutes.post("/signIn", signIn, userController.signIn);
userRoutes.post("/forgetPassword", forgetPassword, userController.forgetPassword);
userRoutes.post("/forgetPassword/verifyOtp", verifyOtp, userController.verifyOtp);
userRoutes.put("/forgetPassword/reset", verifyUserToken,resetPassword, userController.resetPassword);
userRoutes.put('/editprofile', editprofile, userController.editProfile);
userRoutes.put("/changePassword", verifyUserToken, changePassword, userController.changePassword);
userRoutes.post('/bulk', uploadExcel.single("file"), userController.excelToJson, userController.bulkCustomerUpload);
userRoutes.post('/createUserByStaff', createCustomer, userController.createUserByStaff);
userRoutes.get('/download', userController.download);
userRoutes.post('/createBulkAdmin', userController.createBulkAdmins);

// Application for User
userRoutes.post("/completeForm", completeForm, userController.completeForm);
userRoutes.get("/getAllUsers", getAllUsers, userController.getAllUsers);
userRoutes.get("/getUserById", getUserById, userController.getUserById);
userRoutes.put("/updateUserDetails", userController.updateUserDetails);
userRoutes.delete('/deleteUser', userController.deleteUser);

//Admin Routes
userRoutes.post('/createAdmin', adminSignUp, userController.createAdminAccount);
userRoutes.put('/editAdmin', adminUpdate, userController.editAdminAccount);
userRoutes.put('/editAdminMany', userController.editAdminAccountMany);
userRoutes.delete('/deleteAdmin', userController.deleteAdminAccount);
userRoutes.get('/getAllAdmins', userController.getAllAdmin);
userRoutes.get("/getAdminById", userController.getAdminById);
userRoutes.get('/download', userController.download);
userRoutes.put("/password/reset", verifyUserToken, userController.adminResetPassword);
userRoutes.put('/sessionLoginChange', userController.sessionLoginChange);

//Approval APIs
userRoutes.get('/approvalPending/list', verifyUserToken, userController.getPendingList);
userRoutes.put('/approveStatus', userController.approveStatus);

//Dashboard
userRoutes.get('/dashboardList', userController.getDashboardList);

//Report Generation
userRoutes.get("/reportBodyData", userController.createReportBody);
userRoutes.get("/getReportBody", userController.getReportBody);
userRoutes.put("/updateReportBody", userController.updateReportBody);
userRoutes.post("/reportGeneration", userController.reportGeneration);
userRoutes.post("/reportGeneration/pdf", userController.getReportPdf);
userRoutes.get("/reportGeneration/word", userController.getReportWord);
userRoutes.post("/downloadReport", userController.downloadReport);


module.exports = userRoutes;