 
module.exports = {
    dbConfig: require('./db.config'),
    messages: require('./codeMsgs'),
    statusCodes: require('./httpCodes'),
    config: require('./config'),
    thirdPartyAPI: require('./thirdPartAPI'),
    InternalAPIs:require('./internalAPI'),
    headerMapping: require('./landHeaderMapping'),
    customerHeaderMapping: require('./customerHeaderMapping'),
    cropHeaderMapping: require('./cropHeaderMapping'),
    landHeaderMapping: require('./landHeaderMapping'),
    branchHeaderMapping: require('./branchHeaderMapping'),
}