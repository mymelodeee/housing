const aptListApiRepository = require('../repositories/apt-list-api.repository');

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseAptListJson(jsonText) {
  const parsed = safeJsonParse(jsonText);
  const items = parsed && parsed.response && parsed.response.body && parsed.response.body.items;
  if (!items) return [];

  const itemList = Array.isArray(items) ? items : [items];
  return itemList
    .filter((item) => item && item.kaptCode)
    .map((item) => ({
      kaptCode: String(item.kaptCode),
      kaptName: String(item.kaptName)
    }));
}

function parseCountField(item, fieldName) {
  if (!item || item[fieldName] === undefined || item[fieldName] === null || item[fieldName] === '') {
    return undefined;
  }

  const value = Number(item[fieldName]);
  return Number.isNaN(value) ? undefined : value;
}

function parseAptBasisInfoJson(jsonText) {
  const parsed = safeJsonParse(jsonText);
  const item = parsed && parsed.response && parsed.response.body && parsed.response.body.item;
  return parseCountField(item, 'kaptdaCnt');
}

function parseAptBasisInfo(jsonText) {
  const parsed = safeJsonParse(jsonText);
  const item = parsed && parsed.response && parsed.response.body && parsed.response.body.item;

  return {
    householdCount: parseCountField(item, 'kaptdaCnt'),
    buildingCount: parseCountField(item, 'kaptDongCnt')
  };
}

async function fetchAptListForRegion(lawdCd) {
  const json = await aptListApiRepository.fetchAptListJson({ sigunguCode: lawdCd });
  return parseAptListJson(json);
}

async function fetchHouseholdCount(kaptCode) {
  const json = await aptListApiRepository.fetchAptBasisInfoJson({ kaptCode });
  return parseAptBasisInfoJson(json);
}

async function fetchAptBasisInfo(kaptCode) {
  const json = await aptListApiRepository.fetchAptBasisInfoJson({ kaptCode });
  return parseAptBasisInfo(json);
}

module.exports = {
  parseAptListJson,
  parseAptBasisInfoJson,
  parseAptBasisInfo,
  fetchAptListForRegion,
  fetchHouseholdCount,
  fetchAptBasisInfo
};
