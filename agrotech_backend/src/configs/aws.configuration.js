const AWS = require("aws-sdk");
const { aws } = require("./thirdPartAPI");

AWS.config = new AWS.Config({
    accessKeyId: aws?.accessKeyId,
    secretAccessKey: aws?.secretAccessKey,
    region: aws?.region,
    signatureVersion: aws?.signatureVersion
});

const s3 = new AWS.S3();

module.exports = s3;