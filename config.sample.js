module.exports = {
    MYSQL_CONFIG: {
        user: 'DB_USER',
        password: 'DB_PASSWORD',
        database: 'reddit-booru'
    },
    HTTPUTIL_CONFIG: {
        userAgent: 'moe downloader by /u/dxprog'
    },
    IMAGE_RESOLVER: {
        tumblrKey: 'TUMBLR_API_KEY'
    },
    MONGO_CONFIG: {
        database: 'MONGO_PATH'
    },
    IMAGE_IO: {
        localStore: 'PATH_TO_LOCAL_STORE',
        awsBucket: 'AWS_BUCKET',
        awsEnabled: true,
        awsACL: 'public-read',
        awsFolder: 'AWS_FOLDER'
    }
};