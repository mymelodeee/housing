jest.mock('../../src/services/elementary-school.service');
jest.mock('../../src/services/entertainment-venue.service');

const elementarySchoolService = require('../../src/services/elementary-school.service');
const entertainmentVenueService = require('../../src/services/entertainment-venue.service');
const { enrichLocalityAttributes } = require('../../src/services/locality-enrichment.service');

const baseAttributes = {
  transportation: '지하철 SRT 동탄역 도보 10분',
  commercialArea: '정보 없음',
  schoolDistrict: '정보 없음',
  gangnamAccessibility: '정보 없음',
  entertainmentAndParks: '정보 없음',
  developmentProspects: '정보 없음',
  nearbyJobs: '정보 없음',
};

describe('services/locality-enrichment.service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('위경도가 없으면 외부 조회 없이 원본을 그대로 반환한다', async () => {
    const result = await enrichLocalityAttributes(baseAttributes, null, null);

    expect(result).toEqual(baseAttributes);
    expect(elementarySchoolService.findNearestElementarySchoolWithin700m).not.toHaveBeenCalled();
    expect(entertainmentVenueService.hasEntertainmentVenueWithin700m).not.toHaveBeenCalled();
  });

  it('학군이 이미 채워져 있으면 학교 조회를 하지 않는다(기존 수동 입력 우선)', async () => {
    elementarySchoolService.findNearestElementarySchoolWithin700m.mockResolvedValue({
      schoolName: '동탄중앙초등학교',
      distanceMeters: 300,
    });
    entertainmentVenueService.hasEntertainmentVenueWithin700m.mockResolvedValue(false);

    const result = await enrichLocalityAttributes(
      { ...baseAttributes, schoolDistrict: '수동 입력된 학군 정보' },
      37.2,
      127.1
    );

    expect(elementarySchoolService.findNearestElementarySchoolWithin700m).not.toHaveBeenCalled();
    expect(result.schoolDistrict).toBe('수동 입력된 학군 정보');
  });

  it('유흥·공원이 이미 채워져 있으면 상권 조회를 하지 않는다(기존 수동 입력 우선)', async () => {
    elementarySchoolService.findNearestElementarySchoolWithin700m.mockResolvedValue(null);

    const result = await enrichLocalityAttributes(
      { ...baseAttributes, entertainmentAndParks: '공원 도보 5분' },
      37.2,
      127.1
    );

    expect(entertainmentVenueService.hasEntertainmentVenueWithin700m).not.toHaveBeenCalled();
    expect(result.entertainmentAndParks).toBe('공원 도보 5분');
  });

  it('학군이 "정보 없음"이고 700m 이내 학교가 있으면 이름과 거리로 채운다', async () => {
    elementarySchoolService.findNearestElementarySchoolWithin700m.mockResolvedValue({
      schoolName: '동탄중앙초등학교',
      distanceMeters: 350,
    });
    entertainmentVenueService.hasEntertainmentVenueWithin700m.mockResolvedValue(false);

    const result = await enrichLocalityAttributes(baseAttributes, 37.2, 127.1);

    expect(result.schoolDistrict).toBe('동탄중앙초등학교 (350m 이내)');
  });

  it('학군이 "정보 없음"이고 700m 이내 학교가 없으면 "정보 없음"을 유지한다', async () => {
    elementarySchoolService.findNearestElementarySchoolWithin700m.mockResolvedValue(null);
    entertainmentVenueService.hasEntertainmentVenueWithin700m.mockResolvedValue(false);

    const result = await enrichLocalityAttributes(baseAttributes, 37.2, 127.1);

    expect(result.schoolDistrict).toBe('정보 없음');
  });

  it('유흥·공원이 "정보 없음"이고 700m 이내 유흥주점이 있으면 "유흥주점 있음"으로 채운다', async () => {
    elementarySchoolService.findNearestElementarySchoolWithin700m.mockResolvedValue(null);
    entertainmentVenueService.hasEntertainmentVenueWithin700m.mockResolvedValue(true);

    const result = await enrichLocalityAttributes(baseAttributes, 37.2, 127.1);

    expect(result.entertainmentAndParks).toBe('유흥주점 있음 (700m 이내)');
  });

  it('유흥·공원이 "정보 없음"이고 700m 이내 유흥주점이 없으면 "유흥주점 없음"으로 채운다', async () => {
    elementarySchoolService.findNearestElementarySchoolWithin700m.mockResolvedValue(null);
    entertainmentVenueService.hasEntertainmentVenueWithin700m.mockResolvedValue(false);

    const result = await enrichLocalityAttributes(baseAttributes, 37.2, 127.1);

    expect(result.entertainmentAndParks).toBe('유흥주점 없음 (700m 이내)');
  });

  it('공원 관련 텍스트는 채우지 않는다(이번 작업 범위 제외)', async () => {
    elementarySchoolService.findNearestElementarySchoolWithin700m.mockResolvedValue(null);
    entertainmentVenueService.hasEntertainmentVenueWithin700m.mockResolvedValue(true);

    const result = await enrichLocalityAttributes(baseAttributes, 37.2, 127.1);

    expect(result.entertainmentAndParks).not.toContain('공원');
  });
});
