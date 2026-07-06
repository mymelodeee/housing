-- =============================================================================
-- housing 서비스 DB 스키마 (단일 SQL 파일, 마이그레이션 아님)
--
-- 작성일: 2026-07-05 (최종 수정: 2026-07-06, PostgreSQL 버전 정정)
-- 참조: docs/6-erd.md (v0.6), docs/1-domain-definition.md (v0.8),
--       docs/4-project-principle.md (v0.5)
-- 대상: PostgreSQL 18.4 (pg 라이브러리로 직접 SQL 실행, ORM 미사용)
--
-- 주의: 4-project-principle.md §7은 실제 운영 마이그레이션을 node-pg-migrate로
-- 관리한다고 명시하지만, 본 파일은 로컬/초기 구축용으로 전체 스키마를 한 번에
-- 생성하는 단일 SQL 파일이다(마이그레이션 파일 대체 아님).
--
-- 도메인 v0.8 구조 변경 반영: 기존 단일 listings 테이블을 apartment_complexes(단지)
-- 와 listings(개별 판매 건)로 분리하고, 즐겨찾기/비교셋을 단지·매물 두 유형으로
-- 이원화했으며, price_history를 매물이 아닌 단지 기준으로 재소속했다(ERD v0.4 §2).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. user_profiles (도메인 §4.3 / ERD 비고: 단일 사용자, 항상 1행만 존재)
-- -----------------------------------------------------------------------------
CREATE TABLE user_profiles (
    id integer PRIMARY KEY CHECK (id = 1), -- 고정값 1만 허용: 인증 없는 단일 사용자 프로필(4-project-principle.md §1.5)

    -- 근무지: 화성/평택 캠퍼스 선택. 재무정보와 달리 값이 정해진 2択이라 임의 기본값을
    -- 넣으면 "선택함"으로 오인될 수 있어, 앱 최초 진입 전 미입력 상태를 표현하기 위해
    -- nullable로 둔다(F6 인수조건: 미입력 상태에서는 유도화면 표시).
    workplace varchar(50) CHECK (workplace IS NULL OR workplace IN ('화성', '평택')),

    -- 아래 재무정보 컬럼들은 도메인 §3.6/§4.3상 "앱 최초 진입 시" 수집되는 값이지만,
    -- PRD F6 인수조건상 "내 정보 미입력" 상태가 정상 상태로 존재하므로 전부 nullable로
    -- 설계한다(ERD 표기가 전부 필수처럼 보이나, 이는 "입력을 완료했을 때"의 필수 여부다).
    ownership_structure varchar(20) CHECK (ownership_structure IS NULL OR ownership_structure IN ('단독', '부부합산')),
    annual_income integer CHECK (annual_income IS NULL OR annual_income >= 0),
    annual_bonus integer CHECK (annual_bonus IS NULL OR annual_bonus >= 0), -- 앱 레벨 기본값 0은 입력 폼에서 처리(도메인 §4.6)

    -- 한글 값을 그대로 저장(도메인 문서가 한글 값을 그대로 예시로 제시). 후속 API 설계에서
    -- 영문 코드화될 수 있음.
    housing_ownership_tier varchar(20) CHECK (housing_ownership_tier IS NULL OR housing_ownership_tier IN ('무주택', '1주택', '다주택')),

    available_capital integer CHECK (available_capital IS NULL OR available_capital >= 0),

    is_first_time_buyer boolean CHECK (
        is_first_time_buyer IS NULL
        OR is_first_time_buyer = false
        OR housing_ownership_tier = '무주택'
    ) -- 생애최초는 무주택일 때만 true 가능(도메인 §4.6)
);

-- -----------------------------------------------------------------------------
-- 2. apartment_complexes (도메인 §4.1, v0.8 신설)
-- 연식/리모델링/재건축/주변 재개발/규제지역/토허구역/셔틀/입지 등 "단지" 단위 속성.
-- 하나의 단지는 여러 매물(listings)을 가질 수 있다(1:N).
-- -----------------------------------------------------------------------------
CREATE TABLE apartment_complexes (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    complex_name varchar(255) NOT NULL,
    latitude numeric(9, 6) NOT NULL,
    longitude numeric(9, 6) NOT NULL,
    address varchar(255) NOT NULL,

    -- 준공년도: 연식은 저장하지 않고 조회 시점에 계산되는 표시값이므로 준공년도만 저장(도메인 §2, §4.1).
    completion_year integer NOT NULL CHECK (completion_year BETWEEN 1970 AND EXTRACT(YEAR FROM CURRENT_DATE)),

    -- 리모델링 추진현황: 기본값 "해당없음"(도메인 §4.1).
    remodeling_status varchar(20) NOT NULL DEFAULT '해당없음'
        CHECK (remodeling_status IN ('해당없음', '추진중', '완료')),

    -- 리모델링 완료 연도: 추진현황이 "완료"일 때만 값이 존재해야 한다(도메인 §4.1).
    remodeling_completion_year integer CHECK (
        remodeling_completion_year IS NULL
        OR (remodeling_status = '완료' AND remodeling_completion_year BETWEEN 1970 AND EXTRACT(YEAR FROM CURRENT_DATE))
    ),

    -- 재건축 추진현황: 기본값 "해당없음"(도메인 §4.1).
    reconstruction_status varchar(20) NOT NULL DEFAULT '해당없음'
        CHECK (reconstruction_status IN ('해당없음', '추진위원회', '조합설립인가', '사업시행인가', '관리처분인가', '이주철거중', '착공')),

    -- 주변 재개발 정보: 정비사업(재개발)에 한정된 설명, 필수 아님(도메인 §4.1).
    nearby_redevelopment_info text,

    -- 규제지역 여부: 기본값 false를 컬럼 DEFAULT로 강제(미고시=비규제로 간주해도 무방, 도메인 §4.1).
    is_regulated_area boolean NOT NULL DEFAULT false,

    -- 토지거래허가구역 여부: 도메인 §4.1이 "미고시 지역은 null 허용 후 확인필요 배지 표시"를
    -- 명시하므로 nullable로 둔다. DEFAULT false는 컬럼에 걸지 않고(신규 단지 등록 시 값이
    -- 확정되지 않은 상태를 null로 남겨야 하므로) 애플리케이션에서 고시 확인 전까지 null을
    -- 유지하고, 고시 확인 후 확정값(true/false)을 채워 넣는 방식을 따른다.
    is_land_transaction_permission_zone boolean,

    -- 셔틀 배차 정보 미확보 단지는 null로 두고 "정보 없음"으로 표시한다
    -- (도메인 v0.7 정정: 실행계획 수립 중 NOT NULL 전제가 시나리오 1-3과 모순됨을 발견해 수정).
    nearest_shuttle_stop_name varchar(255),
    nearest_shuttle_stop_distance integer CHECK (nearest_shuttle_stop_distance IS NULL OR nearest_shuttle_stop_distance >= 0), -- m
    shuttle_commute_minutes integer CHECK (shuttle_commute_minutes IS NULL OR shuttle_commute_minutes >= 0), -- 분
    locality_attributes jsonb -- 입지 속성(교통/상권/학군/강남접근성/유흥·공원/개발호재/주변일자리), 필수 아님(도메인 §4.1)
);

CREATE INDEX idx_apartment_complexes_is_regulated_area ON apartment_complexes (is_regulated_area);

-- -----------------------------------------------------------------------------
-- 3. listings (도메인 §4.2, v0.8 축소: 단지 속성 전부 apartment_complexes로 이동)
-- -----------------------------------------------------------------------------
CREATE TABLE listings (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    complex_id integer NOT NULL REFERENCES apartment_complexes (id) ON DELETE CASCADE, -- 매물은 반드시 하나의 단지에 속함(도메인 §4.2), 단지 삭제 시 매물도 함께 삭제
    sale_price integer NOT NULL CHECK (sale_price BETWEEN 70000 AND 150000), -- 만원, 탐색 범위 7~15억(도메인 §4.2)
    exclusive_area numeric(6, 2) NOT NULL CHECK (exclusive_area > 0) -- m^2
);

CREATE INDEX idx_listings_complex_id ON listings (complex_id);
CREATE INDEX idx_listings_sale_price ON listings (sale_price);

-- -----------------------------------------------------------------------------
-- 4. favorite_complexes (도메인 §4.4, v0.8 신설: 단지 즐겨찾기)
-- -----------------------------------------------------------------------------
CREATE TABLE favorite_complexes (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_profile_id integer NOT NULL REFERENCES user_profiles (id), -- 단일 사용자 프로필 참조, 삭제 시나리오 없음
    complex_id integer NOT NULL REFERENCES apartment_complexes (id) ON DELETE CASCADE, -- 단지 삭제 시 즐겨찾기도 함께 삭제
    registered_at timestamp NOT NULL DEFAULT now(),
    UNIQUE (user_profile_id, complex_id) -- 중복 즐겨찾기 방지(도메인 §4.4)
);

CREATE INDEX idx_favorite_complexes_user_profile_id ON favorite_complexes (user_profile_id);

-- -----------------------------------------------------------------------------
-- 5. favorite_listings (도메인 §4.4, 기존 favorites를 개명: 매물 즐겨찾기)
-- -----------------------------------------------------------------------------
CREATE TABLE favorite_listings (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_profile_id integer NOT NULL REFERENCES user_profiles (id), -- 단일 사용자 프로필 참조, 삭제 시나리오 없음
    listing_id integer NOT NULL REFERENCES listings (id) ON DELETE CASCADE, -- 매물 삭제 시 즐겨찾기도 함께 삭제
    registered_at timestamp NOT NULL DEFAULT now(),
    UNIQUE (user_profile_id, listing_id) -- 중복 즐겨찾기 방지(도메인 §4.4)
);

CREATE INDEX idx_favorite_listings_user_profile_id ON favorite_listings (user_profile_id);

-- -----------------------------------------------------------------------------
-- 6. comparison_sets (도메인 §4.5, v0.8: target_type 컬럼 추가)
-- -----------------------------------------------------------------------------
CREATE TABLE comparison_sets (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_profile_id integer NOT NULL REFERENCES user_profiles (id),

    -- 비교 대상 유형: 단지 비교(complex) 또는 매물 비교(listing). 하나의 비교셋 내
    -- 대상은 동일 유형이어야 한다(도메인 §4.5, 단지/매물 혼합 불가). target_type과
    -- 실제로 어느 매핑 테이블(comparison_set_complexes / comparison_set_listings)에
    -- 행이 들어가는지의 정합성은 DB 트리거가 아닌 애플리케이션(services) 레벨에서
    -- 검증한다(오버엔지니어링 금지, ERD v0.4 §2).
    target_type varchar(10) NOT NULL CHECK (target_type IN ('complex', 'listing')),

    created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX idx_comparison_sets_user_profile_id ON comparison_sets (user_profile_id);

-- -----------------------------------------------------------------------------
-- 7. comparison_set_complexes (도메인 §4.5, v0.8 신설: 단지 비교용 N:M 매핑 테이블)
-- 비교셋당 2~5개 대상 제약은 애플리케이션 레벨에서 검증(ERD §2, PRD F3) — DB 제약 없음.
-- -----------------------------------------------------------------------------
CREATE TABLE comparison_set_complexes (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    comparison_set_id integer NOT NULL REFERENCES comparison_sets (id) ON DELETE CASCADE, -- 비교셋 삭제 시 매핑도 함께 삭제
    complex_id integer NOT NULL REFERENCES apartment_complexes (id) ON DELETE CASCADE, -- 단지 삭제 시 매핑도 함께 삭제
    UNIQUE (comparison_set_id, complex_id) -- 동일 단지 중복 포함 방지(같은 비교셋에 같은 단지 재추가 불가)
);

CREATE INDEX idx_comparison_set_complexes_comparison_set_id ON comparison_set_complexes (comparison_set_id);
CREATE INDEX idx_comparison_set_complexes_complex_id ON comparison_set_complexes (complex_id);

-- -----------------------------------------------------------------------------
-- 8. comparison_set_listings (도메인 §4.5, 기존 유지: 매물 비교용 N:M 매핑 테이블)
-- 비교셋당 2~5개 매물 제약은 애플리케이션 레벨에서 검증(ERD §2, PRD F3) — DB 제약 없음.
-- -----------------------------------------------------------------------------
CREATE TABLE comparison_set_listings (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    comparison_set_id integer NOT NULL REFERENCES comparison_sets (id) ON DELETE CASCADE, -- 비교셋 삭제 시 매핑도 함께 삭제
    listing_id integer NOT NULL REFERENCES listings (id) ON DELETE CASCADE, -- 매물 삭제 시 매핑도 함께 삭제
    UNIQUE (comparison_set_id, listing_id) -- 동일 매물 중복 포함 방지(같은 비교셋에 같은 매물 재추가 불가)
);

CREATE INDEX idx_comparison_set_listings_comparison_set_id ON comparison_set_listings (comparison_set_id);
CREATE INDEX idx_comparison_set_listings_listing_id ON comparison_set_listings (listing_id);

-- -----------------------------------------------------------------------------
-- 9. price_history (도메인 §4.7, v0.8: listing_id → complex_id로 재소속)
-- 실거래가 데이터는 단지+거래건 단위로 공개되며 특정 판매 건 하나에 종속되지 않으므로
-- 매물(listings)이 아닌 단지(apartment_complexes) 기준으로 관리한다(도메인 §2, §4.7).
-- -----------------------------------------------------------------------------
CREATE TABLE price_history (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    complex_id integer NOT NULL REFERENCES apartment_complexes (id) ON DELETE CASCADE, -- 단지 삭제 시 가격 이력도 함께 삭제
    transaction_date date NOT NULL CHECK (transaction_date <= CURRENT_DATE), -- 거래일자는 오늘 이하(도메인 §4.7)
    transaction_price integer NOT NULL CHECK (transaction_price > 0), -- 만원
    -- 데이터 출처는 고정값. 도메인 v0.5에서 명칭을 "국토교통부 아파트 실거래가 공개시스템(오픈API)"로 통일함.
    data_source varchar(255) NOT NULL DEFAULT '국토교통부 아파트 실거래가 공개시스템(오픈API)'
        CHECK (data_source = '국토교통부 아파트 실거래가 공개시스템(오픈API)'),
    lookup_period_type varchar(20) NOT NULL CHECK (lookup_period_type IN ('최근 20년', '최초거래 이후')) -- 도메인 §4.7
);

CREATE INDEX idx_price_history_complex_id ON price_history (complex_id);

-- -----------------------------------------------------------------------------
-- 시드 데이터: user_profiles 단일 레코드
-- "내 정보 미입력" 초기 상태를 표현하기 위해 id=1 외 나머지 컬럼은 전부 NULL로 둔다
-- (PRD F6 인수조건: 미입력 상태에서는 유도화면 표시).
-- -----------------------------------------------------------------------------
INSERT INTO user_profiles (id) VALUES (1);
