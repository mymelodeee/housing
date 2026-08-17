jest.mock('../../src/repositories/apt-list-api.repository');

const aptListApiRepository = require('../../src/repositories/apt-list-api.repository');
const {
  parseAptListJson,
  parseAptBasisInfoJson,
  fetchAptListForRegion,
  fetchHouseholdCount
} = require('../../src/services/apt-list.service');

describe('services/apt-list.service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('parseAptListJson', () => {
    it('items가 여러 건이면 kaptCode/kaptName 배열로 변환한다', () => {
      const json = JSON.stringify({
        response: {
          body: {
            items: [
              { kaptCode: 'A1', kaptName: '단지A', bjdCode: '1174010100' },
              { kaptCode: 'A2', kaptName: '단지B', bjdCode: '1174010100' }
            ]
          }
        }
      });

      expect(parseAptListJson(json)).toEqual([
        { kaptCode: 'A1', kaptName: '단지A' },
        { kaptCode: 'A2', kaptName: '단지B' }
      ]);
    });

    it('items가 없거나 JSON이 아니면 빈 배열을 반환한다', () => {
      expect(parseAptListJson(JSON.stringify({ response: { body: { items: [] } } }))).toEqual([]);
      expect(parseAptListJson(JSON.stringify({ response: { body: {} } }))).toEqual([]);
      expect(parseAptListJson('<OpenAPI_ServiceResponse>에러</OpenAPI_ServiceResponse>')).toEqual([]);
    });
  });

  describe('parseAptBasisInfoJson', () => {
    it('item의 kaptdaCnt를 숫자로 반환한다', () => {
      const json = JSON.stringify({
        response: { body: { item: { kaptCode: 'A1', kaptName: '단지A', kaptdaCnt: '1900' } } }
      });

      expect(parseAptBasisInfoJson(json)).toBe(1900);
    });

    it('item이 없거나 kaptdaCnt가 없거나 숫자가 아니면 undefined를 반환한다', () => {
      expect(parseAptBasisInfoJson(JSON.stringify({ response: { body: {} } }))).toBeUndefined();
      expect(
        parseAptBasisInfoJson(JSON.stringify({ response: { body: { item: { kaptCode: 'A1' } } } }))
      ).toBeUndefined();
      expect(
        parseAptBasisInfoJson(JSON.stringify({ response: { body: { item: { kaptdaCnt: '미상' } } } }))
      ).toBeUndefined();
      expect(parseAptBasisInfoJson('<OpenAPI_ServiceResponse>에러</OpenAPI_ServiceResponse>')).toBeUndefined();
    });
  });

  describe('fetchAptListForRegion', () => {
    it('시군구 코드로 레포지토리를 호출하고 JSON을 파싱해 반환한다', async () => {
      aptListApiRepository.fetchAptListJson.mockResolvedValue(
        JSON.stringify({ response: { body: { items: [{ kaptCode: 'A1', kaptName: '단지A' }] } } })
      );

      const result = await fetchAptListForRegion('11740');

      expect(result).toEqual([{ kaptCode: 'A1', kaptName: '단지A' }]);
      expect(aptListApiRepository.fetchAptListJson).toHaveBeenCalledWith({ sigunguCode: '11740' });
    });
  });

  describe('fetchHouseholdCount', () => {
    it('kaptCode로 기본정보를 조회해 세대수를 반환한다', async () => {
      aptListApiRepository.fetchAptBasisInfoJson.mockResolvedValue(
        JSON.stringify({ response: { body: { item: { kaptCode: 'A1', kaptdaCnt: 4932 } } } })
      );

      const result = await fetchHouseholdCount('A1');

      expect(result).toBe(4932);
      expect(aptListApiRepository.fetchAptBasisInfoJson).toHaveBeenCalledWith({ kaptCode: 'A1' });
    });
  });
});
