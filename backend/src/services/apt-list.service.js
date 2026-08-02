const { XMLParser } = require('fast-xml-parser');
const aptListApiRepository = require('../repositories/apt-list-api.repository');

const parser = new XMLParser();

function parseAptListXml(xml) {
  const parsed = parser.parse(xml);
  const items = parsed && parsed.response && parsed.response.body && parsed.response.body.items
    ? parsed.response.body.items.item
    : undefined;
  if (!items) return [];

  const itemList = Array.isArray(items) ? items : [items];
  return itemList.map((item) => ({
    kaptCode: String(item.kaptCode),
    kaptName: String(item.kaptName),
    householdCount: extractHouseholdCount(item)
  }));
}

// K-apt 계열 API에서 세대수 필드명이 kaptdaCnt로 통일되어 있지 않을 수 있어
// 흔히 쓰이는 후보 필드명들을 방어적으로 순서대로 확인한다. 값이 없거나
// 숫자로 변환할 수 없으면 undefined로 두고 에러를 내지 않는다.
const HOUSEHOLD_COUNT_FIELD_CANDIDATES = ['kaptdaCnt', 'kaptDaCnt', 'hhldCnt', 'householdCount'];

function extractHouseholdCount(item) {
  for (const field of HOUSEHOLD_COUNT_FIELD_CANDIDATES) {
    if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
      const value = Number(item[field]);
      if (!Number.isNaN(value)) return value;
    }
  }
  return undefined;
}

async function fetchAptListForRegion(lawdCd) {
  const xml = await aptListApiRepository.fetchAptListXml({ lawdCd });
  return parseAptListXml(xml);
}

module.exports = { parseAptListXml, fetchAptListForRegion };
