const cors = require('cors');
const env = require('../config/env');

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS로 차단된 요청입니다'));
    }
  }
};

module.exports = cors(corsOptions);
