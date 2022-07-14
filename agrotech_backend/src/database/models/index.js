const { dbConfig } = require("./../../configs")

dbConfig();

module.exports = {
    user:require("./user.model"),
    permission:require("./permission.model"),
    addRole: require("./addRole.model"),
    landRecords: require("./land.model"),
    roleType: require("./roleType.model"),
    admin: require("./admin.model"),
    application: require("./application.model"),
    bankBranch: require("./bankBranch.model"),
    counter: require("./counter.model"),
    crop: require("./crop.model"),
    agrotechApplication: require('./agrotechApplication.model'),
    password: require('./password.model'),
    bulkUploadReport: require('./bulkUploadReport.model'),
    uploadBranchReport: require('./uploadBranchReport.model'),
    uploadCropReport: require('./uploadCropReport.model'),
    reportBodyData: require('./reportBodyData.model')
};