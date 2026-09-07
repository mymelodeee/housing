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
    locality_attributes, lawd_cd
) VALUES (
    '동탄역 시범 우남퍼스트빌', 37.199600, 127.098200, '경기도 화성시 동탄역로 123', 1998,
    '해당없음', '해당없음', true,
    true,
    '동탄역 셔틀정류장', 350, 42,
    '{"교통": "지하철 SRT 동탄역 도보 10분", "학군": "정보 없음"}'::jsonb,
    '41597' -- 화성시 동탄구(TARGET_REGIONS 대상 지역)
);

INSERT INTO listings (complex_id, sale_price, exclusive_area) VALUES
    ((SELECT id FROM apartment_complexes WHERE complex_name = '동탄역 시범 우남퍼스트빌'), 95000, 84.98),
    ((SELECT id FROM apartment_complexes WHERE complex_name = '동탄역 시범 우남퍼스트빌'), 110000, 101.23),
    ((SELECT id FROM apartment_complexes WHERE complex_name = '동탄역 시범 우남퍼스트빌'), 88000, 59.87);

-- 실거래 이력 20년 이상 케이스(시나리오 7-1): lookupPeriodType은 단지 준공년도가 아닌
-- 최초거래 시점(2000-01-01) 기준으로 결정된다. 최초거래가 20년보다 확실히 이전이므로
-- "최근 20년" 분기를 안정적으로 타며, 조회 결과는 최근 20년 창 이내 데이터만 반환한다
-- (2000-01-01 앵커 row 자체는 20년 창 밖이라 응답 entries에는 포함되지 않는다).
INSERT INTO price_history (complex_id, transaction_date, transaction_price, lookup_period_type) VALUES
    ((SELECT id FROM apartment_complexes WHERE complex_name = '동탄역 시범 우남퍼스트빌'), '2000-01-01', 32000, '최근 20년'),
    ((SELECT id FROM apartment_complexes WHERE complex_name = '동탄역 시범 우남퍼스트빌'), '2007-01-01', 45000, '최근 20년'),
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
    locality_attributes, lawd_cd
) VALUES (
    '평택 소사벌 한라비발디', 36.987700, 127.055600, '경기도 평택시 소사벌로 45', 2021,
    '해당없음', '해당없음', false,
    NULL, -- 토허구역 미고시(확인필요 케이스)
    NULL, NULL, NULL, -- 셔틀 배차 정보 미확보(시나리오 1-3, 정보 없음 표시)
    '{"교통": "정보 없음"}'::jsonb,
    '41220' -- 평택시(TARGET_REGIONS 비대상 지역 — 등록 매물 목록 노출 제외 검증용)
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
    locality_attributes, lawd_cd
) VALUES (
    '위례신도시 롯데캐슬', 37.469700, 127.150300, '경기도 성남시 위례동로 78', 2016,
    '해당없음', '해당없음', true,
    true,
    '위례중앙역 셔틀정류장', 500, 38,
    '{"교통": "지하철 위례중앙역 도보 8분"}'::jsonb,
    '41131' -- 성남시 수정구(위례신도시 포함, TARGET_REGIONS 대상 지역)
);
-- 매물/실거래 이력 의도적으로 미삽입(BE-8 "매물 없음", 시나리오 7-3 "실거래 이력 없음" 검증용)

-- -----------------------------------------------------------------------------
-- 리모델링 추진 정보 픽스처
--  - 단지1(동탄): 리모델링 사업 있음. 현재값 + 단계 이력 + 출처 보유.
--    분담금 84A는 checked_at을 200일 전으로 두어 재조사 대상(stale) 검증에 쓴다.
--  - 단지2(평택): 사업 미등록(hasProject:false 응답 검증용)
-- checked_at은 CURRENT_DATE 기준 상대값으로 넣어 시간이 지나도 stale 판정이 유지된다.
-- -----------------------------------------------------------------------------
INSERT INTO remodeling_projects (
    complex_id, lawd_cd, complex_name, region_name, project_name, last_checked_at, note
) VALUES (
    (SELECT id FROM apartment_complexes WHERE complex_name = '동탄역 시범 우남퍼스트빌'),
    '41597', '동탄역 시범 우남퍼스트빌', '화성시 동탄구', '동탄역 시범 우남퍼스트빌 리모델링주택조합',
    CURRENT_DATE, '통합 테스트용 픽스처'
);

INSERT INTO remodeling_sources (
    project_id, source_url, source_name, source_title, source_type, source_date, checked_at, reliability
) VALUES (
    (SELECT id FROM remodeling_projects WHERE complex_name = '동탄역 시범 우남퍼스트빌'),
    'https://example.test/notice/1', '화성시 고시', '리모델링 사업계획승인 고시', '고시',
    DATE '2025-11-18', CURRENT_DATE, 'high'
);

INSERT INTO remodeling_facts (
    project_id, field_name, field_key, value, value_numeric, unit, value_status,
    effective_date, checked_at, source_id, confidence
) VALUES
    ((SELECT id FROM remodeling_projects WHERE complex_name = '동탄역 시범 우남퍼스트빌'),
     'current_stage', NULL, '사업계획승인', NULL, NULL, 'confirmed',
     DATE '2025-11-18', CURRENT_DATE,
     (SELECT id FROM remodeling_sources WHERE source_url = 'https://example.test/notice/1'), 'high'),
    ((SELECT id FROM remodeling_projects WHERE complex_name = '동탄역 시범 우남퍼스트빌'),
     'household_count_before', NULL, '1234', 1234, '세대', 'confirmed',
     DATE '2025-11-18', CURRENT_DATE,
     (SELECT id FROM remodeling_sources WHERE source_url = 'https://example.test/notice/1'), 'high'),
    ((SELECT id FROM remodeling_projects WHERE complex_name = '동탄역 시범 우남퍼스트빌'),
     'household_count_after', NULL, '1418', 1418, '세대', 'confirmed',
     DATE '2025-11-18', CURRENT_DATE,
     (SELECT id FROM remodeling_sources WHERE source_url = 'https://example.test/notice/1'), 'high'),
    -- 재조사 대상(stale) 검증용: 200일 전에 확인한 추정 분담금
    ((SELECT id FROM remodeling_projects WHERE complex_name = '동탄역 시범 우남퍼스트빌'),
     'contribution_amount', '84A', '25000', 25000, '만원', 'estimated',
     DATE '2026-03-01', CURRENT_DATE - 200,
     (SELECT id FROM remodeling_sources WHERE source_url = 'https://example.test/notice/1'), 'medium'),
    ((SELECT id FROM remodeling_projects WHERE complex_name = '동탄역 시범 우남퍼스트빌'),
     'loan_status', NULL, '이주비 대출 미확정', NULL, NULL, 'unknown',
     NULL, CURRENT_DATE, NULL, 'low');

INSERT INTO remodeling_project_history (
    project_id, stage, effective_date, status, source_id, checked_at, note
) VALUES
    ((SELECT id FROM remodeling_projects WHERE complex_name = '동탄역 시범 우남퍼스트빌'),
     '조합설립인가', DATE '2021-06-30', 'confirmed',
     (SELECT id FROM remodeling_sources WHERE source_url = 'https://example.test/notice/1'), CURRENT_DATE, NULL),
    ((SELECT id FROM remodeling_projects WHERE complex_name = '동탄역 시범 우남퍼스트빌'),
     '사업계획승인', DATE '2025-11-18', 'confirmed',
     (SELECT id FROM remodeling_sources WHERE source_url = 'https://example.test/notice/1'), CURRENT_DATE, NULL);
