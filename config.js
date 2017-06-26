exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://svacct1:M0ngoMeanTime@ds135552.mlab.com:35552/blogs';
exports.PORT = process.env.PORT || 8080;
