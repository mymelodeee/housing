const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => console.log(`[INFO] 서버가 포트 ${env.port}에서 기동되었습니다`));
