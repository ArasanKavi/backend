let { thirdPartyAPI } = require('./../configs');
let { Rest } = require('./../restCalls')

class ThirdPartyServices { }
ThirdPartyServices.getStateDistrict = async (data) => {
    try {
        let urlPayload = JSON.parse(JSON.stringify(thirdPartyAPI.getStateDistrict));
        urlPayload.url = process.env.PINCODEURL + data.pinCode;
        urlPayload.data = data;
        let response = await Rest.callApi(urlPayload);
        console.log("The following is the response", response);
        return response;
    } catch (err) {
        console.log("Error---->", err);
        throw new Error(err.message);
    }
}
ThirdPartyServices.getReportUrlStatus = async (data) => {
    try {
        let urlPayload = JSON.parse(JSON.stringify(thirdPartyAPI.getReportUrlStatus));
        urlPayload.url =data.url;
        urlPayload.data = data;
        let response = await Rest.callApi(urlPayload);
        console.log("The following is the response", response);
        return response;
    } catch (err) {
        console.log("Error---->", err);
        throw new Error(err.message);
    }
}

ThirdPartyServices.uploadS3File = async (payload) => {
    try {
        console.log("Checking the payload body", payload);
        let obj = JSON.parse(JSON.stringify(thirdPartyAPI.uploadS3File));
        obj.url = process.env.AGROTECH_BACKEND + process.env.UPLOAD_S3_FILE;
        obj.data = payload;
        let response = await Rest.callApi(obj);
        console.log("The following is the response", response);
        return response;
    } catch (err) {
        console.log("error ==", err);
        throw new Error(err.message);
    }
}

module.exports = { ThirdPartyServices }