# housing 실행계획 (Execution Plan)

- 버전: v0.7
- 최종 수정일: 2026-07-06
- 참조 문서: [1-domain-definition.md](./1-domain-definition.md) (v0.8), [2-prd.md](./2-prd.md) (v0.6), [3-user-scenario.md](./3-user-scenario.md) (v0.5), [4-project-principle.md](./4-project-principle.md) (v0.6), [5-arch-diagram.md](./5-arch-diagram.md) (v0.5), [6-erd.md](./6-erd.md) (v0.6), `database/schema.sql`, `swagger/swagger.json`
- 버전 관리 규칙: 본 문서를 수정할 때마다 상단 버전(v0.1 → v0.2 …)과 최종 수정일을 함께 갱신한다. 과거 버전 이력은 별도 변경이력 절에 누적 기록한다.
- Task 번호 규칙: `DB-N`(데이터베이스), `BE-N`(백엔드), `FE-N`(프론트엔드). `.claude/skills/backend-resolver`, `.claude/skills/frontend-resolver`가 각각 이 문서의 `BE-N`, `FE-N` 번호를 인자로 받아 해당 Task를 수행한다.

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v0.1 | 2026-07-05 | 최초 초안 작성. DB(5개)/백엔드(11개)/프론트엔드(11개) Task로 분해, 상호 의존성 명시. 계획 수립 중 발견한 스키마 공백(셔틀 정보 nullable화)을 도메인 정의서 v0.7·ERD v0.3·schema.sql에 반영 |
| v0.2 | 2026-07-05 | **구조 변경(도메인 v0.8, ERD v0.4, schema.sql 반영)**: 단일 `listings` 테이블을 `apartment_complexes`(단지)/`listings`(매물)로 분리하고 즐겨찾기·비교셋을 단지/매물 이원화한 결과를 실행계획에 반영. DB-3을 9개 테이블 기준으로 정정, DB-5에 "단지 1개-매물 N개" 픽스처 조건 추가. 신규 **BE-8(아파트 단지 조회 및 단지 시세 집계 서비스)** 추가. BE-1/BE-2/BE-3/BE-4-1/BE-4-3/BE-5/BE-7의 완료조건에서 "매물의 규제·입지·실거래이력"을 "매물이 속한 단지의 정보"로 정정. FE-3/FE-4/FE-5/FE-6/FE-7/FE-8/FE-9를 단지/매물 이원화 UI 기준으로 재작성. 백엔드 12개(BE-8 추가), 프론트엔드 11개(내용만 갱신)로 총 Task 28개 |
| v0.3 | 2026-07-05 | 참조 문서 버전 갱신(ERD v0.5 — comparison_set_listings UNIQUE 제약 및 셔틀 컬럼 nullable화 반영) |
| v0.4 | 2026-07-06 | Swagger 스펙(`swagger/swagger.json`) 작성 과정에서 발견된 네이밍 불일치 수정: BE-8의 엔드포인트 표기를 `4-project-principle.md` §3 확정 규칙에 맞춰 `/api/apartment-complexes/:id` → `/api/complexes/:id`로 정정(단지 시세는 별도 `/price-range` 경로 없이 단지 상세 응답에 포함되는 것으로 통일). 참조 문서에 `swagger/swagger.json` 추가 |
| v0.5 | 2026-07-06 | 로컬 개발 환경에 실제 설치된 버전 확인 결과를 반영해 DB-1의 대상 DB 버전을 PostgreSQL 17 → 18.4로 정정, 참조 문서 버전 갱신(구조원칙 v0.6, 아키텍처 다이어그램 v0.5, ERD v0.6) |
| v0.6 | 2026-07-06 | DB-1~DB-4 수행 완료 및 완료 조건 체크: 전용 `housing` DB 생성, `backend`에 node-pg-migrate 도입(CommonJS 마이그레이션 파일, `POSTGRES_CONNECTION_STRING` 환경변수 사용), `database/schema.sql`을 9개 테이블 마이그레이션 파일로 이식(FK 의존 순서 준수), 시드 마이그레이션 작성. 모두 postgresql-mcp로 up/down 및 제약조건·인덱스 전수 검증 |
| v0.7 | 2026-07-06 | DB-5 수행 완료 및 완료 조건 체크: 별도 `housing_test` DB에 `schema.sql`을 직접 실행해 node-pg-migrate 결과(`housing`)와 컬럼·제약·인덱스 정합성 검증. `backend/tests/fixtures/fixtures.sql` 신규 작성(단지 3개 — 정상/셔틀없음/매물없음, 실거래 이력 20년 이상·미만·0건, 동일 단지 매물 3건 겸용 커버) 및 `housing_test`에 적재해 전수 검증. 운영 시드 DB(`housing`)와는 완전히 분리되어 충돌 없음 확인 |

---

## 0. 문서 목적 및 범위

본 문서는 1~6번 문서와 `database/schema.sql`을 근거로 "housing" 서비스 구현에 필요한 모든 작업을 **DB / 백엔드 / 프론트엔드** 3개 트랙의 독립적이고 관리 가능한 Task로 분해한 실행계획이다. 각 Task는 산출물, 완료 조건(체크박스), 의존성을 명시한다. 오버엔지니어링 금지 원칙(4-project-principle.md §1)에 따라 이 프로젝트(인증 없는 개인용 단일 사용자 웹앱, F1~F7)의 규모에 맞는 Task만 포함한다.

이 문서는 계획만 다루며 실제 코드 구현은 각 Task 수행 시점에 `backend-resolver`/`frontend-resolver` 스킬을 통해 진행한다. API 상세 명세(요청/응답 스키마 전체)는 본 문서 범위가 아니며, 필요 시 `swagger/swagger.json`으로 별도 관리한다(4-project-principle.md §7 참조).

**계획 수립 중 발견한 설계 공백 1건**: DB/백엔드 Task를 분해하는 과정에서, 도메인 정의서 §4.1의 셔틀 정류장/통근시간 필드가 "필수(Y)"로 정의되어 있어 §3.1 시나리오("셔틀 정보 없음" 표시)와 모순됨을 발견했다. 이를 도메인 정의서 v0.7, ERD v0.3, `database/schema.sql`에서 nullable로 정정해 반영했다(아래 DB-3, BE-1 완료 조건에 이 정정 사항이 포함되어 있다).

---

## 1. 실행 순서 개요

```mermaid
flowchart LR
    subgraph DB["DB 트랙"]
        DB1[DB-1 로컬 환경] --> DB2[DB-2 마이그레이션 도구] --> DB3[DB-3 9개 테이블 이식] --> DB4[DB-4 시드] --> DB5[DB-5 정합성/픽스처]
    end

    subgraph BE["백엔드 트랙"]
        BE0[BE-0 공통 인프라]
    end

    subgraph FE["프론트엔드 트랙"]
        FE1[FE-1 공통 인프라]
    end

    DB3 --> BE0
    DB4 --> BE0
    BE0 --> BEFeatures[BE-1~BE-8 기능별 Task]
    FE1 --> FEFeatures[FE-2~FE-11 기능별 Task]
    BEFeatures -.API 완성 시 순차 연동.-> FEFeatures
```

- DB 트랙(DB-1~DB-5)을 먼저 완료해야 백엔드 트랙(BE-0 이후)이 실제 DB에 연결해 검증할 수 있다.
- 백엔드 공통 인프라(BE-0)와 프론트엔드 공통 인프라(FE-1)는 서로 독립적이므로 병렬 착수 가능하다.
- 이후 기능별 Task(BE-1~BE-8, FE-2~FE-11)는 아래 각 트랙 표의 의존성에 따라 병렬/순차로 진행한다. 프론트엔드 기능 Task는 대응하는 백엔드 API Task가 완료되어야 실제 연동 검증이 가능하다(단, API 응답 스펙이 먼저 합의되면 mock 기반으로 병행 개발 가능 — 4-project-principle.md §4의 msw mocking 원칙 참조).

---

## 2. DB 트랙

### DB-1. 로컬 PostgreSQL 18.4 환경 구성

**목적**: 이후 모든 DB 작업의 전제가 되는 로컬 PostgreSQL 18.4 인스턴스와 개발용 DB/유저를 준비한다.

**완료 조건**
- [x] `psql --version` 결과가 PostgreSQL 18.x임을 확인한다. *(psql CLI 미설치로 postgresql-mcp를 통해 `SELECT version()`으로 동등 확인: PostgreSQL 18.4)*
- [x] `psql -U <user> -d housing -c '\dt'`로 신규 생성한 빈 DB에 접속 가능하다. *(postgresql-mcp로 `housing` DB 신규 생성 후 접속·테이블 목록 조회(0건) 확인)*
- [x] 접속 정보(host/port/database/user/password)가 정리되어 DB-2, BE-0에서 `.env`에 그대로 옮길 수 있다. *(`backend/.env`에 `POSTGRES_CONNECTION_STRING=postgresql://postgres:postgres@localhost:5432/housing` 반영)*

**의존성**: 없음.

**규모**: 작음

---

### DB-2. node-pg-migrate 도입 및 초기 설정

**목적**: 4-project-principle.md §7이 확정한 `node-pg-migrate`를 backend 프로젝트에 설치하고 마이그레이션 경로(`backend/src/db/migrations/`)와 실행 스크립트를 구성한다.

**완료 조건**
- [x] `npx node-pg-migrate create <test-migration>` 실행 시 `backend/src/db/migrations/`에 타임스탬프 파일이 생성된다.
- [x] `.env`에 DB-1 접속 정보를 채운 상태에서 `npx node-pg-migrate up`(빈 테스트 마이그레이션 기준)이 에러 없이 동작한다. *(up/down 모두 정상 동작 확인. 기본 템플릿이 ESM(`export const`)인데 backend는 CommonJS(`type` 미지정=commonjs)이므로 마이그레이션 파일은 `exports.xxx =` 형태로 작성)*
- [x] `.env.example`에는 값 없이 키 목록만 있고, `.env`는 `.gitignore`에 포함되어 있다. *(루트 `.gitignore`가 `.env`/`.env.*`(`.env.example` 제외)와 `node_modules/`를 이미 포괄하므로 backend 전용 `.gitignore` 별도 추가 없음)*
- [x] 테스트용 마이그레이션 파일은 정리(삭제)하여 DB-3의 실제 스키마 마이그레이션만 남긴다.

**의존성**: DB-1.

**규모**: 작음~중간

---

### DB-3. schema.sql 기반 9개 테이블 마이그레이션 파일 작성

**목적**: `database/schema.sql`(v0.8 구조 변경 반영, 아파트 단지/매물 분리)의 DDL(9개 테이블, 모든 CHECK/UNIQUE/FK/인덱스)을 FK 의존 순서(`user_profiles`, `apartment_complexes` → `listings` → `favorite_complexes`/`favorite_listings`/`comparison_sets` → `comparison_set_complexes`/`comparison_set_listings` → `price_history`)에 맞춰 마이그레이션 파일로 이식한다.

**완료 조건**
- [x] `npx node-pg-migrate up`이 에러 없이 9개 테이블(`user_profiles`, `apartment_complexes`, `listings`, `favorite_complexes`, `favorite_listings`, `comparison_sets`, `comparison_set_complexes`, `comparison_set_listings`, `price_history`)을 생성한다.
- [x] schema.sql의 모든 CHECK 제약이 동일하게 존재한다. 특히 `user_profiles.id = 1`, `apartment_complexes.completion_year BETWEEN 1970 AND EXTRACT(YEAR FROM CURRENT_DATE)`, `remodeling_status IN ('해당없음','추진중','완료')` 및 완료 연도 조건부 CHECK(`remodeling_status = '완료'`일 때만 값 존재), `reconstruction_status`의 7단계 enum CHECK, `listings.sale_price BETWEEN 70000 AND 150000`, `listings.exclusive_area > 0`, `comparison_sets.target_type IN ('complex','listing')`, `is_first_time_buyer` 조건부 CHECK, `price_history.data_source` 고정값 CHECK를 빠짐없이 확인한다. *(postgresql-mcp로 `pg_constraint`/`pg_get_constraintdef` 조회해 전수 대조 완료)*
- [x] UNIQUE 제약 4건(`favorite_complexes (user_profile_id, complex_id)`, `favorite_listings (user_profile_id, listing_id)`, `comparison_set_complexes (comparison_set_id, complex_id)`, `comparison_set_listings (comparison_set_id, listing_id)`)이 존재한다.
- [x] `apartment_complexes.nearest_shuttle_stop_name`/`nearest_shuttle_stop_distance`/`shuttle_commute_minutes`와 `is_land_transaction_permission_zone`, `remodeling_completion_year`, `nearby_redevelopment_info`, `locality_attributes`가 **nullable**로 생성된다(도메인 v0.7 정정 사항 및 v0.8 신규 컬럼 반영 — NOT NULL로 이식하지 않도록 주의).
- [x] `listings.complex_id`는 `apartment_complexes.id` 참조 FK로 **NOT NULL**이며 `ON DELETE CASCADE`가 걸려 있다(매물은 반드시 하나의 단지에 속함).
- [x] `price_history.complex_id`가 `listing_id`가 아닌 `apartment_complexes.id`를 참조하는 FK로 생성된다.
- [x] 모든 FK와 `ON DELETE CASCADE` 옵션이 schema.sql과 동일하다.
- [x] schema.sql에 정의된 인덱스(`idx_apartment_complexes_is_regulated_area`, `idx_listings_complex_id`, `idx_listings_sale_price`, `idx_favorite_complexes_user_profile_id`, `idx_favorite_listings_user_profile_id`, `idx_comparison_sets_user_profile_id`, `idx_comparison_set_complexes_*`, `idx_comparison_set_listings_*`, `idx_price_history_complex_id`)가 모두 생성된다. *(11개 인덱스 전수 확인)*
- [x] `npx node-pg-migrate down`으로 전체 롤백 시 9개 테이블이 에러 없이 제거된다. *(`down 8` + 최초 단건 down으로 9개 전부 롤백 확인 후 재-up으로 DB-4 진행을 위해 복구)*

**의존성**: DB-2.

**규모**: 중간

---

### DB-4. 시드 데이터(단일 사용자 프로필) 마이그레이션 작성

**목적**: `user_profiles`에 고정 `id=1` 1행만 존재하도록 시드 마이그레이션을 분리 작성한다.

**완료 조건**
- [x] `npx node-pg-migrate up` 완료 후 `SELECT * FROM user_profiles`가 정확히 1행(`id=1`, 나머지 컬럼 전부 NULL)을 반환한다.
- [x] `down` 실행 시 해당 행이 제거되고, 재실행(`up`) 시에도 중복 없이 1행만 존재한다.
- [x] `user_profiles` 테이블 생성 마이그레이션(DB-3) 이후 순번으로 배치되어 있다. *(`1783341495290_seed-user-profile.js`, DB-3의 9개 테이블 마이그레이션 타임스탬프보다 뒤)*

**의존성**: DB-3.

**규모**: 작음

---

### DB-5. 마이그레이션-스키마 정합성 검증 및 테스트용 픽스처 데이터 구성

**목적**: node-pg-migrate 결과 스키마가 `schema.sql` 직접 실행 결과와 구조적으로 동일함을 검증하고, 백엔드 통합 테스트용 최소 픽스처 데이터(단지 여러 개 + 매물 여러 건 — 셔틀 정보 있음/없음 케이스 포함, 실거래 이력 20년 이상/미만/0건 3케이스 포함)를 준비한다.

**완료 조건**
- [x] `schema.sql`을 빈 DB에 직접 실행해 만든 스키마와 node-pg-migrate `up` 결과 스키마의 테이블/컬럼/제약/인덱스 목록이 일치한다. *(별도 `housing_test` DB에 schema.sql을 직접 실행 후 `information_schema.columns`(52행 동일) 비교, `pg_constraint` 개수(83 vs 87 — 차이 4는 `housing`에만 있는 node-pg-migrate 자체 관리 테이블 `pgmigrations`의 제약 4건), `pg_indexes`(11개 전부 동일) 확인)*
- [x] 픽스처에 셔틀 정보가 null인 단지(BE-1 시나리오 1-3용)와 정상 단지가 각각 포함되고, 각 단지에 매물이 1건 이상 연결되어 있다. *(`backend/tests/fixtures/fixtures.sql`: 동탄역 시범 우남퍼스트빌(셔틀 있음, 매물 3건), 평택 소사벌 한라비발디(셔틀 null, 매물 1건))*
- [x] 픽스처에 실거래 이력 20년 이상/20년 미만/0건 단지가 각 1건 이상 포함된다(`price_history.complex_id` 기준, BE-7/BE-8용, 시나리오 7-1/7-2/7-3). *(동탄역 단지: `최근 20년` 4건, 준공 1998년으로 20년 이상 이력 존재를 뒷받침. 평택 단지: `최초거래 이후` 3건. 위례신도시 롯데캐슬: 0건)*
- [x] **단지 1개에 매물 여러 개(2건 이상)가 속하는 픽스처**를 포함한다(BE-8 단지 시세 집계, FE-5 단지 비교 테스트용). *(동탄역 단지 매물 3건, MIN 88000/MAX 110000 집계 확인)*
- [x] **동일 단지 내 서로 다른 매물 2개 이상**을 포함한 픽스처를 별도로 구성한다(BE-3/FE-5 "매물 비교" 모드에서 동일 단지 매물끼리 비교하는 시나리오 3-5 검증용, 이때 단지 축 값은 모든 대상에서 동일하게 나오는 것이 정상임을 테스트로 확인 가능해야 한다). *(동탄역 단지의 매물 3건이 이 조건도 겸용 — 동일 `complex_id`를 공유하므로 단지 축 값이 모든 매물에서 동일하게 조회됨)*
- [x] 매물이 0건인 단지를 최소 1건 포함한다(BE-8 "매물 없음" 단지 시세 응답 검증용). *(위례신도시 롯데캐슬: listing_count 0, min/max NULL 확인)*
- [x] 픽스처는 운영 시드(DB-4, `user_profiles id=1`)와 충돌하지 않는다(테스트 DB 분리 또는 트랜잭션 롤백 방식). *(픽스처는 `housing_test`에만 적재, `housing`의 `user_profiles`는 여전히 1행만 존재함을 재확인)*
- [x] 도메인 제약(예: `listings.sale_price` 70,000~150,000 범위, `apartment_complexes.completion_year` 범위, `remodeling_status`/`reconstruction_status` enum)을 위반하지 않는 유효한 픽스처만 포함한다. *(모든 INSERT가 CHECK 제약 위반 없이 성공)*

**의존성**: DB-3, DB-4.

**규모**: 중간

---

## 3. 백엔드 트랙

### BE-0. 공통 인프라 (Express 앱 부트스트랩)

**목적**: 모든 기능 Task의 선행 기반(Express 앱 골격, DB 커넥션, 에러 핸들링, 환경변수 로딩)을 구축한다.

**완료 조건**
- [ ] `npm start` 실행 시 서버가 환경변수 `PORT`로 정상 기동한다.
- [ ] `db/pool.js`는 환경변수만으로 `pg.Pool`을 생성하며 자격증명 하드코딩이 없다.
- [ ] `config/env.js`가 필수 환경변수 누락 시 앱 기동을 실패시키고 `[ERROR]` 접두사로 원인을 출력한다.
- [ ] 404/500 모두 `error-handler.js`를 거쳐 일관된 JSON 에러 포맷으로 응답한다.
- [ ] CORS는 와일드카드 없이 환경변수 지정 origin만 허용한다.
- [ ] 로깅은 `console.log/error/warn` + `[INFO]/[ERROR]/[WARN]` 접두사만 사용한다(외부 로깅 라이브러리 없음).
- [ ] `.env`가 `.gitignore`에 포함되고 `.env.example`은 값 없이 키만 담는다.
- [ ] 인증/세션/JWT 미들웨어를 추가하지 않았음을 코드 리뷰로 확인한다.

**의존성**: DB-3, DB-4 완료 필요(pool.js 연결 테스트를 위해 실제 스키마가 적용된 DB 필요).

**규모**: 중간

---

### BE-1. F1 매물 탐색 및 셔틀 통근 분석

**목적**: 매매가 7~15억 구간 매물 필터링 조회 및 셔틀 통근시간 정보 제공(셔틀·연식 등은 매물이 속한 단지 기준으로 join 조회).

**완료 조건**
- [ ] `GET /api/listings?minPrice=&maxPrice=`가 매매가(만원) 범위를 필터링하며, 미지정 시 기본 70000~150000을 적용한다.
- [ ] 지역/좌표 기반 필터를 최소 1가지 방식으로 지원한다(단지 좌표 기준).
- [ ] 조건에 맞는 매물이 0건이면 200과 빈 배열을 반환한다.
- [ ] 매물 조회 시 `listings`와 소속 `apartment_complexes`를 join하여, 응답에 매물 자체 정보(매매가, 전용면적)와 함께 소속 단지 정보(준공년도/연식, 리모델링 이력, 재건축 추진현황, 최근접 셔틀 정류장명, 거리(m), 셔틀 통근시간(분))가 포함된다.
- [ ] 셔틀 정보가 DB에 null인 단지(도메인 v0.7 nullable 컬럼)에 속한 매물은 API 응답에서 해당 필드를 `null` 또는 `"정보 없음"` 문자열로 반환하고, 다른 필드·기능에는 영향을 주지 않는다(시나리오 1-3).
- [ ] `GET /api/listings/:id`로 단일 매물(+소속 단지 정보) 조회 가능, 존재하지 않는 id는 404.
- [ ] repository 계층에만 SQL이 존재하며, `listings.repository.js`가 BE-8의 `apartment-complexes.repository.js`를 재사용하거나 join 쿼리를 통해 단지 정보를 함께 조회한다.
- [ ] `shuttle-commute.service.js` 및 관련 서비스 커버리지 80% 이상.

**의존성**: BE-0, DB-3(listings, apartment_complexes 테이블), DB-5(셔틀 정보 있음/없음 픽스처), BE-8(단지 조회 로직 재사용).

**규모**: 중간

---

### BE-2. F2 즐겨찾기 (단지/매물 이원화)

**목적**: 단지 즐겨찾기(`favorite_complexes`)와 매물 즐겨찾기(`favorite_listings`)를 각각 독립적으로 추가/해제(토글)하는 기능.

**완료 조건**
- [ ] `POST /api/favorites/complexes {complexId}`로 추가 시 201과 등록 레코드를 반환한다.
- [ ] `POST /api/favorites/listings {listingId}`로 추가 시 201과 등록 레코드를 반환한다.
- [ ] 이미 즐겨찾기된 단지/매물에 재요청 시 각각 DB UNIQUE 위반(`(user_profile_id, complex_id)`, `(user_profile_id, listing_id)`)을 컨트롤러가 포착해 409로 응답하고 신규 행을 만들지 않는다(시나리오 2-2).
- [ ] `DELETE /api/favorites/complexes/:complexId`, `DELETE /api/favorites/listings/:listingId`로 각각 해제 시 200을 반환한다.
- [ ] `GET /api/favorites/complexes`로 사용자(고정 id=1)의 단지 즐겨찾기 목록(단지 상세 join 포함)을, `GET /api/favorites/listings`로 매물 즐겨찾기 목록(매물+소속 단지 join 포함)을 각각 조회한다.
- [ ] 단지 즐겨찾기와 매물 즐겨찾기는 완전히 독립된 목록으로 동작하며 서로의 추가/해제에 영향을 주지 않는다.
- [ ] 인증/세션 로직 없이 user_profile_id=1 고정값만 사용한다.
- [ ] 통합 테스트 및 커버리지 80% 이상.

**의존성**: BE-0, DB-3(favorite_complexes, favorite_listings, user_profiles), DB-4(시드). BE-1(listings repository), BE-8(apartment-complexes repository, join 조회 재사용) 완료 시 더 수월하나 필수는 아님.

**규모**: 작음~중간

---

### BE-3. F3 비교셋 생성 및 비교 (단지 비교 / 매물 비교 분기)

**목적**: 비교 대상 유형(`target_type`: complex/listing)에 따라 단지 2~5개 또는 매물 2~5개를 묶어 비교셋을 생성하고 다축 비교 데이터를 반환. 동일 단지/매물 중복 포함 방지 포함(v0.6 규칙). 단지 비교와 매물 비교를 한 비교셋에 혼합하지 않는다(도메인 §4.5).

**완료 조건**
- [ ] `POST /api/comparison-sets {targetType, complexIds:[...] | listingIds:[...]}`로 생성 시 `targetType='complex'`이면 `complexIds`를, `'listing'`이면 `listingIds`를 사용해 `comparison_set_complexes` 또는 `comparison_set_listings`에만 행을 생성한다(target_type과 매핑 테이블 정합성은 서비스 레벨에서 검증, ERD v0.4 §2).
- [ ] 대상 개수 2개 미만이면 400과 "비교하려면 2개 이상 선택해야 합니다".
- [ ] 대상 개수 6개 이상 전달 시 400과 "비교셋은 최대 5개까지 선택할 수 있습니다".
- [ ] `POST /api/comparison-sets/:id/complexes {complexId}` 또는 `POST /api/comparison-sets/:id/listings {listingId}`로 이미 포함된 대상을 다시 추가 시도하면 각각 DB UNIQUE(comparison_set_id, complex_id / listing_id) 위반을 포착해 409와 "중복입니다"를 반환하고 추가하지 않는다(시나리오 3-3).
- [ ] `GET /api/comparison-sets/:id` 응답은 `target_type`에 따라 분기한다: **단지 비교**는 연식/리모델링 이력/재건축 추진현황/주변 재개발 정보/교통/상권/학군/강남접근성/유흥·공원/셔틀 통근시간/개발호재/주변일자리 + **단지 시세**(BE-8 집계 로직 재사용, 매물 0건 단지는 "매물 없음")를 단지별로 반환하고, **매물 비교**는 매물 자체 속성(매매가, 전용면적) + 소속 단지의 동일 축 정보를 매물별로 조합해 반환한다(도메인 §5.5, 시나리오 3-4, 3-5).
- [ ] 동일 단지에 속한 매물끼리 매물 비교를 수행할 경우 단지 축 값(연식 등)이 모든 대상에서 동일하게 반환되며 이는 오류가 아니다(시나리오 3-5).
- [ ] `locality_attributes`에 없는 축은 `"정보 없음"`으로 반환한다(시나리오 3-1).
- [ ] `comparison-set.service.js`가 개수 검증과 target_type 분기를 순수 함수로 구현하고 2/5/6개 경계값 및 complex/listing 각 분기 단위 테스트가 있다.
- [ ] 커버리지 80% 이상.

**의존성**: BE-0, DB-3(comparison_sets, comparison_set_complexes, comparison_set_listings), BE-8(단지 시세 집계 재사용). BE-1, BE-2 완료 시 통합 테스트 용이(필수는 아님).

**규모**: 큼

---

### BE-4-1. F4-1 규제 판단 서비스 (regulation.service.js)

**목적**: 도메인 §5.1(토허구역/규제지역 판단, 갭투자 가능 여부, 실거주 의무)을 순수 계산 로직으로 구현.

**완료 조건**
- [ ] `is_land_transaction_permission_zone = true`이면 갭투자 불가, 실거주의무 기본 2년을 반환한다.
- [ ] `is_land_transaction_permission_zone = null`(미고시)이면 `"확인필요"` 플래그를 반환하고 규제 계산에는 영향을 주지 않는다.
- [ ] `is_regulated_area = true`이고 다주택자이면 LTV 0%(신규 주담대 불가)와 6개월 이내 전입의무를 반환한다.
- [ ] `갭투자 가능 여부 = NOT(토허구역) AND NOT(규제지역 내 주담대 실행)` 공식이 그대로 구현되어 있다.
- [ ] 세대 주택 보유 구분 × 규제지역 여부 조합별 LTV(70/80/60/70/50/60/0/60%)가 §5.1.3 표와 정확히 일치하는 단위 테스트가 있다.
- [ ] "배우자 1인 주거용 오피스텔 1채 보유"가 "1주택"으로 처리되고 "다주택"으로 오분류되지 않는 테스트가 있다.
- [ ] 단위 테스트 커버리지 80% 이상(DB 접근 없음).

**의존성**: BE-0. BE-1/BE-8의 매물이 속한 단지(apartment_complexes)의 규제지역/토허구역 필드 구조와 정합 확인 필요(규제 정보는 매물이 아닌 소속 단지 컬럼에서 조회함, 도메인 §4.1).

**규모**: 중간

---

### BE-4-2. F4-2 원리금균등상환(PMT) 계산 서비스 (repayment.service.js)

**목적**: 도메인 §5.3 PMT 계산을 순수 함수로 구현(BE-4-3, BE-6-2가 공통 재사용).

**완료 조건**
- [ ] PMT = P × r × (1+r)^n / ((1+r)^n − 1) 공식이 정확히 구현되고, 10/20/30년 알려진 계산값과 일치하는 테스트가 있다.
- [ ] 대출원금 0일 때 상환액 0을 반환(0 나눗셈 등 경계 오류 없음).
- [ ] DSR 역산(연간 허용 상환액 → 대출원금)이 PMT의 역함수로 구현되고, 왕복 계산 검증 테스트가 있다.
- [ ] 연 금리는 하드코딩하지 않고 인자/설정값으로 주입 가능하다.
- [ ] 단위 테스트 커버리지 80% 이상.

**의존성**: BE-0. 다른 서비스와 독립적으로 병행 개발 가능.

**규모**: 작음~중간

---

### BE-4-3. F4-3 최대 대출가능금액 산출 서비스 + F4 통합 API

**목적**: 도메인 §5.2(LTV/DSR역산/지역한도 MIN)를 구현하고 F4 통합 API를 완성.

**완료 조건**
- [ ] `최대 대출가능금액 = MIN(LTV상한액, DSR역산상한액, 지역별한도상한)` 공식이 정확히 구현되어 있다.
- [ ] 규제지역 내 주담대는 소득/명의 무관 6억원 상한을 적용한다.
- [ ] `GET /api/listings/:id/regulation`이 매물이 속한 단지(apartment_complexes)의 규제 현황(BE-4-1), 최대 대출가능금액, 갭투자 가능 여부, 실거주 필수 기간을 하나의 응답으로 반환한다(규제/토허구역 정보는 매물이 아닌 소속 단지 컬럼에서 조회).
- [ ] 평택 등 규제지역이 소속 단지 기준으로 미확정인 매물 조회 시 응답에 `"확인필요"` 플래그와 "비규제지역 LTV(하한값) 임시 적용" 안내가 포함된다(시나리오 4-2).
- [ ] "내 정보" 미입력 상태(재무 컬럼 null)에서는 규제 현황은 정상 반환하되 대출가능금액 필드는 null 또는 "내 정보 입력 필요" 상태로 반환한다(F6과 경계 정합, 시나리오 6-2).
- [ ] 단위 테스트 커버리지 80% 이상.

**의존성**: BE-4-1, BE-4-2, BE-1(listings repository), BE-8(apartment-complexes repository, 매물이 속한 단지의 규제 정보 조회), BE-6-1(user-profile repository).

**규모**: 큼

---

### BE-5. F5 매물 상세 - 입지 정보

**목적**: F3과 동일한 입지 축을 단독 매물 기준으로 조회(입지/연식/리모델링/재건축/재개발 정보는 매물이 속한 단지 기준).

**완료 조건**
- [ ] `GET /api/listings/:id/locality`가 매물이 속한 단지(apartment_complexes)의 교통/상권/학군/강남접근성/유흥·공원/개발호재/주변일자리와 연식/리모델링 이력/재건축 추진현황/주변 재개발 정보를 반환한다.
- [ ] `locality_attributes`에 없는 축은 `"정보 없음"`으로 채워 반환하고 500 에러가 없다(시나리오 5-2).
- [ ] 존재하지 않는 매물 id 조회 시 404.
- [ ] BE-3, BE-8의 축 포맷 로직과 공통 함수를 공유해 중복 구현을 피한다.
- [ ] 테스트 커버리지 80% 이상.

**의존성**: BE-1(listings repository), BE-8(apartment-complexes repository, 소속 단지 정보 조회). BE-3과 공유 유틸 설계 조율 권장(선후 무관, 병행 가능).

**규모**: 작음

---

### BE-6-1. F6-1 사용자 프로필(내 정보) API

**목적**: 단일 사용자 프로필(고정 id=1) 조회/수정 API.

**완료 조건**
- [ ] `GET /api/user-profile`은 항상 id=1을 반환하며, 미입력 상태(재무 컬럼 null)에서도 200과 null 필드가 포함된 객체를 반환한다.
- [ ] `PUT /api/user-profile`로 명의구성/연소득/성과금/자본금/세대주택보유구분/생애최초여부/근무지 수정 시 즉시 반영되고 갱신 값을 응답한다.
- [ ] `housing_ownership_tier`가 "무주택"이 아닌데 `is_first_time_buyer=true` 요청 시 400을 반환한다(DB CHECK와 별개로 서비스 레벨 선제 검증).
- [ ] `workplace`는 "화성"/"평택"/null만 허용, 그 외 값은 400.
- [ ] 인증/세션 없이 고정 id=1만 사용한다.
- [ ] 통합 테스트 커버리지 80% 이상.

**의존성**: BE-0, DB-3(user_profiles), DB-4(시드).

**규모**: 작음

---

### BE-6-2. F6-2 대출 시뮬레이션 비교 서비스 + API

**목적**: 도메인 §5.4(부부합산 vs 단독명의 비교)를 구현. 정책모기지(디딤돌 등)는 계산 범위에서 제외.

**완료 조건**
- [ ] 두 시나리오 모두 §5.1.3 "1주택" LTV를 적용하고 생애최초 특례가 적용되지 않음을 강제한다.
- [ ] BE-4-3(loan-limit.service), BE-4-2(repayment.service)를 재사용해 시나리오별 최대 대출가능금액·10/20/30년 상환액을 산출한다(로직 재구현 금지).
- [ ] 판단 절차 (a)자금조달가능 → (b)대출가능금액 최댓값 → (c)DSR실사용률 최솟값 → (d)동률 시 부부합산 우선 4단계가 §5.4 순서 그대로 구현되고, 시나리오 6-1 예시 패턴(부부합산 조달불가 → 단독명의 선택)이 단위 테스트로 재현된다.
- [ ] `GET /api/listings/:id/loan-simulation` 호출 시 프로필 미입력 상태면 `{profileIncomplete: true}` 류 응답을 반환하고 예외를 던지지 않는다(시나리오 6-2).
- [ ] 응답에 "디딤돌대출·보금자리론 등 정책모기지는 계산 범위 제외, 별도 채널 확인 필요" 고지가 포함된다.
- [ ] "내 정보" 수정 후 동일 매물 재요청 시 최신 프로필 기준으로 재계산됨을 테스트로 확인한다(stale 캐시 없음).
- [ ] 단위 테스트 커버리지 80% 이상.

**의존성**: BE-4-2, BE-4-3, BE-6-1, BE-1.

**규모**: 큼

---

### BE-7. F7 매물 상세 - 20년 매매가 변동 이력

**목적**: 국토교통부 실거래가 이력을 20년/최초거래이후/이력없음 3가지로 분기 제공. 실거래 이력은 매물이 아닌 매물이 속한 단지(apartment_complexes) 단위로 관리되므로(`price_history.complex_id`), 매물 id로 요청받아 소속 단지 id로 변환 후 조회한다.

**완료 조건**
- [ ] `GET /api/listings/:id/price-history`는 매물 id → 소속 단지 id(`listings.complex_id`)로 변환해 `price_history`를 `complex_id` 기준으로 조회하며, 20년 이상 데이터 보유 시 최근 20년치만 반환한다.
- [ ] 20년 미만이면 전체 데이터를 반환하고, 최초거래 시점(`YYYY-MM`)과 `"최초거래 이후"` 라벨을 포함한다(시나리오 7-2).
- [ ] 실거래 데이터 0건이면 200과 빈 배열, `"실거래 이력 없음"` 플래그를 반환한다(시나리오 7-3).
- [ ] 각 레코드에 거래일자, 거래금액, 고정 출처 "국토교통부 아파트 실거래가 공개시스템(오픈API)"가 포함된다.
- [ ] `lookup_period_type` 값이 실제 반환 데이터 범위와 일치하는 단위 테스트가 있다.
- [ ] 동일 단지에 속한 서로 다른 매물 id로 조회해도 동일한 실거래 이력(단지 기준)이 반환됨을 확인하는 테스트가 있다(단지-매물 1:N 구조 반영).
- [ ] 테스트 커버리지 80% 이상.

**의존성**: BE-0, DB-3(price_history, listings, apartment_complexes), BE-1(listings.complex_id 조회), DB-5(20년 이상/미만/0건 3케이스 픽스처).

**규모**: 중간

---

### BE-8. 아파트 단지 조회 및 단지 시세 집계 서비스

**목적**: 도메인 §4.1(단지 기본정보)·§5.5(단지 시세 산출 규칙)에 따라 단지 상세 조회와 "단지 시세"(해당 단지에 속한 매물들의 매매가 조회 시점 집계, 비영속 계산값) 서비스를 구현한다. 이 서비스는 BE-1(매물 조회 join), BE-2(단지 즐겨찾기), BE-3(단지 비교), BE-4-1/BE-4-3(단지 규제 정보), BE-5(단지 입지 정보)가 공통으로 재사용한다.

**완료 조건**
- [ ] `apartment-complexes.repository.js`가 `apartment_complexes` 테이블에 대한 조회 SQL(단건/목록/좌표 범위)을 전담하며, 다른 계층에는 SQL이 없다.
- [ ] `GET /api/complexes/:id`로 단지 상세(단지명, 위치, 준공년도, 리모델링 이력, 재건축 추진현황, 주변 재개발 정보, 규제지역/토허구역 여부, 셔틀 정보, 입지 속성)를 조회할 수 있고, 존재하지 않는 id는 404를 반환한다.
- [ ] `apartment-complex-price.service.js`(가칭)가 특정 단지 id에 속한 `listings.sale_price`를 MIN/MAX(필요 시 AVG)로 집계해 "단지 시세"를 계산하며, 이 값을 별도 테이블/컬럼에 저장하지 않고 매 요청마다 조회 시점에 계산한다(오버엔지니어링 금지, ERD v0.4 §1.2).
- [ ] **매물이 0건인 단지는 시세를 "매물 없음"으로 반환한다**(빈 배열 집계 시 예외를 던지지 않고 명시적 상태값으로 처리, DB-5 매물 0건 단지 픽스처로 검증).
- [ ] `GET /api/complexes/:id`(단지 상세 응답에 시세 포함) 형태로 단지 시세를 조회할 수 있다.
- [ ] 토허구역 여부가 `null`(미고시)인 단지는 응답에 `"확인필요"` 플래그를 포함하고 다른 필드에는 영향을 주지 않는다.
- [ ] 셔틀 정보가 null인 단지는 해당 필드를 `null` 또는 `"정보 없음"`으로 반환한다.
- [ ] 단위/통합 테스트 커버리지 80% 이상(매물 0건/1건/다건 단지 3케이스 포함).

**의존성**: BE-0, DB-3(apartment_complexes, listings 테이블).

**규모**: 중간

---

## 4. 프론트엔드 트랙

### FE-1. 공통 인프라 및 전역 Provider 설정

**목적**: F1~F7 전체가 의존하는 기반 레이어 구축.

**완료 조건**
- [ ] `QueryClientProvider`가 앱 루트에 장착되어 하위 컴포넌트에서 `useQuery` 정상 동작.
- [ ] `shared/api/client.ts` 외 위치에서 fetch 직접 호출이 없다.
- [ ] `Modal` 컴포넌트가 "중복입니다"(FE-5), "비교셋 최대 5개"(FE-5) 등에 재사용 가능한 범용 API(열림/닫힘/제목/본문/확인버튼)를 제공한다.
- [ ] `Badge` 컴포넌트가 "확인필요"(FE-7) variant를 지원한다.
- [ ] 라우터에 5개 화면(지도/목록, 매물 상세, 즐겨찾기, 비교셋, 내 정보) 경로가 등록되어 있다.
- [ ] `tsc --noEmit`, ESLint 통과.
- [ ] 공용 컴포넌트 테스트 커버리지 80% 이상.

**의존성**: 없음(최우선 선행).

**규모**: 중간

---

### FE-2. 지도 연동 (네이버지도, 제약 시 구글맵 대체)

**목적**: F1 매물 탐색 화면용 지도 렌더링 컴포넌트를 독립적으로 구축.

**완료 조건**
- [ ] `MapView`는 `listings` 좌표 배열 props만 받아 마커를 렌더링하며, 호출부는 SDK 종류(네이버/구글)를 알지 못한다(어댑터 격리).
- [ ] 네이버지도 SDK 사용 시 확대/축소, 마커 클릭 콜백이 정상 동작한다.
- [ ] API 키는 환경변수로만 주입되며 하드코딩되지 않는다.
- [ ] SDK 로드 실패 시 앱 크래시 없이 안내 문구를 표시한다.
- [ ] 관련 훅/유틸 테스트 커버리지 80% 이상(SDK는 mocking).

**의존성**: FE-1.

**규모**: 중간

---

### FE-3. F1 매물 탐색 및 셔틀 통근 분석

**목적**: 매매가 7~15억 구간 매물을 지도/목록에 노출하고, 매물이 속한 단지의 셔틀 통근시간·연식 등을 함께 표시.

**완료 조건**
- [ ] "7억~15억" 필터 조회 시 매물 카드/지도 핀이 정상 표시된다(시나리오 1-1).
- [ ] 조건에 맞는 매물 0건 시 "조건에 맞는 매물이 0건입니다"가 표시되고 필터 조정 UI는 계속 사용 가능하다(시나리오 1-2).
- [ ] 셔틀 정보가 소속 단지 기준으로 미확보된 매물은 통근시간 항목에 "정보 없음"이 표시되고 다른 기능 이용은 차단되지 않는다(시나리오 1-3).
- [ ] 매물 카드에 매물 자체 정보(매매가, 전용면적)와 함께 소속 단지의 최근접 셔틀 정류장명·거리·통근시간·연식이 함께 노출된다(BE-1 응답의 단지 join 데이터 사용).
- [ ] 컴포넌트/훅 테스트 커버리지 80% 이상(0건/정보없음 케이스 포함).

**의존성**: FE-1, FE-2. **백엔드: BE-1 완료 필요.**

**규모**: 큼

---

### FE-4. F2 즐겨찾기 (단지 즐겨찾기 탭 / 매물 즐겨찾기 탭)

**목적**: 단지 즐겨찾기와 매물 즐겨찾기를 각각 독립된 탭으로 제공하고, 각 탭 내에서 추가·해제 토글을 제공.

**완료 조건**
- [ ] 즐겨찾기 화면이 "단지 즐겨찾기" 탭과 "매물 즐겨찾기" 탭 2개로 구성되고, 각 탭은 독립적으로 목록을 조회·표시한다.
- [ ] 매물 카드/단지 카드의 하트 아이콘 탭 시 활성 전환되고 해당 유형(단지 또는 매물)의 즐겨찾기 목록에 즉시 반영된다(시나리오 2-1).
- [ ] 이미 즐겨찾기된 단지/매물 재탭 시 토글 OFF(해제)되며 신규 항목이 추가되지 않는다(시나리오 2-2).
- [ ] 각 탭(단지/매물)에 체크박스 선택 UI가 제공되어 FE-5(비교셋)에 대응하는 비교 유형(단지 비교/매물 비교)으로 선택 결과를 전달할 수 있다.
- [ ] 컴포넌트/훅 테스트 커버리지 80% 이상(단지 탭/매물 탭 각각).

**의존성**: FE-1, FE-3(ListingCard 재사용). **백엔드: BE-2, BE-8 완료 필요.**

**규모**: 작음~중간

---

### FE-5. F3 비교셋 생성 및 비교 (단지 비교 / 매물 비교)

**목적**: 비교 대상 유형(단지 비교/매물 비교) 선택 UI를 제공하고, 선택한 유형의 즐겨찾기 중 2~5개를 골라 다축 비교 화면을 구성한다. 동일 단지/매물 중복 추가 방지 포함.

**완료 조건**
- [ ] "비교하기" 진입 시 비교 대상 유형(단지 비교/매물 비교)을 먼저 선택하는 UI가 제공되고, 선택한 유형에 해당하는 즐겨찾기 탭(FE-4)에서 2~5개를 선택한다.
- [ ] **단지 비교** 선택 시: 서로 다른 단지 2~5개가 나란히 배치되고, 연식/리모델링 이력/재건축 추진현황/주변 재개발 정보/교통/상권/학군/강남접근성/유흥·공원/셔틀 통근시간/개발호재/주변일자리/**단지 시세**(매물 0건 시 "매물 없음") 축이 표로 비교된다(시나리오 3-4).
- [ ] **매물 비교** 선택 시: 매물 2~5개(서로 다른 단지끼리든 동일 단지 내 매물끼리든 모두 가능)가 나란히 배치되고, 매물 자체 속성(매매가/전용면적)과 소속 단지의 위 축들이 조합되어 표시된다. 동일 단지 내 매물끼리 비교하는 경우 단지 축 값이 모든 대상에서 동일하게 표시되며 이는 정상 동작이다(시나리오 3-5).
- [ ] 데이터 미확보 항목은 "정보 없음"으로 표시된다(시나리오 3-1).
- [ ] 6번째 선택 시도 시 선택이 막히고 "비교셋은 최대 5개까지 선택할 수 있습니다"(시나리오 3-2 Case 1).
- [ ] 1개만 선택 후 "비교하기" 시 진입이 막히고 "비교하려면 2개 이상 선택해야 합니다"(시나리오 3-2 Case 2).
- [ ] 이미 포함된 단지/매물 재추가 시도 시 "중복입니다" 팝업이 뜨고 추가되지 않으며 기존 상태가 유지된다(시나리오 3-3).
- [ ] 컴포넌트/훅 테스트 커버리지 80% 이상(단지 비교/매물 비교/동일 단지 매물 비교/5개 초과/1개 이하/중복 추가 케이스 포함).

**의존성**: FE-1, FE-4. **백엔드: BE-3, BE-8 완료 필요.**

**규모**: 큼

---

### FE-6. 매물 상세 공통 셸

**목적**: F4·F5·F6·F7이 탭으로 공존하는 매물 상세 화면의 공통 골격 구축.

**완료 조건**
- [ ] 매물 상세 진입 시 4개 탭(규제/대출, 입지 정보, 대출 시뮬레이션, 매매가 변동 이력)이 표시되고, 각 탭은 독립적으로 로딩/에러 상태를 가진다(한 탭 실패가 다른 탭을 막지 않음 — 시나리오 6-2, 7-3 반영).
- [ ] 각 탭 콘텐츠는 FE-7/FE-8/FE-9/FE-11이 구현하며, 이 Task는 탭 전환 골격과 공통 로딩/에러 처리만 담당한다.
- [ ] 컴포넌트/훅 테스트 커버리지 80% 이상.

**의존성**: FE-1. **백엔드: BE-1(매물 기본 정보 조회), BE-8(소속 단지 정보 조회) 완료 필요.**

**규모**: 작음

---

### FE-7. F4 매물 상세 - 규제/대출 분석

**목적**: 매물이 속한 단지의 토지거래허가구역·규제지역 여부, 최대 대출가능금액, 갭투자 가능 여부, 실거주 필수 기간 표시.

**완료 조건**
- [ ] 투기과열지구에 속한 매물 조회 시 (소속 단지 기준) 규제 현황, LTV 적용 결과 대출가능금액, "갭투자 불가"·"6개월 이내 전입 의무"가 표시된다(시나리오 4-1).
- [ ] 소속 단지의 규제지역이 미확정인 매물(평택 등)은 "확인필요" 배지와 "임시 산출값" 안내 문구가 표시된다(시나리오 4-2).
- [ ] LTV/DSR 계산 로직을 프론트에서 재구현하지 않고 백엔드 응답을 그대로 표시한다.
- [ ] 컴포넌트/훅 테스트 커버리지 80% 이상.

**의존성**: FE-6. **백엔드: BE-4-3 완료 필요.**

**규모**: 중간

---

### FE-8. F5 매물 상세 - 입지 정보

**목적**: F3과 동일한 입지 축을 단독 매물 기준으로 표시(입지/연식/리모델링/재건축/재개발 정보는 소속 단지 데이터).

**완료 조건**
- [ ] "입지 정보" 탭에서 소속 단지 기준 교통/상권/학군/강남 접근성/유흥·공원과 연식/리모델링 이력/재건축 추진현황/주변 재개발 정보가 단일 매물 기준으로 표시된다(시나리오 5-1).
- [ ] 데이터 없는 단지에 속한 매물은 해당 항목이 "정보 없음"으로 표시되고 나머지는 정상 표시, 화면 전체가 오류 없이 렌더링된다(시나리오 5-2).
- [ ] FE-5(비교셋)와 입지 축 표시 로직/컴포넌트를 가능한 재사용한다.
- [ ] 컴포넌트/훅 테스트 커버리지 80% 이상.

**의존성**: FE-6. **백엔드: BE-5 완료 필요.**

**규모**: 작음

---

### FE-9. F7 매물 상세 - 20년 매매가 변동 이력

**목적**: 국토교통부 실거래가 오픈API 기반 매매가 변동 그래프/테이블 표시(실거래 이력은 매물이 아닌 소속 단지 단위 데이터).

**완료 조건**
- [ ] 소속 단지 기준 20년 이상 데이터 보유 매물은 최근 20년 그래프와 거래 테이블이 출처와 함께 표시된다(시나리오 7-1).
- [ ] 20년 미만 데이터는 전체 데이터만으로 표시되고 "최초거래(YYYY-MM) 이후 데이터" 안내가 노출된다(시나리오 7-2).
- [ ] 소속 단지의 실거래 데이터가 0건인 매물은 "실거래 이력 없음"이 표시되고 다른 탭은 정상 이용 가능하다(시나리오 7-3).
- [ ] 동일 단지에 속한 서로 다른 매물 상세를 열어도 동일한 매매가 변동 이력이 표시됨을 확인한다(단지 단위 데이터임을 반영).
- [ ] dataviz 스킬 가이드에 따라 그래프가 라이트·다크 모드 모두에서 가독성 있게 구성된다.
- [ ] 컴포넌트/훅 테스트 커버리지 80% 이상(3가지 케이스 포함).

**의존성**: FE-6. **백엔드: BE-7 완료 필요.**

**규모**: 중간

---

### FE-10. "내 정보"(재무 프로필) 입력/수정 폼

**목적**: F6 입력값(명의구성/소득/성과금/자본금/세대주택보유구분)을 수집·저장·수정하는 폼. `user-profile/` feature가 단독 소유(4-project-principle.md §6 정정 반영).

**완료 조건**
- [ ] 앱 최초 진입 시 명의구성/연소득/성과금(기본값 0)/자본금/세대주택보유구분/생애최초해당여부(무주택일 때만 활성화)를 입력받는 폼이 렌더링된다.
- [ ] 저장 성공 시 단일 프로필로 영구 저장되며 "내 정보" 화면에서 재조회·수정 가능하다.
- [ ] 수정 후 저장 시 관련 쿼리 캐시가 무효화되어 FE-11(대출 시뮬레이션)이 최신값 기준으로 재계산 트리거된다.
- [ ] "세대 주택 보유 구분"이 "무주택"이 아니면 생애최초 해당 여부가 자동 false 처리되거나 선택 불가 처리된다.
- [ ] 컴포넌트/훅 테스트 커버리지 80% 이상.

**의존성**: FE-1. **백엔드: BE-6-1 완료 필요.**

**규모**: 중간

---

### FE-11. F6 매물 상세 - 대출 시뮬레이션 (결과 화면)

**목적**: 저장된 재무 프로필(FE-10) 기반으로 부부합산 vs 단독명의 시나리오를 매물별로 계산·비교.

**완료 조건**
- [ ] "내 정보" 입력 상태에서 탭 진입 시 두 시나리오의 최대 대출가능금액·10/20/30년 상환액·필요 자기자본이 나란히 표시되고 유리한 시나리오가 안내된다(시나리오 6-1).
- [ ] "내 정보" 미입력 상태에서는 계산 결과 대신 "내 정보를 입력해주세요" 문구와 "내 정보 입력하기" 버튼이 표시되고, 클릭 시 FE-10 화면으로 이동한다(시나리오 6-2).
- [ ] "내 정보" 미입력 상태에서도 F4/F5/F7 탭은 정상 이용 가능하다(FE-6 셸의 독립 탭 로딩과 연동 확인).
- [ ] 정책모기지 제외 안내 문구가 노출된다.
- [ ] LTV/DSR/PMT 계산 로직을 프론트에서 재구현하지 않는다.
- [ ] 컴포넌트/훅 테스트 커버리지 80% 이상(프로필 미입력/입력완료 2케이스 포함).

**의존성**: FE-6, FE-10. **백엔드: BE-6-2 완료 필요.**

**규모**: 큼

---

## 5. 전체 Task 요약 및 실행 순서 가이드

| 순서 | DB | 백엔드 | 프론트엔드 |
|---|---|---|---|
| 1 | DB-1 → DB-2 | (대기) | FE-1 (병렬 착수 가능) |
| 2 | DB-3 → DB-4 → DB-5 | BE-0 (DB-3·4 완료 후) | FE-2 |
| 3 | - | BE-8 (BE-0 완료 후, 단지 조회/시세 집계 — BE-1~BE-5의 공통 선행 Task), BE-4-2, BE-6-1 (병렬 가능) | FE-6 (BE-1 완료 후) |
| 4 | - | BE-1, BE-2, BE-3, BE-4-1, BE-5, BE-7 (BE-8 완료 후 병렬 가능) | FE-3, FE-4, FE-5 (각 대응 BE 완료 후), FE-8, FE-9, FE-10 |
| 5 | - | BE-4-3 (BE-4-1·4-2·BE-8 완료 후) | FE-7 (BE-4-3 완료 후) |
| 6 | - | BE-6-2 (BE-4-2·4-3·6-1 완료 후) | FE-11 (BE-6-2, FE-10 완료 후) |

총 28개 Task (DB 5개 + 백엔드 12개[BE-0, BE-1~3, BE-4-1~3, BE-5, BE-6-1~2, BE-7, BE-8] + 프론트엔드 11개).

---

## 6. 범위 밖(Out of Scope) 명시

본 문서는 Task 분해와 완료조건/의존성까지만 다룬다. API 요청/응답 전체 스키마, 상세 컴포넌트 설계, 실제 코드 구현은 각 Task 수행 시점에 `backend-resolver`/`frontend-resolver` 스킬을 통해 진행하며, API 명세는 `swagger/swagger.json`에서 별도 관리한다. 배포/CI/CD 파이프라인 구성은 이번 실행계획에 포함하지 않는다.
