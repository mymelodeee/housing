require('dotenv').config();

function exitProcess() {
  process.exit(1);
}

const requiredKeys = [
  'PORT',
  'POSTGRES_CONNECTION_STRING',
  'CORS_ORIGIN',
  'DATA_APT_KR_API_KEY',
  'DATA_APT_KR_API_KEY2',
  'DATA_STORE_API_KEY',
  'DATA_GEOCODING_CLIENT_ID',
  'DATA_GEOCODING_CLIENT_SECRET'
];
const missingKeys = requiredKeys.filter((key) => !process.env[key]);

if (missingKeys.length > 0) {
  console.error(`[ERROR] 필수 환경변수가 설정되지 않았습니다: ${missingKeys.join(',')}`);
  exitProcess();
  module.exports = Object.freeze({});
} else {
  module.exports = Object.freeze({
    port: Number(process.env.PORT),
    postgresConnectionString: process.env.POSTGRES_CONNECTION_STRING,
    corsOrigins: process.env.CORS_ORIGIN.split(',').map((s) => s.trim()),
    dataAptKrApiKey: process.env.DATA_APT_KR_API_KEY,
    dataAptListApiKey: process.env.DATA_APT_KR_API_KEY2,
    dataStoreApiKey: process.env.DATA_STORE_API_KEY,
    dataGeocodingClientId: process.env.DATA_GEOCODING_CLIENT_ID,
    dataGeocodingClientSecret: process.env.DATA_GEOCODING_CLIENT_SECRET
  });
}
