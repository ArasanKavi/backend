module.exports = {
    apps: [
        {
            name: 'protify_backend',
            exec_mode: 'fork',
            ignore_watch: ["node_modules","logs"],
            instances: '1', // Or a number of instances
            env: {
                NODE_ENV: 'development'
            },
            script: "npm start"
        },
    ]
};
