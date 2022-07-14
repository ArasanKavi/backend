const {
    application 
} = require('../database/models');
const { ThirdPartyServices } = require("./thirdParties")
const applicationCount = async(branchCode) => {
    try {
       // let data
       console.log(branchCode)
       let signedUrl
         signedUrl = await application.aggregate([{
                    $match: [{
                        bankBranchCode:{
                          $eq:branchCode
                        }
                     },
                        {
                        status: {
                            $ne: ""
                        }
                    }]
                },
                {
                    $group: {
                        _id: "$status",
                        value: {
                            $count: {}
                        }
                    }
                }
            ]);
           let totalCount = await application.find({
                bankBranchCode: {
                    $eq: branchCode
                }
            }).countDocuments();
            signedUrl.push({
                _id: "TOTAL",
                value: totalCount
            });
        return signedUrl;
    } catch (error) {
        console.log(error);
        return null
    }
};

module.exports = {
    ThirdPartyServices,
    applicationCount
}