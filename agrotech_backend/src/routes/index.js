const initializeRoutes = (app) => {
    app.use('/api/v1/user', require('./v1/user.routes'));
    app.use('/api/v1/land', require('./v1/land.routes'));
    app.use('/api/v1/roles', require('./v1/roles.routes'));
    app.use('/api/v1/application', require('./v1/application.routes'));
    app.use('/api/v1/branch', require('./v1/branch.routes'));
    app.use('/api/v1/crop', require('./v1/crop.routes'));
};

module.exports = initializeRoutes;