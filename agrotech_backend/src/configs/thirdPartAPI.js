require("dotenv/config");
module.exports = {
    'smsAPI': {
        method: 'POST',
        url: process.env.smsAPI,
        headers: {
            contentType: 'application/data',
        },
        auth: {
            username: process.env.smsApiUname,
            password: process.env.smsApiPassword
        }
    },
    getStateDistrict: {
        method: 'get',
        url: "",
        headers: {
            contentType: 'application/data',
        },
    },
    getReportUrlStatus: {
        method: 'get',
        url: "",
        headers: {
            contentType: 'application/data',
        },
    },
    aws: {
        accessKeyId: process.env.accessKeyId,
        secretAccessKey: process.env.secretAccessKey,
        region: process.env.region,
        signatureVersion: "v4",
        bucketName: process.env.bucketName,
        expires: process.env.expires || 14400 // 4 hours
    },
    uploadS3File: {
        method: 'post',
        url: "",
        headers: {
            contentType: "multipart/form-data",
            },
    }
}