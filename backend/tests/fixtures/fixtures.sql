-- =============================================================================
-- housing 백엔드 통합 테스트용 픽스처 데이터
--
-- 참조: docs/7-execution-plan.md DB-5, database/schema.sql
-- 대상 DB: housing_test (운영 시드 DB인 housing과 분리, DB-4 시드와 충돌 없음)
--
-- 커버리지:
--  - 단지1(정상): 셔틀 정보 있음 + 매물 3건(단지 시세 집계·동일 단지 매물 비교 겸용,
--    BE-8/FE-5) + 실거래 이력 20년 이상 케이스(시나리오 7-1)
--  - 단지2: 셔틀 정보 없음(시나리오 1-3) + 매물 1건 + 실거래 이력 20년 미만
--    케이스(시나리오 7-2)
--  - 단지3: 매물 0건(BE-8 "매물 없음" 응답 검증) + 실거래 이력 0건(시나리오 7-3)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 단지 1: 동탄역 시범 우남퍼스트빌 (정상 단지, 셔틀 있음, 매물 3건)
-- -----------------------------------------------------------------------------
INSERT INTO apartment_complexes (
    complex_name, latitude, longitude, address, completion_year,
    remodeling_status, reconstruction_status, is_regulated_area,
    is_land_transaction_permission_zone,
    nearest_shuttle_stop_name, nearest_shuttle_stop_distance, shuttle_commute_minutes,
    locality_attributes
) VALUES (
    '동탄역 시범 우남퍼스트빌', 37.199600, 127.098200, '경기도 화성시 동탄역로 123', 1998,
    '해당없음', '해당없음', true,
    true,
    '동탄역 셔틀정류장', 350, 42,
    '{"교통": "지하철 SRT 동탄역 도보 10분", "학군": "정보 없음"}'::jsonb
);

INSERT INTO listings (complex_id, sale_price, exclusive_area) VALUES
    ((SELECT id FROM apartment_complexes WHERE complex_name = '동탄역 시범 우남퍼스트빌'), 95000, 84.98),
    ((SELECT id FROM apartment_complexes WHERE complex_name = '동탄역 시범 우남퍼스트빌'), 110000, 101.23),
    ((SELECT id FROM apartment_complexes WHERE complex_name = '동탄역 시범 우남퍼스트빌'), 88000, 59.87);

-- 실거래 이력 20년 이상 케이스(시나리오 7-1): 준공(1998)이 20년도 더 이전이라
-- 실제 이력은 20년을 넘지만, 조회 결과는 최근 20년 창(2006-07-06 이후)만 반환한다.
INSERT INTO price_history (complex_id, transaction_date, transaction_price, lookup_period_type) VALUES
    ((SELECT id FROM apartment_complexes WHERE complex_name = '동탄역 시범 우남퍼스트빌'), '2006-08-01', 45000, '최근 20년'),
    ((SELECT id FROM apartment_complexes WHERE complex_name = '동탄역 시범 우남퍼스트빌'), '2012-03-15', 68000, '최근 20년'),
    ((SELECT id FROM apartment_complexes WHERE complex_name = '동탄역 시범 우남퍼스트빌'), '2018-07-01', 90000, '최근 20년'),
    ((SELECT id FROM apartment_complexes WHERE complex_name = '동탄역 시범 우남퍼스트빌'), '2024-11-02', 95000, '최근 20년');

-- -----------------------------------------------------------------------------
-- 단지 2: 평택 소사벌 한라비발디 (셔틀 정보 없음, 매물 1건)
-- -----------------------------------------------------------------------------
INSERT INTO apartment_complexes (
    complex_name, latitude, longitude, address, completion_year,
    remodeling_status, reconstruction_status, is_regulated_area,
    is_land_transaction_permission_zone,
    nearest_shuttle_stop_name, nearest_shuttle_stop_distance, shuttle_commute_minutes,
    locality_attributes
) VALUES (
    '평택 소사벌 한라비발디', 36.987700, 127.055600, '경기도 평택시 소사벌로 45', 2021,
    '해당없음', '해당없음', false,
    NULL, -- 토허구역 미고시(확인필요 케이스)
    NULL, NULL, NULL, -- 셔틀 배차 정보 미확보(시나리오 1-3, 정보 없음 표시)
    '{"교통": "정보 없음"}'::jsonb
);

INSERT INTO listings (complex_id, sale_price, exclusive_area) VALUES
    ((SELECT id FROM apartment_complexes WHERE complex_name = '평택 소사벌 한라비발디'), 105000, 74.52);

-- 실거래 이력 20년 미만 케이스(시나리오 7-2): 준공(2021) 이후 첫 거래부터 전부 반환.
INSERT INTO price_history (complex_id, transaction_date, transaction_price, lookup_period_type) VALUES
    ((SELECT id FROM apartment_complexes WHERE complex_name = '평택 소사벌 한라비발디'), '2021-06-01', 78000, '최초거래 이후'),
    ((SELECT id FROM apartment_complexes WHERE complex_name = '평택 소사벌 한라비발디'), '2023-02-14', 92000, '최초거래 이후'),
    ((SELECT id FROM apartment_complexes WHERE complex_name = '평택 소사벌 한라비발디'), '2025-01-20', 105000, '최초거래 이후');

-- -----------------------------------------------------------------------------
-- 단지 3: 위례신도시 롯데캐슬 (매물 0건, 실거래 이력 0건)
-- -----------------------------------------------------------------------------
INSERT INTO apartment_complexes (
    complex_name, latitude, longitude, address, completion_year,
    remodeling_status, reconstruction_status, is_regulated_area,
    is_land_transaction_permission_zone,
    nearest_shuttle_stop_name, nearest_shuttle_stop_distance, shuttle_commute_minutes,
    locality_attributes
) VALUES (
    '위례신도시 롯데캐슬', 37.469700, 127.150300, '경기도 성남시 위례동로 78', 2016,
    '해당없음', '해당없음', true,
    true,
    '위례중앙역 셔틀정류장', 500, 38,
    '{"교통": "지하철 위례중앙역 도보 8분"}'::jsonb
);
-- 매물/실거래 이력 의도적으로 미삽입(BE-8 "매물 없음", 시나리오 7-3 "실거래 이력 없음" 검증용)
