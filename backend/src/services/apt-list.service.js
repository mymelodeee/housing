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

function parseAptBasisInfoJson(jsonText) {
  const parsed = safeJsonParse(jsonText);
  const item = parsed && parsed.response && parsed.response.body && parsed.response.body.item;
  if (!item || item.kaptdaCnt === undefined || item.kaptdaCnt === null || item.kaptdaCnt === '') {
    return undefined;
  }

  const value = Number(item.kaptdaCnt);
  return Number.isNaN(value) ? undefined : value;
}

async function fetchAptListForRegion(lawdCd) {
  const json = await aptListApiRepository.fetchAptListJson({ sigunguCode: lawdCd });
  return parseAptListJson(json);
}

async function fetchHouseholdCount(kaptCode) {
  const json = await aptListApiRepository.fetchAptBasisInfoJson({ kaptCode });
  return parseAptBasisInfoJson(json);
}

module.exports = { parseAptListJson, parseAptBasisInfoJson, fetchAptListForRegion, fetchHouseholdCount };
