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
    completion_year integer CHECK (completion_year BETWEEN 1970 AND EXTRACT(YEAR FROM CURRENT_DATE)),

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
    locality_attributes jsonb, -- 입지 속성(교통/상권/학군/강남접근성/유흥·공원/개발호재/주변일자리), 필수 아님(도메인 §4.1)

    -- 법정동코드 앞5자리(target-regions.js 기준). 국토부 실거래가 API 실시간 조회를 위한
    -- 매핑 컬럼이자, 서비스 대상 지역(TARGET_REGIONS)을 판단하는 canonical 식별자다.
    -- 마이그레이션 이력: 최초 nullable로 추가(1783618964630)되었다가 대상 지역 밖 데이터가
    -- 등록 매물 조회에 새는 것을 막기 위해 NOT NULL로 전환됨(1788100000000).
    lawd_cd varchar(5) NOT NULL,
    molit_apt_name varchar(255), -- 국토부 API 조회용 단지명 매핑, 매핑 안 된 단지는 null(fetch-through 미적용)

    -- 단지 물리 스펙: 공동주택 기본 정보제공 서비스(AptBasisInfoServiceV5)에서 kaptCode로
    -- 조회 가능한 경우만 값 존재(2026-09-08 실측: 용적률/건폐율은 이 API 응답에 없어 컬럼 추가 보류).
    household_count integer CHECK (household_count IS NULL OR household_count > 0),
    building_count integer CHECK (building_count IS NULL OR building_count > 0)
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
-- 10. elementary_schools (입지 속성 "학군" 실시간 산출 + 배정학교 탭용,
-- 전국초중등학교위치표준데이터 반기 갱신 정적 데이터셋을 1회성 시드 스크립트로 적재한
-- 로컬 캐시 테이블. 도메인 v0.19부터 초등학교 외에 중학교도 함께 적재한다)
-- -----------------------------------------------------------------------------
CREATE TABLE elementary_schools (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    school_name varchar(255) NOT NULL,
    school_level varchar(20) NOT NULL DEFAULT '초등학교', -- '초등학교' | '중학교'
    latitude numeric(9, 6) NOT NULL,
    longitude numeric(9, 6) NOT NULL,
    address varchar(255) NOT NULL
);

CREATE INDEX idx_elementary_schools_lat_lng ON elementary_schools (latitude, longitude);
CREATE INDEX idx_elementary_schools_school_level ON elementary_schools (school_level);

-- -----------------------------------------------------------------------------
-- 11. regional_transaction_cache (경기남부+서울 실거래 탐색 기능, 도메인 v0.14 후속)
-- 국토교통부 실거래가 API(지역+월 단위)를 배치 수집기(collect-regional-transactions.js)로
-- 주기적으로 수집해 캐싱하는 테이블. apartment_complexes와 별개이며, 실제
-- "매물 호가"가 아닌 "최근 실거래가"를 시세 근사치로 사용한다는 한계가 있다.
-- 사용자가 검색 결과를 선택하면 그 순간 apartment_complexes에 find-or-create된다
-- (2026-09-07 Phase 0: listings row 승격 없이 단지 상세로 바로 진입하도록 변경).
-- 원래 이름은 regional_listing_cache였으나, "매물"이 아닌 과거 실거래를 담고 있다는
-- 점을 이름에도 반영하기 위해 rename했다(docs/search-architecture-refactor-plan.md §15).
-- -----------------------------------------------------------------------------
CREATE TABLE regional_transaction_cache (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lawd_cd varchar(5) NOT NULL, -- 법정동코드 앞5자리(target-regions.js 기준)
    kapt_code varchar(20), -- 국토부 공동주택 단지 목록제공 서비스 kaptCode, 매칭 실패 시 null 허용
    complex_name varchar(255) NOT NULL,
    address varchar(255), -- 실거래가 API 지번/도로명 주소, 없으면 null 허용
    exclusive_area numeric(6, 2) NOT NULL CHECK (exclusive_area > 0), -- m^2
    sale_price integer NOT NULL CHECK (sale_price > 0), -- 최근 실거래가(만원)
    transaction_date date NOT NULL, -- 대표값으로 채택한 거래의 거래일자
    household_count integer, -- 세대수, apt-list.service.js가 추출 가능한 경우만 값 존재
    latitude numeric(9, 6),
    longitude numeric(9, 6),
    collected_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_regional_transaction_cache_unique_entry
    ON regional_transaction_cache (lawd_cd, complex_name, exclusive_area);
CREATE INDEX idx_regional_transaction_cache_sale_price ON regional_transaction_cache (sale_price);
CREATE INDEX idx_regional_transaction_cache_exclusive_area ON regional_transaction_cache (exclusive_area);

-- -----------------------------------------------------------------------------
-- 12. remodeling_projects (리모델링 추진 단지의 사업 식별/연결)
-- 단일 공식 API가 없어 수동 리서치에 의존하므로, 단지 매칭이 늦어질 수 있다.
-- complex_id는 지연 연결(초기 NULL 허용)이며 조회 시점에 backfill된다.
-- 기존 apartment_complexes.remodeling_status 컬럼과는 무관하게 독립적으로 동작한다.
-- -----------------------------------------------------------------------------
CREATE TABLE remodeling_projects (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    complex_id integer REFERENCES apartment_complexes(id) ON DELETE SET NULL, -- 지연 연결
    lawd_cd varchar(5) NOT NULL, -- 법정동코드 앞5자리(target-regions.js 기준)
    complex_name varchar(255) NOT NULL,
    region_name varchar(50),
    project_name varchar(255), -- 조합/사업 명칭
    is_active boolean NOT NULL DEFAULT true,
    last_checked_at date NOT NULL, -- 이 사업 전체를 마지막으로 재조사한 날
    note text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    UNIQUE (lawd_cd, complex_name)
);

CREATE INDEX idx_remodeling_projects_complex_id ON remodeling_projects (complex_id);
CREATE INDEX idx_remodeling_projects_last_checked_at ON remodeling_projects (last_checked_at);

-- -----------------------------------------------------------------------------
-- 13. remodeling_sources (값의 출처, 1 source : N facts/history)
-- 출처가 삭제되거나 접근 불가가 되어도 행을 지우지 않고 is_accessible=false로 남긴다
-- (과거에 어떤 근거로 그 값을 채택했는지 추적 가능해야 하기 때문).
-- -----------------------------------------------------------------------------
CREATE TABLE remodeling_sources (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id integer NOT NULL REFERENCES remodeling_projects(id) ON DELETE CASCADE,
    source_url text,
    source_name varchar(255),
    source_title varchar(500),
    source_type varchar(30) NOT NULL
        CHECK (source_type IN ('고시', '공고', '조합공지', '지자체보도', '뉴스', '커뮤니티', '기타')),
    source_date date, -- 출처 문서 자체의 발행일
    checked_at date NOT NULL, -- 이 출처를 마지막으로 열어본 날
    reliability varchar(20) NOT NULL CHECK (reliability IN ('high', 'medium', 'low')),
    is_accessible boolean NOT NULL DEFAULT true, -- 삭제/접근불가여도 행은 유지
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX idx_remodeling_sources_project_id ON remodeling_sources (project_id);

-- -----------------------------------------------------------------------------
-- 14. remodeling_facts (모든 "값"의 단일 진실원천 + 변경 이력)
-- checked_at(정보를 마지막으로 검증한 날)과 effective_date(그 사실이 발생한 날)를
-- 반드시 분리 저장한다. 예: 사업계획승인일=2025-11-18(effective_date),
-- 마지막 확인일=2026-09-07(checked_at). 이래야 "checked_at이 오래된 항목만 재조사"가 된다.
-- is_current=false 행들이 곧 "이전 값 변경 이력"이므로 별도 이력 테이블을 두지 않는다.
-- remodeling_projects에는 값(단계/세대수/분담금)을 중복 저장하지 않는다.
-- -----------------------------------------------------------------------------
CREATE TABLE remodeling_facts (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id integer NOT NULL REFERENCES remodeling_projects(id) ON DELETE CASCADE,
    field_name varchar(50) NOT NULL, -- current_stage | household_count_before | household_count_after
                                     -- | contribution_amount | loan_status | move_out_schedule
    field_key varchar(50), -- 평형·타입 구분자(예 '84A'). 단일값이면 NULL
    value text NOT NULL,
    value_numeric numeric, -- 숫자 비교가 필요한 값만 채운다
    unit varchar(20), -- '만원' | '세대' | '㎡'
    value_status varchar(20) NOT NULL
        CHECK (value_status IN ('confirmed', 'estimated', 'proposal', 'unknown')),
    effective_date date, -- 값의 기준일(as_of)
    checked_at date NOT NULL, -- 마지막 검증일
    source_id integer REFERENCES remodeling_sources(id) ON DELETE SET NULL,
    confidence varchar(20) NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
    is_current boolean NOT NULL DEFAULT true,
    is_conflicted boolean NOT NULL DEFAULT false, -- 동급 출처 간 값 충돌 표시
    superseded_at timestamp,
    created_at timestamp NOT NULL DEFAULT now()
);

-- 같은 (사업, 필드, 평형)에 대해 현재값은 하나만 존재한다.
CREATE UNIQUE INDEX idx_remodeling_facts_current_unique
    ON remodeling_facts (project_id, field_name, COALESCE(field_key, ''))
    WHERE is_current;
CREATE INDEX idx_remodeling_facts_project_current ON remodeling_facts (project_id, is_current);
CREATE INDEX idx_remodeling_facts_checked_at ON remodeling_facts (checked_at);

-- -----------------------------------------------------------------------------
-- 15. remodeling_project_history (사업 진행 단계 이력)
-- 단계별로 1행씩 쌓이며, effective_date는 그 단계에 도달한 날이다.
-- -----------------------------------------------------------------------------
CREATE TABLE remodeling_project_history (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id integer NOT NULL REFERENCES remodeling_projects(id) ON DELETE CASCADE,
    stage varchar(30) NOT NULL
        CHECK (stage IN ('추진위원회', '조합설립인가', '안전진단', '건축심의', '사업계획승인', '이주', '착공', '준공', '중단')),
    effective_date date,
    status varchar(20) NOT NULL CHECK (status IN ('confirmed', 'estimated', 'proposal', 'unknown')),
    source_id integer REFERENCES remodeling_sources(id) ON DELETE SET NULL,
    checked_at date NOT NULL,
    note text,
    UNIQUE (project_id, stage)
);

CREATE INDEX idx_remodeling_project_history_project_id ON remodeling_project_history (project_id);

-- -----------------------------------------------------------------------------
-- 15. development_projects / development_project_sources (개발호재, Phase 4 스캐폴드)
-- remodeling_projects/remodeling_sources와 동일한 "출처+checked_at 추적" 패턴을 따르되,
-- 아직 실제 데이터가 없어(2026-09-08) 값의 시점별 이력(remodeling_facts/project_history에
-- 해당하는 버전 관리 테이블)은 만들지 않았다. 실제 개발호재 데이터를 확보해 다건·시간 경과에
-- 따른 값 충돌 관리가 필요해지면 그때 remodeling과 동일하게 확장한다.
-- -----------------------------------------------------------------------------
CREATE TABLE development_projects (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    complex_id integer REFERENCES apartment_complexes(id) ON DELETE SET NULL, -- 지연 연결, 지역 단위 호재는 null 허용
    lawd_cd varchar(5) NOT NULL, -- 법정동코드 앞5자리(target-regions.js 기준)
    region_name varchar(50),
    project_name varchar(255) NOT NULL,
    category varchar(30) NOT NULL CHECK (category IN ('철도', '도로', '택지개발', '기타')),
    status varchar(20) NOT NULL
        CHECK (status IN ('계획', '확정', '착공', '공사중', '완료', '취소')),
    effective_date date, -- 이 상태의 기준일(as_of)
    checked_at date NOT NULL, -- 마지막 검증일
    note text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX idx_development_projects_complex_id ON development_projects (complex_id);

CREATE TABLE development_project_sources (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id integer NOT NULL REFERENCES development_projects(id) ON DELETE CASCADE,
    source_url text,
    source_name varchar(255),
    source_type varchar(30) NOT NULL
        CHECK (source_type IN ('고시', '공고', '보도자료', '뉴스', '기타')),
    source_date date, -- 출처 문서 자체의 발행일
    checked_at date NOT NULL, -- 이 출처를 마지막으로 열어본 날
    reliability varchar(20) NOT NULL CHECK (reliability IN ('high', 'medium', 'low')),
    is_accessible boolean NOT NULL DEFAULT true, -- 삭제/접근불가여도 행은 유지
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX idx_development_project_sources_project_id ON development_project_sources (project_id);

-- -----------------------------------------------------------------------------
-- 시드 데이터: user_profiles 단일 레코드
-- "내 정보 미입력" 초기 상태를 표현하기 위해 id=1 외 나머지 컬럼은 전부 NULL로 둔다
-- (PRD F6 인수조건: 미입력 상태에서는 유도화면 표시).
-- -----------------------------------------------------------------------------
INSERT INTO user_profiles (id) VALUES (1);
