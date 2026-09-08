jest.mock('../../src/services/entertainment-venue.service');
jest.mock('../../src/services/commercial-area.service');

const entertainmentVenueService = require('../../src/services/entertainment-venue.service');
const commercialAreaService = require('../../src/services/commercial-area.service');
const { enrichLocalityAttributes } = require('../../src/services/locality-enrichment.service');

const baseAttributes = {
  transportation: '지하철 SRT 동탄역 도보 10분',
  commercialArea: '정보 없음',
  gangnamAccessibility: '정보 없음',
  entertainmentAndParks: '정보 없음',
  nearbyJobs: '정보 없음',
};

describe('services/locality-enrichment.service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('위경도가 없으면 외부 조회 없이 원본을 그대로 반환한다', async () => {
    const result = await enrichLocalityAttributes(baseAttributes, null, null);

    expect(result).toEqual(baseAttributes);
    expect(entertainmentVenueService.hasEntertainmentVenueWithin700m).not.toHaveBeenCalled();
  });

  it('유흥·공원이 이미 채워져 있으면 조회를 하지 않는다(기존 수동 입력 우선)', async () => {
    const result = await enrichLocalityAttributes(
      { ...baseAttributes, entertainmentAndParks: '공원 도보 5분' },
      37.2,
      127.1
    );

    expect(entertainmentVenueService.hasEntertainmentVenueWithin700m).not.toHaveBeenCalled();
    expect(result.entertainmentAndParks).toBe('공원 도보 5분');
  });

  it('유흥·공원이 "정보 없음"이고 700m 이내 유흥주점이 있으면 "유흥주점 있음"으로 채운다', async () => {
    entertainmentVenueService.hasEntertainmentVenueWithin700m.mockResolvedValue(true);

    const result = await enrichLocalityAttributes(baseAttributes, 37.2, 127.1);

    expect(result.entertainmentAndParks).toBe('유흥주점 있음 (700m 이내)');
  });

  it('유흥·공원이 "정보 없음"이고 700m 이내 유흥주점이 없으면 "유흥주점 없음"으로 채운다', async () => {
    entertainmentVenueService.hasEntertainmentVenueWithin700m.mockResolvedValue(false);

    const result = await enrichLocalityAttributes(baseAttributes, 37.2, 127.1);

    expect(result.entertainmentAndParks).toBe('유흥주점 없음 (700m 이내)');
  });

  it('공원 관련 텍스트는 채우지 않는다(이번 작업 범위 제외)', async () => {
    entertainmentVenueService.hasEntertainmentVenueWithin700m.mockResolvedValue(true);

    const result = await enrichLocalityAttributes(baseAttributes, 37.2, 127.1);

    expect(result.entertainmentAndParks).not.toContain('공원');
  });

  it('강남접근성이 "정보 없음"이고 좌표가 있으면 강남역 직선거리로 채운다', async () => {
    entertainmentVenueService.hasEntertainmentVenueWithin700m.mockResolvedValue(false);

    const result = await enrichLocalityAttributes(baseAttributes, 37.497942, 127.027621);

    expect(result.gangnamAccessibility).toBe('강남역 직선 0km');
  });

  it('강남접근성이 이미 채워져 있으면 덮어쓰지 않는다(기존 수동 입력 우선)', async () => {
    entertainmentVenueService.hasEntertainmentVenueWithin700m.mockResolvedValue(false);

    const result = await enrichLocalityAttributes(
      { ...baseAttributes, gangnamAccessibility: '강남역 대중교통 30분' },
      37.2,
      127.1
    );

    expect(result.gangnamAccessibility).toBe('강남역 대중교통 30분');
  });

  it('상권이 "정보 없음"이고 좌표가 있으면 상권 요약으로 채운다', async () => {
    entertainmentVenueService.hasEntertainmentVenueWithin700m.mockResolvedValue(false);
    commercialAreaService.summarizeCommercialArea.mockResolvedValue('음식점 4 · 카페 2 · 마트/편의점 1 · 병원 3 (700m 이내)');

    const result = await enrichLocalityAttributes(baseAttributes, 37.2, 127.1);

    expect(result.commercialArea).toBe('음식점 4 · 카페 2 · 마트/편의점 1 · 병원 3 (700m 이내)');
  });

  it('상권이 이미 채워져 있으면 덮어쓰지 않는다(기존 수동 입력 우선)', async () => {
    entertainmentVenueService.hasEntertainmentVenueWithin700m.mockResolvedValue(false);

    const result = await enrichLocalityAttributes({ ...baseAttributes, commercialArea: '수동입력 상권 요약' }, 37.2, 127.1);

    expect(result.commercialArea).toBe('수동입력 상권 요약');
    expect(commercialAreaService.summarizeCommercialArea).not.toHaveBeenCalled();
  });
});
