jest.mock('../../src/repositories/apt-list-api.repository');

const aptListApiRepository = require('../../src/repositories/apt-list-api.repository');
const { parseAptListXml, fetchAptListForRegion } = require('../../src/services/apt-list.service');

describe('services/apt-list.service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('parseAptListXml', () => {
    it('item이 여러 건이면 kaptCode/kaptName 배열로 변환한다', () => {
      const xml = `
        <response>
          <body>
            <items>
              <item><kaptCode>A1</kaptCode><kaptName>단지A</kaptName></item>
              <item><kaptCode>A2</kaptCode><kaptName>단지B</kaptName></item>
            </items>
          </body>
        </response>
      `;

      expect(parseAptListXml(xml)).toEqual([
        { kaptCode: 'A1', kaptName: '단지A' },
        { kaptCode: 'A2', kaptName: '단지B' }
      ]);
    });

    it('item이 1건이면 배열로 감싸서 반환한다', () => {
      const xml = `
        <response>
          <body>
            <items>
              <item><kaptCode>A1</kaptCode><kaptName>단지A</kaptName></item>
            </items>
          </body>
        </response>
      `;

      expect(parseAptListXml(xml)).toEqual([{ kaptCode: 'A1', kaptName: '단지A' }]);
    });

    it('items가 없으면 빈 배열을 반환한다', () => {
      const xml = '<response><body></body></response>';
      expect(parseAptListXml(xml)).toEqual([]);
    });
  });

  describe('fetchAptListForRegion', () => {
    it('레포지토리 XML을 파싱해 반환한다', async () => {
      aptListApiRepository.fetchAptListXml.mockResolvedValue(
        '<response><body><items><item><kaptCode>A1</kaptCode><kaptName>단지A</kaptName></item></items></body></response>'
      );

      const result = await fetchAptListForRegion('41590');

      expect(result).toEqual([{ kaptCode: 'A1', kaptName: '단지A' }]);
      expect(aptListApiRepository.fetchAptListXml).toHaveBeenCalledWith({ lawdCd: '41590' });
    });
  });
});
