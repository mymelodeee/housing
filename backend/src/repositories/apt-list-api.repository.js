const env = require('../config/env');

const ENDPOINT = 'https://apis.data.go.kr/1611000/AptListService/getLegaldongAptList';

async function fetchAptListXml({ lawdCd, pageNo = 1, numOfRows = 1000 }) {
  const url = new URL(ENDPOINT);
  url.searchParams.set('serviceKey', env.dataAptListApiKey);
  url.searchParams.set('lawdCd', lawdCd);
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('numOfRows', String(numOfRows));

  const response = await fetch(url);
  return response.text();
}

module.exports = { fetchAptListXml, ENDPOINT };
