const { verifyToken, verifySession } = require("../../middleware");
const { applicationController } = require("../../controllers/index");
const { verifyUserToken } = require('../../hooks');

const express = require("express");
const applicationRoutes = express.Router();
const { upload, uploadExcel, uploadReports,uploadImage } = require("../../utils");

let validator = require('express-joi-validation').createValidator({
    passError: true
});

const {
    
    completeForm,
    updateForm
} = require('../../validators/user.validator');

applicationRoutes.post('/createApplication',completeForm, applicationController.createApplication);
applicationRoutes.put('/editApplication',updateForm, applicationController.editApplication);
applicationRoutes.delete('/deleteApplication', applicationController.deleteApplication);
applicationRoutes.post('/bulk',verifyUserToken, uploadExcel.single("file"), applicationController.excelToJson, applicationController.bulkApplicationUpload);
applicationRoutes.get('/getApplication',verifyUserToken, applicationController.getAllApplications);
applicationRoutes.get('/getApplicationById', applicationController.getApplicationById);
applicationRoutes.get('/getApplicationByBranchCode', applicationController.getApplicationByBranchCode);
//approveApplication
applicationRoutes.put('/approveStatus', applicationController.approveStatus);
applicationRoutes.put('/applicationApproveStatus',verifyUserToken, applicationController.bulkApproveApplications);
applicationRoutes.put('/agrotechapproveStatus', applicationController.agrotechApproveStatus);
applicationRoutes.put('/agrotechapplicationApproveStatus',verifyUserToken, applicationController.agrotechbulkApproveApplications);
//ApplicationCount
applicationRoutes.get('/getApplicationStatusCount',verifyUserToken, applicationController.getApplicationStatusCount);
applicationRoutes.get('/getApplicationReportStatusCount',verifyUserToken, applicationController.getApplicationReportStatusCount);
applicationRoutes.get('/getApplicationCommentsCount',verifyUserToken, applicationController.getApplicationCommentsCount);
applicationRoutes.get('/getApplicationsDataGraph',verifyUserToken, applicationController.getapplicationsDataGraph);
applicationRoutes.get('/getLandApprovedCount',verifyUserToken, applicationController.getLandApprovedCount);
//ApplicationComment
applicationRoutes.post('/commentApplication',verifyUserToken, applicationController.commentApplication);
applicationRoutes.delete('/delete/commentApplication',verifyUserToken, applicationController.commentApplicationDelete);
applicationRoutes.post('/rejectCommentApplication',verifyUserToken, applicationController.rejectCommentApplication);
applicationRoutes.post('/bulk/rejectCommentApplication',verifyUserToken, applicationController.rejectCommentApplicationBulk);
applicationRoutes.get('/getApplicationCommentById', applicationController.getApplicationCommentById);
applicationRoutes.get('/getApplicationRejectCommentById', applicationController.getApplicationRejectCommentById);
//uploaddownload apis
applicationRoutes.post('/uploadCustomReport', uploadReports.array("file",10), applicationController.uploadCustomReport);
applicationRoutes.get('/report', applicationController.report);
applicationRoutes.get('/download', applicationController.download);
applicationRoutes.get('/agrotechapplicationsdownload', applicationController.agrotechApplicationsDownload);
applicationRoutes.get('/historydownload', applicationController.historyDownload);
//deleteapplication
applicationRoutes.delete('/deleteApplicationByBulkUploadId', applicationController.deleteApplicationByBulkUploadId);
//pincode
applicationRoutes.get('/getStateDistrict', applicationController.getStateDistrict);
//agrotechApplication apis
applicationRoutes.get('/getAgrotechApplication',verifyUserToken, applicationController.getAllAgrotechApplications);
applicationRoutes.get('/getAgrotechApplicationById', applicationController.getAgrotechApplicationById);
applicationRoutes.get('/getAgrotechApplicationByAccountNumber', applicationController.getAgrotechApplicationByAccountNumber);
//Flag and New Comment APIs
applicationRoutes.post('/flagApplication',verifyUserToken, applicationController.updateFlag);
applicationRoutes.post('/newCommentApplication',verifyUserToken, applicationController.resolveApplicationComment);
//bulkUploadReports
applicationRoutes.get('/getBulkUploadReport',verifyUserToken, applicationController.getBulkUploadReport);
applicationRoutes.get('/getAllBulkUploads',verifyUserToken, applicationController.getAllBulkUploads);
//
applicationRoutes.post('/uploadReportImage', uploadImage.array("file",10), applicationController.uploadReportImage);
module.exports = applicationRoutes;