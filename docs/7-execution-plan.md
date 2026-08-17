# housing 실행계획 (Execution Plan)

- 버전: v0.32
- 최종 수정일: 2026-08-17
- 참조 문서: [1-domain-definition.md](./1-domain-definition.md) (v0.14), [2-prd.md](./2-prd.md) (v0.6), [3-user-scenario.md](./3-user-scenario.md) (v0.5), [4-project-principle.md](./4-project-principle.md) (v0.7), [5-arch-diagram.md](./5-arch-diagram.md) (v0.5), [6-erd.md](./6-erd.md) (v0.7), `database/schema.sql`, `backend/swagger/swagger.json`
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
| v0.8 | 2026-07-06 | BE-0 수행 완료 및 완료 조건 체크: `config/env.js`, `db/pool.js`, `middlewares/{cors,error-handler}.js`, `app.js`, `index.js` 구현(서브에이전트 병렬 구현+테스트 작성 후 직접 검증). 구현 과정에서 발견한 `env.js` 결함(누락 시 종료 로직 우회 시 후속 코드가 실행되어 예외 발생) 수정, 서브에이전트가 임의로 추가한 미사용 `nodemon` 의존성/스크립트 제거. 단위+통합 테스트 17개 전부 통과(라인 커버리지 100%), 실제 `housing` DB 연결 및 `npm start` 기동 확인 |
| v0.9 | 2026-07-06 | BE-8 수행 완료 및 완료 조건 체크(BE-1의 선행 의존성이라 BE-1보다 먼저 진행): `apartment-complexes.repository.js`, `listings.repository.js`, `apartment-complex-price.service.js`, `apartment-complexes.service.js`, `complexes.controller.js`, `complexes.routes.js` 구현. 구현 중 직접 발견/수정한 결함: PostgreSQL `numeric` 컬럼(latitude/longitude)이 문자열로 반환되어 swagger `type: number`와 불일치 — `db/pool.js`에 전역 숫자 타입 파서 추가로 수정. 단위 9개+통합 1개 파일, 37개 테스트 전부 통과(라인 커버리지 96%), `housing_test` 픽스처로 정상/셔틀없음/매물없음 3케이스 및 404 케이스 실제 curl 검증 |
| v0.10 | 2026-07-06 | BE-1 수행 완료 및 완료 조건 체크: `listings.repository.js`(join 조회, 좌표 필터), `listings.service.js`, `listings.controller.js`, `listings.routes.js` 구현, BE-8 `apartment-complexes.service.js`의 `mapSummaryFields`를 export 확장해 재사용. 테스트 중 직접 발견/수정한 테스트 코드 버그 2건(① `jest.resetAllMocks()`가 mock 구현까지 지워 `complex`가 undefined되던 문제 → `clearAllMocks()`로 수정, ② 가격 필터 통합테스트가 105000도 범위에 포함됨을 놓쳐 기대 건수가 틀렸던 문제 → 조건값 정정). 56개 테스트 전부 통과(라인 커버리지 95.9%) |
| v0.11 | 2026-07-06 | BE-2/BE-3/BE-4-1/BE-4-2/BE-6-1 5개 Task를 병렬 서브에이전트(구현+테스트 동시 진행)로 수행 완료 및 완료 조건 체크: 즐겨찾기(단지/매물 이원화 CRUD+409), 비교셋(단지/매물 비교, 트랜잭션 생성, 409, BE-8/BE-1 재사용 조합), 규제 판단 서비스(LTV 8종/갭투자/실거주의무 순수함수), PMT 상환 계산 서비스(순수함수, DSR 역산), 사용자 프로필 API(조회/수정/검증) 구현. 5개 Task가 공통으로 손대는 `app.js` 라우트 마운트는 충돌 방지를 위해 서브에이전트가 직접 수정하지 않고 보고만 하도록 하여 직접 순차 병합. 테스트 중 커버리지 공백 발견(비교셋의 `addListing` 멤버 추가 경로와 404 케이스가 테스트에서 누락) → 통합테스트 케이스 추가로 보완. 전체 백엔드 135개 테스트 전부 통과(라인 커버리지 94.5%) |
| v0.12 | 2026-07-06 | 사용자 지적으로 발견한 문서 공백 수정: 프론트엔드 API 서버 주소 관련 규정이 전혀 없었음(백엔드 `.env`만 §5에 명시되어 있었고, `4-project-principle.md` §6 구조도에는 프론트엔드 `.env.example`이 나열되어 있었으나 내용 규정이 없어 문서 간 불일치). `4-project-principle.md` §5에 프론트엔드는 `VITE_API_BASE_URL`(Vite `VITE_` 접두사 규칙)로 API 주소를 주입하고 `shared/api/client.ts`에 하드코딩하지 않는다는 원칙, 백엔드 `CORS_ORIGIN`과 프론트 개발 서버 origin이 일치해야 한다는 연동 규칙 추가(v0.7). FE-1 완료조건에 `VITE_API_BASE_URL` 사용/`.env.example`/`.env` 존재, CORS origin 일치 항목 추가 |
| v0.13 | 2026-07-08 | BE-5/BE-7/BE-4-3/FE-1 4개 Task를 병렬 서브에이전트(계획→구현+테스트 동시 진행)로 수행 완료 및 완료 조건 체크. BE-5(매물 입지 정보)는 BE-8 `getComplexDetail` 재사용만으로 신규 SQL 없이 구현. BE-7(20년 매매가 변동 이력)은 단지 `completion_year` 기준 경과연수로 20년/최초거래이후 분기 판정, 구현 중 `pg`가 `DATE` 컬럼을 로컬 자정 기준으로 파싱하는데 서비스가 UTC getter로 읽어 UTC+9 환경에서 날짜가 하루 밀리던 버그를 직접 발견해 로컬 getter로 수정. BE-4-3(최대 대출가능금액)은 신규 `loan-limit.service.js`로 LTV/DSR역산/지역한도 MIN() 공식 구현(DSR 역산 기준 만기 30년·금리 4.0%는 도메인 문서에 명시가 없어 채택한 가정으로 코드에 명시), 평택 등 규제 미확정 단지에는 비규제지역 LTV 임시 적용을 검증. BE-4-3 완료로 BE-6-2 의존성이 모두 충족되어 계획 수립 착수. FE-1(프론트�다 공통 인프라)은 Vite+React+TS 스캐폴드에 react-router-dom/@tanstack/react-query/vitest 등 신규 설치(사용자 승인) 후 QueryClientProvider/라우터(5개 화면)/`shared/api/client.ts`/Modal·Badge 컴포넌트 구현, `tsc --noEmit`·ESLint 통과, 구현 중 `vitest.config.ts`에 `test.globals: true` 누락으로 `@testing-library/jest-dom` setup이 실패하던 설정 공백을 직접 발견해 수정. 전체 백엔드 180개 테스트(라인 커버리지 95.04%), 프론트엔드 9개 테스트(공용 컴포넌트 라인 커버리지 100%) 전부 통과 |
| v0.14 | 2026-07-08 | BE-6-2(대출 시뮬레이션 비교) 수행 완료 및 완료 조건 체크 — 이로써 **백엔드 트랙 12개 Task 전부 완료**. 신규 `loan-scenario.service.js`가 BE-4-3 `loan-limit.service`/BE-4-2 `repayment.service`를 재사용해 단독/부부합산 두 시나리오를 계산하고 §5.4의 4단계 판단 절차(자금조달가능→대출가능금액 최댓값→DSR실사용률 최솟값→동률 시 부부합산 우선)를 순수함수로 구현. 도메인 문서에 배우자 개별 소득 처리 방식이 명시되어 있지 않아, 부부합산 시나리오는 동일 소득의 배우자를 가정해 DSR 소득 기준을 2배로 산정하는 가정을 채택(코드에 명시). 전체 백엔드 205개 테스트 전부 통과(라인 커버리지 95.19%) |
| v0.15 | 2026-07-08 | `docs/9-style-guide.md` 신규 작성(사용자 제공 네이버지도 UI 캡처 분석 기반 색상/타이포/여백/그림자/컴포넌트 패턴 디자인 토큰) 및 FE-1의 `Modal`/`Badge`에 토큰 적용. FE-6(매물 상세 공통 셸)·FE-10(내 정보 폼) 병렬 수행 완료 및 완료 조건 체크. FE-6은 4개 탭 패널을 동시 마운트하고 `TabErrorBoundary`로 개별 격리하는 구조로 "한 탭 실패가 다른 탭을 막지 않음" 요구사항을 구조적으로 보장. FE-10은 폼 라이브러리 없이 순수 `useState` 기반으로 구현(오버엔지니어링 금지 원칙에 따라 이 규모의 폼에 별도 라이브러리 불필요로 판단), `userProfileQueryKey`를 FE-11이 재사용할 캐시 무효화 계약으로 export. 프론트엔드 전체 30개 테스트 전부 통과(라인 커버리지 98.14%) |
| v0.16 | 2026-07-08 | FE-2(지도 연동) 수행 완료 및 완료 조건 체크. `MapAdapter` 인터페이스 + `NaverMapAdapter` 구현으로 어댑터 격리 패턴 적용(`@types/navermaps` 신규 devDependency 설치, 사용자 승인). 실제 NCP 지도 클라이언트 키는 아직 미발급 상태이며, `VITE_NAVER_MAP_CLIENT_ID` 부재 시 SDK 로드 실패로 간주해 크래시 없이 대체 문구를 표시하는 경로가 현재 실제로 사용 중임을 확인. `4-project-principle.md`(v0.8)에 키 발급 절차 문서화. 프론트엔드 전체 46개 테스트 전부 통과(라인 커버리지 99.13%) |
| v0.17 | 2026-07-08 | FE-3 계획 수립 중 발견한 BE-1 응답 공백 수정: `GET /api/listings`가 매물이 속한 단지의 `latitude`/`longitude`를 반환하지 않아 FE-3의 지도 핀 렌더링이 구조적으로 불가능했음(좌표 범위 필터 `minLat/maxLat/minLng/maxLng`는 이미 존재했으나 좌표 자체는 응답에 없던 결함). `listings.repository.js` SELECT에 `c.latitude, c.longitude` 추가, `listings.service.js`의 `mapListingRow`가 이를 `complex` 객체에 포함하도록 수정, `swagger.json`의 `Listing.complex` 스키마에 반영, 통합테스트에 좌표 타입 검증 추가. 전체 백엔드 205개 테스트 전부 통과 |
| v0.18 | 2026-07-08 | FE-3(매물 탐색)/FE-7(규제·대출)/FE-8(입지 정보)/FE-9(매매가 변동 이력)/FE-11(대출 시뮬레이션) 5개 Task를 병렬 서브에이전트로 수행 완료 및 완료 조건 체크. FE-3은 zustand 대신 컴포넌트 로컬 `useState` 채택(단일 화면 필터 상태라 오버엔지니어링 방지). FE-8이 `shared/components/LocalityAxisList.tsx`를 FE-5 재사용을 대비한 공용 컴포넌트로 먼저 구축. FE-9는 신규 차트 라이브러리 없이 순수 SVG로 구현, dataviz 스킬 검증기를 통과하는 `--color-chart-price-line` 라이트/다크 토큰을 `9-style-guide.md` 색상 체계에 맞춰 추가. FE-11은 "내 정보 수정 후 재계산" 요구사항을 `refetchOnMount: 'always'` + 라우트 언마운트 분석으로 해결(FE-10 코드 변경 불필요). FE-7/8/9/11이 공유하는 `ListingDetailTabs.test.tsx`/`.isolation.test.tsx`/`ListingDetailScreen.test.tsx`는 병렬 작업 충돌 방지를 위해 각 탭 서브에이전트가 손대지 않도록 하고 직접 통합 수정(QueryClientProvider·apiClient mocking 추가, 스텁 텍스트 검증을 실제 비동기 상태 검증으로 교체). 프론트엔드 전체 29개 테스트 파일·122개 테스트 전부 통과(라인 커버리지 99.5%) |
| v0.19 | 2026-07-09 | FE-4(즐겨찾기) 수행 완료 및 완료 조건 체크. `favoritesSelectionStore`(zustand)를 신규 설치 — `4-project-principle.md` §6이 "비교셋 선택 체크박스 상태"를 zustand 사용 사례로 명시적으로 예시했고 탭 전환 간 선택 유지가 필요해 FE-3의 단일 화면 필터 상태와 달리 실제로 근거가 있어 사용자 승인 후 도입. 백엔드 실제 라우트 코드(`favorites.routes.js`)를 직접 확인해 DELETE가 즐겨찾기 row의 `id`가 아닌 `complexId`/`listingId`를 사용함을 검증 후 훅 구현에 반영. 즐겨찾기 목록 화면에서는 하트 탭이 항상 "해제"만 수행(모든 항목이 이미 즐겨찾기 상태이므로) — 검색 화면(FE-3)에 추가 토글을 연동하는 것은 완료조건에 명시되지 않아 범위 밖으로 판단. 프론트엔드 전체 39개 테스트 파일·160개 테스트 전부 통과(라인 커버리지 99.61%). 테스트 실행 중 시스템 리소스 경합으로 인한 타임아웃 발견 — `vitest.config.ts`에 `testTimeout: 20000` 추가로 완화 |
| v0.20 | 2026-07-09 | FE-5(비교셋 생성 및 비교) 수행 완료 및 완료 조건 체크 — **이로써 DB 5개 + 백엔드 12개 + 프론트엔드 11개, 총 28개 Task 전부 완료**. FE-4의 `favoritesSelectionStore`(zustand)를 그대로 소비해 즐겨찾기 탭에 5개 상한/2개 미만 차단(`Modal` 경고)과 "비교하기" 버튼을 추가, 비교셋 생성 성공 시 `/comparison-sets/:id`로 이동. 비교 결과 화면은 `shared/components/LocalityAxisList.tsx`의 라벨 매핑(`LOCALITY_ATTRIBUTE_LABELS`/`ORDER`)을 재사용해 단지/매물 비교 표를 구성(FE-8이 미리 설계해둔 재사용 지점). 구현 중 `shared/api/client.ts`가 에러 응답을 JSON 파싱하지 않던 결함을 발견해 수정(백엔드 `{message: "중복입니다"}` 형식의 에러 메시지를 그대로 노출하기 위해 필요). 프론트엔드 전체 47개 테스트 파일·197개 테스트 전부 통과(라인 커버리지 96.94%) |
| v0.21 | 2026-07-10 | 28개 Task 완료 후 실사용 테스트(`docs/10-api-test-report.md`) 중 발견한 공백을 후속 반영: FE-6이 "탭 전환 골격"만 완료조건으로 명시해 매물 상세 화면 상단에 단지명/매매가/전용면적 헤더(와이어프레임 §2.1에는 이미 명시돼 있었음)가 실제로는 표시되지 않던 공백을 발견해 `useListing` 훅과 `ListingDetailScreen` 헤더를 추가로 구현. 전역 네비게이션 헤더(즐겨찾기/비교셋/내 정보, 와이어프레임에 명시됐으나 미구현이었음)와 비교셋 목록 조회(`GET /api/comparison-sets`, 기존에 아예 없었음) 추가. |
| v0.22 | 2026-07-10 | 실 DB에 매물이 없던 공백을 발견해 3개 신규 실데이터 연동 Task를 병렬 서브에이전트로 수행 완료 및 완료 조건 체크(도메인 v0.10, ERD v0.7 반영). **(1) 국토교통부 실거래가 fetch-through 연동**: 마이그레이션으로 `apartment_complexes.lawd_cd`/`molit_apt_name` 추가, 샘플 3개 단지를 실제 아파트(동탄역시범우남퍼스트빌/힐스테이트고덕센트럴/힐스테이트구성)로 교체(위경도는 대략값, 정밀 지오코딩 후속 필요), `molit-api.repository.js`/`molit-price-history.service.js` 신규 구현(월단위 API 특성상 최근 3년(36개월)로 조회범위 한정, 매핑 없는 단지는 기존 로컬 20년 로직으로 폴백). 개발 샌드박스의 아웃바운드 네트워크 제약으로 `apis.data.go.kr` 실호출이 403으로 막혀 lawd_cd 유효성은 이 세션에서 실증하지 못함 — 실제 배포 환경에서 재검증 필요. **(2) 학교위치(학군) 연동**: `elementary_schools` 테이블 신설 + haversine 거리 기반 최근접 학교 계산 구현, 시드 스크립트(`backend/scripts/seed-elementary-schools.js`) 작성 완료했으나 data.go.kr "전국초중등학교위치표준데이터" API 활용신청이 아직 미승인 상태(`SERVICE KEY IS NOT REGISTERED ERROR`)라 시드 결과 0건 — 승인 후 스크립트 재실행 필요. **(3) 상권정보(유흥시설) 연동**: 소상공인시장진흥공단 상권정보 API(`storeListInRadius`)로 700m 반경 실시간 조회 구현, 판별 업종코드는 지정값(552201~552206)을 사용하나 실측 결과 이 코드가 실제 API 스키마와 형식이 달라 상시 결과없음을 반환함을 확인(코드값 재검증 필요, §7.1 미해결 이슈로 도메인 문서에 별도 기록). 3개 Task 모두 강남 접근성 직선거리·즐겨찾기 별아이콘(FE) 등 이전 Task와 무관한 자체 완결 작업으로 기존 Task 번호 체계 밖에서 관리. 전체 백엔드 28개 스위트·259개 테스트 전부 통과(라인 커버리지 92.97% 이상) |
| v0.23 | 2026-07-10 | v0.22의 미해결 이슈였던 유흥시설 업종코드 확정(도메인 v0.11 반영): `storeListInRadius` API 무필터 실조회로 응답에 실제 담긴 `indsSclsCd` 값을 직접 확인해 유효 코드가 `I21101`("일반 유흥 주점") 하나뿐임을 실측 검증(강남역 700m 반경 5건 확인). 시도했던 552201~552206, I56211~I56213(KSIC 형식)은 모두 이 API 스키마와 달라 상시 결과없음이었음. `entertainment-venue.service.js`의 `ENTERTAINMENT_INDUSTRY_CODES`를 `I21101` 단일값으로 수정, 백엔드 28개 스위트·259개 테스트 재검증 통과 |
| v0.24 | 2026-07-10 | 유흥시설 판별 업종코드 범위 확장(도메인 v0.12 반영): 사용자가 확인한 유흥주점업 표준산업분류코드 4종(`I21101`/`I21102`/`I21103`/`I21109`)을 모두 조회 대상에 추가. `entertainment-venue.service.test.js`에 코드 목록 검증 테스트와 "앞선 코드가 NODATA여도 이후 코드에서 매물 발견 시 true 반환·조회 중단" 테스트 추가. 백엔드 28개 스위트·261개 테스트 전부 통과 |
| v0.25 | 2026-07-10 | 네이버클라우드플랫폼 Geocoding API 연동(도메인 v0.13 반영, 실시간 지역 매물 검색 기능의 선행 작업): `geocoding-api.repository.js`(엔드포인트 `https://maps.apigw.ntruss.com/map-geocode/v2/geocode` — 구 도메인 `naveropenapi.apigw.ntruss.com`은 "Permission Denied" 오류로 실측 확인해 폐기)/`geocoding.service.js` 신규 구현, `DATA_GEOCODING_CLIENT_ID`/`DATA_GEOCODING_CLIENT_SECRET` 필수 환경변수 추가. 실주소 3건 실조회로 정상 동작 검증 후, 기존 "대략값" 좌표였던 3개 실제 단지의 위경도를 정밀 좌표로 갱신(`housing` DB 직접 UPDATE). 백엔드 29개 스위트·268개 테스트 전부 통과 |
| v0.26 | 2026-07-10 | 국토교통부_공동주택 단지 목록제공 서비스 연동 착수(도메인 v0.14 반영, 세대수/주차대수 표기 기능 1단계): `apt-list-api.repository.js`/`apt-list.service.js` 구현, `DATA_APT_KR_API_KEY2` 필수 환경변수 추가. 이 개발 환경에서 `http/https`, 경로 버전(`AptListService`/`AptListService3`/`AptListService2`), 파라미터(`lawdCd`/`sigunguCode`) 4가지 조합을 실호출했으나 전부 `500 Unexpected errors`로 실증 실패 — 기존에 이미 알려진 국토부 실거래가 API(1613000, 403 차단)와 유사하게 이 개발 환경의 아웃바운드 제약으로 판단되며, 실제 배포 환경에서 재검증 필요. XML 파싱 로직만 모킹 기반 단위테스트로 검증. 백엔드 30개 스위트·273개 테스트 전부 통과 |
| v0.27 | 2026-08-17 | **실시간 지역 매물 검색(배치 캐싱) 기능의 미완료 상태 점검 및 문서화**: 커밋 b60abbf에서 백엔드 구현(`regional_listing_cache` 마이그레이션 파일, 배치 수집기 `scripts/collect-regional-listings.js`(`npm run collect-listings`), `GET /api/listings/live-search`·`POST /api/listings/live-search/select` 엔드포인트, 선택 시 단지/매물 승격 로직)은 완료되었으나 changelog에 미기록이었던 것을 소급 기록. 점검 결과 이 기능이 실제로 동작하지 않는 3가지 공백 확인: **① `housing` DB에 `1783619500000_create-regional-listing-cache` 마이그레이션이 미적용**(pgmigrations 12건에서 중단, 테이블 자체가 없어 live-search API·수집기 모두 런타임 오류), **② 배치 수집기 미실행**(캐시 0건), **③ 프론트엔드 미연동**(frontend/src에 live-search 호출 코드가 전혀 없고 검색 화면(FE-3)은 `GET /api/listings`만 호출) — 이로 인해 화면에는 v0.22에서 수동 시드한 3개 단지·4개 매물(테스트 데이터)만 표시되는 상태. 해소 절차: `backend`에서 `npm run migrate up` → `npm run collect-listings` → FE-3 검색 화면을 live-search API에 연동하는 신규 FE Task 수행. ERD v0.8에 `regional_listing_cache` 테이블 추가(schema.sql에는 이미 존재했으나 ERD 누락이었음) |
| v0.28 | 2026-08-17 | **v0.27 해소 절차 수행 완료 + 대상 지역·세대수 조건 확장(도메인 v0.16 반영)**: **(1) 조건 확장** — `target-regions.js`를 10개 항목으로 확장(사용자 지정 후보지: 서울 강동구/성남시 수정·중원·분당구/용인시 수지구/위례신도시 — 위례는 송파구·하남시의 해당 법정동만 수집하는 `dongs` 필터 신설, 성남 수정구 부분은 성남시 항목이 커버), live-search에 세대수 500세대 이상 필터 추가(`findByFilters`에 `minHouseholdCount`, null 세대수는 제외). **(2) 마이그레이션 적용** — `housing`에 `regional_listing_cache` 생성(pgmigrations 13건), `housing_test`에도 동일 DDL 직접 적용해 정합성 유지. **(3) 배치 수집** — 첫 실행 전지역 0건의 원인 2건을 실측으로 발견·수정: ① 국토부 실거래가 API의 Dev 버전(`RTMSDataSvcAptTradeDev`)이 발급 키 활용신청 범위 밖(SERVICE_KEY_IS_NOT_REGISTERED)이라 비-Dev(`RTMSDataSvcAptTrade`)로 엔드포인트 교체(v0.22 당시 403 아웃바운드 차단으로 오인했던 것을 정정 — 현 환경은 아웃바운드 정상), ② 화성시가 2026-02-01 일반구 설치(만세/효행/병점/동탄구)로 41590이 4개 코드(41591/41593/41595/41597)로 분할되어 41590 조회가 상시 0건 — 구별 코드로 교체하고 기존 동탄 시드 단지의 `lawd_cd`를 41597로 DB 갱신. 재수집 결과 **13개 지역 3,300건 수집**(좌표 3,246건 확보). 단, 세대수 출처인 공동주택 단지목록 API는 구 버전 전부 폐기(NO_OPENAPI_SERVICE), 현행 `1613000/AptListService3/getLegaldongAptList3`는 실존하나 두 키 모두 활용신청 미등록 상태라 전 건 세대수 null → **500세대 필터에 걸려 live-search 노출 0건. data.go.kr에서 "국토교통부_공동주택 단지 목록제공 서비스" 활용신청 승인 후 `npm run collect-listings` 재실행 필요**(엔드포인트는 V3로 교체 완료). **(4) FE 연동** — 매물 탐색 화면에 "등록 매물/실시간 탐색" 모드 토글 신설: `useLiveListings`/`useSelectLiveListing` 훅과 `LiveListingCard` 추가, 실시간 카드·지도 핀 선택 시 승격 API 호출 후 매물 상세로 이동, 실패(404/422) 시 에러 모달 표시, 승격 성공 시 listings 쿼리 캐시 무효화. swagger.json에 live-search 2개 엔드포인트와 `RegionalListingCacheEntry` 스키마 추가. 검증: 백엔드 33개 스위트·301개(화성 코드 반영으로 1건 갱신), 프론트엔드 56개 파일·245개 테스트 전부 통과, `tsc --noEmit`·ESLint(기존 경고 2건 외 신규 0건) 통과, 서버 기동 후 live-search 200 응답 스모크 확인 |
| v0.29 | 2026-08-17 | **세대수 연동 완료(v0.28의 잔여 사용자 조치 해소, 도메인 v0.17 반영)**: 사용자의 단지목록 API 활용신청 승인으로 기존 키가 활성화됨을 실측 확인(.env 변경 불필요). 단, v0.26에서 구현했던 XML 기반 연동은 현행 API와 불일치라 재작성 — `apt-list-api.repository.js`를 `AptListService3/getSigunguAptList3`(JSON, sigunguCode 5자리) + `AptBasisInfoServiceV4/getAphusBassInfoV4`(JSON, kaptCode별 세대수 `kaptdaCnt`) 2단 구조로 교체, `apt-list.service.js`를 JSON 파서(`parseAptListJson`/`parseAptBasisInfoJson`)와 `fetchHouseholdCount`로 재작성, 수집기는 매칭된 단지만 kaptCode별 기본정보를 조회(실행 내 Map 캐싱)해 세대수를 채우도록 수정. 재수집 결과 3,300건 중 세대수 2,099건 확보, **live-search 노출 536건**(500세대 이상+7~15억, 13개 지역 전체에서 노출 확인 — 강동 34/성남 수정 34·중원 51·분당 3/수지 142/위례 송파 7·하남 16 등). 백엔드 33개 스위트·304개 테스트 전부 통과, 서버 기동 후 live-search 536건 응답 스모크 확인 |
| v0.30 | 2026-08-17 | **대상 지역 조정(도메인 v0.18 반영)**: `target-regions.js`에서 평택(41220)·화성 만세구(41591)·효행구(41593) 제거, 수원시 영통구(41117) 추가 — 11개 항목(화성은 병점·동탄구만). 제외 지역 캐시 데이터 삭제 후 재수집: 11개 지역 2,871건, 노출 대상(500세대+7~15억) 619건(영통 97건). 브라우저(chrome-devtools) 기반 사용자 시나리오 테스트 수행: F1(등록/실시간 탐색·0건 아님·셔틀 정보 없음 표시), 실시간 카드 619건 렌더링·선택 승격→상세 이동, F4(규제/대출)·F5(입지, 유흥시설 실시간 조회)·F6(대출 시뮬레이션 단독/부부합산·추천)·F7(승격 단지의 국토부 실거래 이력 fetch-through·그래프), F2(단지 즐겨찾기 추가/목록)·F3(비교셋 생성→비교 표) 전부 통과, 콘솔 에러 0건. 시나리오 테스트 중 발견한 결함 1건 수정: live-search 응답의 `transactionDate`가 pg DATE→Date 객체의 UTC ISO 직렬화로 "2026-06-29T15:00:00.000Z"처럼 노출되고 KST 기준 하루 밀리던 문제 — `mapCacheRow`에 로컬 getter 기반 YYYY-MM-DD 변환(`formatLocalDate`) 추가(BE-7과 동일 계열 이슈). 백엔드 33개 스위트·305개, 프론트엔드 56개 파일·245개 테스트 전부 통과 |
| v0.31 | 2026-08-17 | **매물 상세 탭 확장 4건 수행 완료(도메인 v0.19, ERD v0.9 반영)**: ① 대상 지역에서 용인 기흥구 제외(수지구만 유지, 캐시 삭제) — 10개 지역, live-search 노출 619건(기흥분 제외 후 재확인). ② 전세가 변동 이력: `fetchAptRentXml`(RTMSDataSvcAptRent, 활용신청 승인 실측 확인)·`jeonse-history.service.js`(순수 전세 필터, 월평균 전세가율)·`GET /api/listings/:id/jeonse-history` 신설, FE `JeonseHistoryTab`(매매/전세 2색 라인 + 전세가율 이중 축(좌: 금액, 우: %), dataviz 팔레트 검증기 라이트/다크 통과, 범례+전세 테이블). 구현 중 공공데이터포털 초당 요청 제한을 실측(72회 동시 호출 시 초과 에러)해 `settleInBatches`(20건/500ms)로 스로틀하고 매매/전세를 순차 조회하도록 수정 — 실데이터 검증(매매 264·전세 443건, 전세가율 34개월). ③ 매매가 변동 이력 탭: y축 거래가 눈금 4단계 추가, 테이블 거래일자 내림차순 정렬, 같은 날짜 다건 거래의 React key 중복 경고 수정. ④ 배정학교 탭: `elementary_schools.school_level` 마이그레이션(housing+housing_test), 시드 스크립트 초·중학교 확장, `GET /api/listings/:id/assigned-schools`(3km 최근접, 학구도 근사 안내), FE `SchoolsTab`. 학교위치 API 미승인이라 현재 "정보 없음" 표시(승인 후 시드 필요). ⑤ 학업성취도 조사(서브에이전트): 2017년 표집평가 전환 후 학교별 비공개로 표기 불가 — 대안은 학교알리미 공시 지표(도메인 v0.19 참조), 사용자 결정 대기. `.claude/agents/datago-api-prober.md`(공공데이터포털 API 실측 검증 전문 서브에이전트) 신설. 검증: 백엔드 34개 스위트·319개+, 프론트 60개 파일·259개 테스트 통과, 브라우저에서 6개 탭 전부 실데이터/폴백 렌더링·콘솔 에러 0건 확인 |
| v0.32 | 2026-08-17 | **전세가 변동 이력 탭 데이터 누락 결함 수정(사용자 신고)**: v0.31에서 채택한 배치(20건/500ms) 스로틀링이 여전히 공공데이터포털 초당 요청 제한에 걸려(실측: 배치 내 20건 동시 호출은 물론 수 초 간격의 단발 호출 2건도 종종 실패) 매매 이력(`saleEntries`)이 통째로 빈 배열로 누락되고, 이로 인해 전세가율(`ratioEntries`, 매매·전세 양쪽 데이터가 있는 월만 계산)도 함께 비어 그래프에 매매가 라인·전세가율 라인이 표시되지 않는 결함을 재현·수정. `settleInBatches` 기본값을 완전 순차 실행(배치 크기 1)+300ms 간격으로 변경해 재발을 방지(테스트 환경은 `NODE_ENV=test`에서 지연을 0으로 처리해 실행 시간 영향 없음). 격리된 재현으로 매매 264건·전세가율 34개월 정상 확인(단, 응답 시간이 배치 방식 대비 느려짐 — sale+jeonse 순차 72회 호출로 탭 최초 로딩에 최대 약 40초 소요, 트레이드오프로 기록). 함께 신고된 "매매가 변동 이력 테이블이 날짜 내림차순이 아니다"는 재현 시도 결과 코드(`b.transactionDate.localeCompare(a.transactionDate)`)와 실제 렌더링(2026-07-03→2023-09-08 순서) 모두 정상이었음 — 이전 수정이 반영되기 전 브라우저 캐시를 보고 있었을 가능성이 높음(하드 리프레시로 해소). 백엔드 34개 스위트·319개 테스트 전부 통과 |

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
- [x] `npm start` 실행 시 서버가 환경변수 `PORT`로 정상 기동한다. *(`curl localhost:3000/health` → 200 확인, 로그 `[INFO] 서버가 포트 3000에서 기동되었습니다`)*
- [x] `db/pool.js`는 환경변수만으로 `pg.Pool`을 생성하며 자격증명 하드코딩이 없다. *(`connectionString: env.postgresConnectionString`만 사용. 실제 `housing` DB에 대해 `SELECT COUNT(*) FROM user_profiles` 쿼리로 연결 확인)*
- [x] `config/env.js`가 필수 환경변수 누락 시 앱 기동을 실패시키고 `[ERROR]` 접두사로 원인을 출력한다. *(단위 테스트 3케이스로 검증. 구현 중 발견된 결함 수정: `process.exit`이 mocking/비동기 등으로 실제로 프로세스를 멈추지 못하는 상황에서도 후속 코드가 실행되지 않도록 `if/else` 분기로 방어)*
- [x] 404/500 모두 `error-handler.js`를 거쳐 일관된 JSON 에러 포맷으로 응답한다. *(둘 다 `{ message: string }` 포맷, 500은 스택트레이스 미노출)*
- [x] CORS는 와일드카드 없이 환경변수 지정 origin만 허용한다. *(`CORS_ORIGIN` 목록 기반 화이트리스트, `origin: '*'` 미사용. 허용/비허용 origin 각각 curl로 확인)*
- [x] 로깅은 `console.log/error/warn` + `[INFO]/[ERROR]/[WARN]` 접두사만 사용한다(외부 로깅 라이브러리 없음). *(winston/pino 등 미설치, 코드 전수 확인)*
- [x] `.env`가 `.gitignore`에 포함되고 `.env.example`은 값 없이 키만 담는다. *(`PORT`/`CORS_ORIGIN` 키 추가 반영)*
- [x] 인증/세션/JWT 미들웨어를 추가하지 않았음을 코드 리뷰로 확인한다. *(`grep -rniE "jwt|passport|session|authorization|bcrypt"` 결과 없음, `package.json`에도 관련 의존성 없음. 서브에이전트가 임의로 추가한 미사용 `nodemon` devDependency 및 `dev` 스크립트는 오버엔지니어링 금지 원칙에 따라 제거)*

**테스트**: `backend/tests/unit/{env,pool,cors,error-handler}.test.js` + `backend/tests/integration/app.test.js`, 총 17개 전부 통과, 라인 커버리지 100%(기준 80% 이상).

**의존성**: DB-3, DB-4 완료 필요(pool.js 연결 테스트를 위해 실제 스키마가 적용된 DB 필요).

**규모**: 중간

---

### BE-1. F1 매물 탐색 및 셔틀 통근 분석

**목적**: 매매가 7~15억 구간 매물 필터링 조회 및 셔틀 통근시간 정보 제공(셔틀·연식 등은 매물이 속한 단지 기준으로 join 조회).

**완료 조건**
- [x] `GET /api/listings?minPrice=&maxPrice=`가 매매가(만원) 범위를 필터링하며, 미지정 시 기본 70000~150000을 적용한다.
- [x] 지역/좌표 기반 필터를 최소 1가지 방식으로 지원한다(단지 좌표 기준). *(`minLat/maxLat/minLng/maxLng` 선택적 쿼리 파라미터, 4개 전부 지정 시에만 JOIN WHERE에 좌표 범위 조건 추가)*
- [x] 조건에 맞는 매물이 0건이면 200과 빈 배열을 반환한다.
- [x] 매물 조회 시 `listings`와 소속 `apartment_complexes`를 join하여, 응답에 매물 자체 정보(매매가, 전용면적)와 함께 소속 단지 정보(준공년도/연식, 리모델링 이력, 재건축 추진현황, 최근접 셔틀 정류장명, 거리(m), 셔틀 통근시간(분))가 포함된다.
- [x] 셔틀 정보가 DB에 null인 단지(도메인 v0.7 nullable 컬럼)에 속한 매물은 API 응답에서 해당 필드를 `null` 또는 `"정보 없음"` 문자열로 반환하고, 다른 필드·기능에는 영향을 주지 않는다(시나리오 1-3). *(null 값 그대로 유지 — swagger가 해당 필드를 `nullable: true` 정수/문자열로 정의해 타입 정합성을 위해 "정보 없음" 문자열 치환 대신 null 유지를 선택)*
- [x] `GET /api/listings/:id`로 단일 매물(+소속 단지 정보) 조회 가능, 존재하지 않는 id는 404.
- [x] repository 계층에만 SQL이 존재하며, `listings.repository.js`가 BE-8의 `apartment-complexes.repository.js`를 재사용하거나 join 쿼리를 통해 단지 정보를 함께 조회한다. *(join 쿼리 방식 채택. 단지 필드 camelCase 매핑은 BE-8의 `apartment-complexes.service.js`가 export하도록 확장한 `mapSummaryFields`를 재사용해 중복 로직 없음)*
- [x] `shuttle-commute.service.js` 및 관련 서비스 커버리지 80% 이상. *(셔틀 정보는 저장된 값을 그대로 노출하는 매핑만 필요해 별도 계산 서비스 파일을 만들지 않음 — 오버엔지니어링 금지 원칙에 따라 BE-8 `apartment-complexes.service.js`와 신규 `listings.service.js`가 "관련 서비스"에 해당, 두 파일 모두 라인 커버리지 100%)*

**테스트 중 직접 발견/수정한 결함(테스트 코드 자체 버그, 구현 결함 아님)**: ① 단위테스트가 `afterEach`에서 `jest.resetAllMocks()`를 사용해 `mapSummaryFields`의 실제 구현(mock)까지 지워버려 두 번째 테스트부터 `complex`가 `undefined`로 깨짐 → `jest.clearAllMocks()`로 수정. ② 통합테스트가 `minPrice=100000~maxPrice=150000` 조건에서 매물 1건(110000)만 기대했으나 실제로는 105000(평택)도 해당 범위에 포함되어 2건이 정상 — 테스트 조건을 `minPrice=106000`으로 수정해 의도한 케이스만 검증하도록 정정. 최종 56개 테스트 전부 통과(라인 커버리지 95.9%).

**의존성**: BE-0, DB-3(listings, apartment_complexes 테이블), DB-5(셔틀 정보 있음/없음 픽스처), BE-8(단지 조회 로직 재사용).

**규모**: 중간

---

### BE-2. F2 즐겨찾기 (단지/매물 이원화)

**목적**: 단지 즐겨찾기(`favorite_complexes`)와 매물 즐겨찾기(`favorite_listings`)를 각각 독립적으로 추가/해제(토글)하는 기능.

**완료 조건**
- [x] `POST /api/favorites/complexes {complexId}`로 추가 시 201과 등록 레코드를 반환한다.
- [x] `POST /api/favorites/listings {listingId}`로 추가 시 201과 등록 레코드를 반환한다.
- [x] 이미 즐겨찾기된 단지/매물에 재요청 시 각각 DB UNIQUE 위반(`(user_profile_id, complex_id)`, `(user_profile_id, listing_id)`)을 컨트롤러가 포착해 409로 응답하고 신규 행을 만들지 않는다(시나리오 2-2). *(`err.code==='23505'` 포착, `SELECT COUNT(*)`로 신규 행 미생성 확인)*
- [x] `DELETE /api/favorites/complexes/:complexId`, `DELETE /api/favorites/listings/:listingId`로 각각 해제 시 200을 반환한다.
- [x] `GET /api/favorites/complexes`로 사용자(고정 id=1)의 단지 즐겨찾기 목록(단지 상세 join 포함)을, `GET /api/favorites/listings`로 매물 즐겨찾기 목록(매물+소속 단지 join 포함)을 각각 조회한다. *(BE-8 `mapSummaryFields` 재사용, 중복 로직 없음)*
- [x] 단지 즐겨찾기와 매물 즐겨찾기는 완전히 독립된 목록으로 동작하며 서로의 추가/해제에 영향을 주지 않는다.
- [x] 인증/세션 로직 없이 user_profile_id=1 고정값만 사용한다.
- [x] 통합 테스트 및 커버리지 80% 이상.

**의존성**: BE-0, DB-3(favorite_complexes, favorite_listings, user_profiles), DB-4(시드). BE-1(listings repository), BE-8(apartment-complexes repository, join 조회 재사용) 완료 시 더 수월하나 필수는 아님.

**규모**: 작음~중간

---

### BE-3. F3 비교셋 생성 및 비교 (단지 비교 / 매물 비교 분기)

**목적**: 비교 대상 유형(`target_type`: complex/listing)에 따라 단지 2~5개 또는 매물 2~5개를 묶어 비교셋을 생성하고 다축 비교 데이터를 반환. 동일 단지/매물 중복 포함 방지 포함(v0.6 규칙). 단지 비교와 매물 비교를 한 비교셋에 혼합하지 않는다(도메인 §4.5).

**완료 조건**
- [x] `POST /api/comparison-sets {targetType, complexIds:[...] | listingIds:[...]}`로 생성 시 `targetType='complex'`이면 `complexIds`를, `'listing'`이면 `listingIds`를 사용해 `comparison_set_complexes` 또는 `comparison_set_listings`에만 행을 생성한다(target_type과 매핑 테이블 정합성은 서비스 레벨에서 검증, ERD v0.4 §2). *(`createSetWithMembers`가 트랜잭션(BEGIN/COMMIT/ROLLBACK)으로 셋 생성+멤버 삽입 원자적 처리)*
- [x] 대상 개수 2개 미만이면 400과 "비교하려면 2개 이상 선택해야 합니다".
- [x] 대상 개수 6개 이상 전달 시 400과 "비교셋은 최대 5개까지 선택할 수 있습니다".
- [x] `POST /api/comparison-sets/:id/complexes {complexId}` 또는 `POST /api/comparison-sets/:id/listings {listingId}`로 이미 포함된 대상을 다시 추가 시도하면 각각 DB UNIQUE(comparison_set_id, complex_id / listing_id) 위반을 포착해 409와 "중복입니다"를 반환하고 추가하지 않는다(시나리오 3-3). *(단지/매물 양쪽 경로 모두 통합테스트로 검증)*
- [x] `GET /api/comparison-sets/:id` 응답은 `target_type`에 따라 분기한다: **단지 비교**는 연식/리모델링 이력/재건축 추진현황/주변 재개발 정보/교통/상권/학군/강남접근성/유흥·공원/셔틀 통근시간/개발호재/주변일자리 + **단지 시세**(BE-8 집계 로직 재사용, 매물 0건 단지는 "매물 없음")를 단지별로 반환하고, **매물 비교**는 매물 자체 속성(매매가, 전용면적) + 소속 단지의 동일 축 정보를 매물별로 조합해 반환한다(도메인 §5.5, 시나리오 3-4, 3-5). *(`comparison.service.js`가 BE-8 `getComplexDetail`, BE-1 `getListingDetail` 재사용해 조합, 실제 픽스처로 동탄/평택/위례 3케이스 시세 검증)*
- [x] 동일 단지에 속한 매물끼리 매물 비교를 수행할 경우 단지 축 값(연식 등)이 모든 대상에서 동일하게 반환되며 이는 오류가 아니다(시나리오 3-5). *(동탄역 단지 매물 2건 비교로 실제 검증)*
- [x] `locality_attributes`에 없는 축은 `"정보 없음"`으로 반환한다(시나리오 3-1). *(BE-8 `mapLocalityAttributes` 재사용으로 자동 충족)*
- [x] `comparison-set.service.js`가 개수 검증과 target_type 분기를 순수 함수로 구현하고 2/5/6개 경계값 및 complex/listing 각 분기 단위 테스트가 있다.
- [x] 커버리지 80% 이상. *(전체 백엔드 94.5%, `comparison-set.service.js`/`comparison.service.js`/`comparison-sets.repository.js`/`comparison-sets.controller.js` 전부 76~100%)*

**의존성**: BE-0, DB-3(comparison_sets, comparison_set_complexes, comparison_set_listings), BE-8(단지 시세 집계 재사용). BE-1, BE-2 완료 시 통합 테스트 용이(필수는 아님).

**규모**: 큼

---

### BE-4-1. F4-1 규제 판단 서비스 (regulation.service.js)

**목적**: 도메인 §5.1(토허구역/규제지역 판단, 갭투자 가능 여부, 실거주 의무)을 순수 계산 로직으로 구현.

**완료 조건**
- [x] `is_land_transaction_permission_zone = true`이면 갭투자 불가, 실거주의무 기본 2년을 반환한다. *(24개월)*
- [x] `is_land_transaction_permission_zone = null`(미고시)이면 `"확인필요"` 플래그를 반환하고 규제 계산에는 영향을 주지 않는다.
- [x] `is_regulated_area = true`이고 다주택자이면 LTV 0%(신규 주담대 불가)와 6개월 이내 전입의무를 반환한다.
- [x] `갭투자 가능 여부 = NOT(토허구역) AND NOT(규제지역 내 주담대 실행)` 공식이 그대로 구현되어 있다.
- [x] 세대 주택 보유 구분 × 규제지역 여부 조합별 LTV(70/80/60/70/50/60/0/60%)가 §5.1.3 표와 정확히 일치하는 단위 테스트가 있다. *(`test.each` 8케이스 전부 통과)*
- [x] "배우자 1인 주거용 오피스텔 1채 보유"가 "1주택"으로 처리되고 "다주택"으로 오분류되지 않는 테스트가 있다. *(1주택 LTV 50/60 vs 다주택 LTV 0/60이 표 기반 테스트로 명확히 구분됨)*
- [x] 단위 테스트 커버리지 80% 이상(DB 접근 없음). *(라인 커버리지 100%)*

**의존성**: BE-0. BE-1/BE-8의 매물이 속한 단지(apartment_complexes)의 규제지역/토허구역 필드 구조와 정합 확인 필요(규제 정보는 매물이 아닌 소속 단지 컬럼에서 조회함, 도메인 §4.1).

**규모**: 중간

---

### BE-4-2. F4-2 원리금균등상환(PMT) 계산 서비스 (repayment.service.js)

**목적**: 도메인 §5.3 PMT 계산을 순수 함수로 구현(BE-4-3, BE-6-2가 공통 재사용).

**완료 조건**
- [x] PMT = P × r × (1+r)^n / ((1+r)^n − 1) 공식이 정확히 구현되고, 10/20/30년 알려진 계산값과 일치하는 테스트가 있다.
- [x] 대출원금 0일 때 상환액 0을 반환(0 나눗셈 등 경계 오류 없음). *(연이율 0 케이스도 별도 방어)*
- [x] DSR 역산(연간 허용 상환액 → 대출원금)이 PMT의 역함수로 구현되고, 왕복 계산 검증 테스트가 있다. *(`toBeCloseTo`로 왕복 복원 검증)*
- [x] 연 금리는 하드코딩하지 않고 인자/설정값으로 주입 가능하다.
- [x] 단위 테스트 커버리지 80% 이상. *(라인 커버리지 100%)*

**의존성**: BE-0. 다른 서비스와 독립적으로 병행 개발 가능.

**규모**: 작음~중간

---

### BE-4-3. F4-3 최대 대출가능금액 산출 서비스 + F4 통합 API

**목적**: 도메인 §5.2(LTV/DSR역산/지역한도 MIN)를 구현하고 F4 통합 API를 완성.

**완료 조건**
- [x] `최대 대출가능금액 = MIN(LTV상한액, DSR역산상한액, 지역별한도상한)` 공식이 정확히 구현되어 있다. *(신규 `loan-limit.service.js`, DSR 역산은 만기 30년/금리 4.0% 고정 가정 — 도메인 문서에 명시되지 않아 채택한 가정을 코드 주석에 명시)*
- [x] 규제지역 내 주담대는 소득/명의 무관 6억원 상한을 적용한다. *(`getRegionalLoanCapAmount` 재사용)*
- [x] `GET /api/listings/:id/regulation`이 매물이 속한 단지(apartment_complexes)의 규제 현황(BE-4-1), 최대 대출가능금액, 갭투자 가능 여부, 실거주 필수 기간을 하나의 응답으로 반환한다(규제/토허구역 정보는 매물이 아닌 소속 단지 컬럼에서 조회).
- [x] 평택 등 규제지역이 소속 단지 기준으로 미확정인 매물 조회 시 응답에 `"확인필요"` 플래그와 "비규제지역 LTV(하한값) 임시 적용" 안내가 포함된다(시나리오 4-2). *(평택 픽스처로 통합테스트 검증 — override 적용 시 ltvPercent가 비규제지역 값으로 산출됨을 확인)*
- [x] "내 정보" 미입력 상태(재무 컬럼 null)에서는 규제 현황은 정상 반환하되 대출가능금액 필드는 null 또는 "내 정보 입력 필요" 상태로 반환한다(F6과 경계 정합, 시나리오 6-2).
- [x] 단위 테스트 커버리지 80% 이상. *(180개 테스트 전부 통과, `loan-limit.service.js` 라인 커버리지 100%)*

**의존성**: BE-4-1, BE-4-2, BE-1(listings repository), BE-8(apartment-complexes repository, 매물이 속한 단지의 규제 정보 조회), BE-6-1(user-profile repository).

**규모**: 큼

---

### BE-5. F5 매물 상세 - 입지 정보

**목적**: F3과 동일한 입지 축을 단독 매물 기준으로 조회(입지/연식/리모델링/재건축/재개발 정보는 매물이 속한 단지 기준).

**완료 조건**
- [x] `GET /api/listings/:id/locality`가 매물이 속한 단지(apartment_complexes)의 교통/상권/학군/강남접근성/유흥·공원/개발호재/주변일자리와 연식/리모델링 이력/재건축 추진현황/주변 재개발 정보를 반환한다. *(동탄/평택 픽스처로 실제 통합테스트 검증)*
- [x] `locality_attributes`에 없는 축은 `"정보 없음"`으로 채워 반환하고 500 에러가 없다(시나리오 5-2). *(BE-8 `mapLocalityAttributes` 재사용으로 자동 보장)*
- [x] 존재하지 않는 매물 id 조회 시 404.
- [x] BE-3, BE-8의 축 포맷 로직과 공통 함수를 공유해 중복 구현을 피한다. *(신규 리포지토리/SQL 없이 `listingsService.getListingDetail` + `apartmentComplexesService.getComplexDetail` 조합만으로 구현)*
- [x] 테스트 커버리지 80% 이상. *(전체 142개 테스트 통과, `listings.service.js`/`apartment-complexes.service.js` 라인 커버리지 100%)*

**의존성**: BE-1(listings repository), BE-8(apartment-complexes repository, 소속 단지 정보 조회). BE-3과 공유 유틸 설계 조율 권장(선후 무관, 병행 가능).

**규모**: 작음

---

### BE-6-1. F6-1 사용자 프로필(내 정보) API

**목적**: 단일 사용자 프로필(고정 id=1) 조회/수정 API.

**완료 조건**
- [x] `GET /api/user-profile`은 항상 id=1을 반환하며, 미입력 상태(재무 컬럼 null)에서도 200과 null 필드가 포함된 객체를 반환한다.
- [x] `PUT /api/user-profile`로 명의구성/연소득/성과금/자본금/세대주택보유구분/생애최초여부/근무지 수정 시 즉시 반영되고 갱신 값을 응답한다. *(patch되지 않은 필드는 기존 값과 병합)*
- [x] `housing_ownership_tier`가 "무주택"이 아닌데 `is_first_time_buyer=true` 요청 시 400을 반환한다(DB CHECK와 별개로 서비스 레벨 선제 검증).
- [x] `workplace`는 "화성"/"평택"/null만 허용, 그 외 값은 400.
- [x] 인증/세션 없이 고정 id=1만 사용한다.
- [x] 통합 테스트 커버리지 80% 이상. *(라인 커버리지 100%)*

**의존성**: BE-0, DB-3(user_profiles), DB-4(시드).

**규모**: 작음

---

### BE-6-2. F6-2 대출 시뮬레이션 비교 서비스 + API

**목적**: 도메인 §5.4(부부합산 vs 단독명의 비교)를 구현. 정책모기지(디딤돌 등)는 계산 범위에서 제외.

**완료 조건**
- [x] 두 시나리오 모두 §5.1.3 "1주택" LTV를 적용하고 생애최초 특례가 적용되지 않음을 강제한다. *(신규 `loan-scenario.service.js`가 tier 파라미터를 받지 않고 항상 '1주택'/isFirstTimeBuyer=false로 고정 — 구조적으로 보장)*
- [x] BE-4-3(loan-limit.service), BE-4-2(repayment.service)를 재사용해 시나리오별 최대 대출가능금액·10/20/30년 상환액을 산출한다(로직 재구현 금지).
- [x] 판단 절차 (a)자금조달가능 → (b)대출가능금액 최댓값 → (c)DSR실사용률 최솟값 → (d)동률 시 부부합산 우선 4단계가 §5.4 순서 그대로 구현되고, 시나리오 6-1 예시 패턴(부부합산 조달불가 → 단독명의 선택)이 단위 테스트로 재현된다.
- [x] `GET /api/listings/:id/loan-simulation` 호출 시 프로필 미입력 상태면 `{profileIncomplete: true}` 류 응답을 반환하고 예외를 던지지 않는다(시나리오 6-2).
- [x] 응답에 "디딤돌대출·보금자리론 등 정책모기지는 계산 범위 제외, 별도 채널 확인 필요" 고지가 포함된다.
- [x] "내 정보" 수정 후 동일 매물 재요청 시 최신 프로필 기준으로 재계산됨을 테스트로 확인한다(stale 캐시 없음). *(매 요청마다 `getProfile()` 재조회, 메모이제이션 없음을 단위테스트로 증명)*
- [x] 단위 테스트 커버리지 80% 이상. *(205개 테스트 전부 통과, `loan-scenario.service.js` 라인 커버리지 100%)*

**구현 중 채택한 가정(도메인 문서 미명시 사항)**: `user_profiles.annual_income`/`annual_bonus`는 개인 1인 소득으로 간주(스키마에 배우자 개별 소득 컬럼 없음). 부부합산 시나리오는 배우자가 동일 소득을 버는 것으로 가정해 DSR 소득 기준을 2배로 산정하고, `available_capital`(세대 전체 가용 자본)은 두 시나리오에 동일하게(이중 계산 없이) 적용한다.

**의존성**: BE-4-2, BE-4-3, BE-6-1, BE-1.

**규모**: 큼

---

### BE-7. F7 매물 상세 - 20년 매매가 변동 이력

**목적**: 국토교통부 실거래가 이력을 20년/최초거래이후/이력없음 3가지로 분기 제공. 실거래 이력은 매물이 아닌 매물이 속한 단지(apartment_complexes) 단위로 관리되므로(`price_history.complex_id`), 매물 id로 요청받아 소속 단지 id로 변환 후 조회한다.

**완료 조건**
- [x] `GET /api/listings/:id/price-history`는 매물 id → 소속 단지 id(`listings.complex_id`)로 변환해 `price_history`를 `complex_id` 기준으로 조회하며, 20년 이상 데이터 보유 시 최근 20년치만 반환한다. *(단지 `completion_year` 기준 경과연수로 판정 — 동탄 픽스처(준공 1998)로 실제 통합테스트 검증)*
- [x] 20년 미만이면 전체 데이터를 반환하고, 최초거래 시점(`YYYY-MM`)과 `"최초거래 이후"` 라벨을 포함한다(시나리오 7-2). *(평택 픽스처(준공 2021)로 검증)*
- [x] 실거래 데이터 0건이면 200과 빈 배열, `"실거래 이력 없음"` 플래그를 반환한다(시나리오 7-3). *(위례 단지는 매물이 없어 통합테스트로는 검증 불가 — 순수함수 단위테스트로 커버)*
- [x] 각 레코드에 거래일자, 거래금액, 고정 출처 "국토교통부 아파트 실거래가 공개시스템(오픈API)"가 포함된다.
- [x] `lookup_period_type` 값이 실제 반환 데이터 범위와 일치하는 단위 테스트가 있다(`price-history.service.test.js`, `now` 주입으로 실제 시계에 비의존).
- [x] 동일 단지에 속한 서로 다른 매물 id로 조회해도 동일한 실거래 이력(단지 기준)이 반환됨을 확인하는 테스트가 있다(단지-매물 1:N 구조 반영).
- [x] 테스트 커버리지 80% 이상. *(158개 테스트 전부 통과, `price-history.service.js`/`listings.service.js` 라인 커버리지 100%)*

**구현 중 직접 발견/수정한 결함**: `pg`가 `DATE` 컬럼을 로컬 자정 기준 `Date` 객체로 파싱하는데, `price-history.service.js`가 이를 `getUTC*` getter로 읽어 UTC+9(한국 표준시) 환경에서 날짜가 하루 앞으로 밀리는 버그 발견(`2006-08-01` → `2006-07-31`). `formatDateOnly`/`formatYearMonth`를 로컬 getter(`getFullYear`/`getMonth`/`getDate`)로 수정해 해결.

**의존성**: BE-0, DB-3(price_history, listings, apartment_complexes), BE-1(listings.complex_id 조회), DB-5(20년 이상/미만/0건 3케이스 픽스처).

**규모**: 중간

---

### BE-8. 아파트 단지 조회 및 단지 시세 집계 서비스

**목적**: 도메인 §4.1(단지 기본정보)·§5.5(단지 시세 산출 규칙)에 따라 단지 상세 조회와 "단지 시세"(해당 단지에 속한 매물들의 매매가 조회 시점 집계, 비영속 계산값) 서비스를 구현한다. 이 서비스는 BE-1(매물 조회 join), BE-2(단지 즐겨찾기), BE-3(단지 비교), BE-4-1/BE-4-3(단지 규제 정보), BE-5(단지 입지 정보)가 공통으로 재사용한다.

**완료 조건**
- [x] `apartment-complexes.repository.js`가 `apartment_complexes` 테이블에 대한 조회 SQL(단건/목록/좌표 범위)을 전담하며, 다른 계층에는 SQL이 없다. *(`findAll`/`findById`/`findWithinBoundingBox` 구현. 좌표 범위 조회는 BE-1 재사용을 위해 repository에만 준비, 이번 태스크에서 API로는 미노출)*
- [x] `GET /api/complexes/:id`로 단지 상세(단지명, 위치, 준공년도, 리모델링 이력, 재건축 추진현황, 주변 재개발 정보, 규제지역/토허구역 여부, 셔틀 정보, 입지 속성)를 조회할 수 있고, 존재하지 않는 id는 404를 반환한다. *(`housing_test` 픽스처로 실제 curl 검증)*
- [x] `apartment-complex-price.service.js`(가칭)가 특정 단지 id에 속한 `listings.sale_price`를 MIN/MAX(필요 시 AVG)로 집계해 "단지 시세"를 계산하며, 이 값을 별도 테이블/컬럼에 저장하지 않고 매 요청마다 조회 시점에 계산한다(오버엔지니어링 금지, ERD v0.4 §1.2). *(avgPrice는 SQL에서 `ROUND(AVG(...))::int`로 반올림)*
- [x] **매물이 0건인 단지는 시세를 "매물 없음"으로 반환한다**(빈 배열 집계 시 예외를 던지지 않고 명시적 상태값으로 처리, DB-5 매물 0건 단지 픽스처로 검증). *(위례신도시 롯데캐슬(매물 0건)로 실제 확인: `priceRange: "매물 없음"`)*
- [x] `GET /api/complexes/:id`(단지 상세 응답에 시세 포함) 형태로 단지 시세를 조회할 수 있다.
- [x] 토허구역 여부가 `null`(미고시)인 단지는 응답에 `"확인필요"` 플래그를 포함하고 다른 필드에는 영향을 주지 않는다. *(평택 소사벌 한라비발디로 확인: `isLandTransactionPermissionZone: "확인필요"`)*
- [x] 셔틀 정보가 null인 단지는 해당 필드를 `null` 또는 `"정보 없음"`으로 반환한다. *(셔틀 3필드 모두 null 유지, "정보 없음" 문자열로 치환하지 않음 — swagger `nullable: true` 정수 필드와의 타입 정합성 유지)*
- [x] 단위/통합 테스트 커버리지 80% 이상(매물 0건/1건/다건 단지 3케이스 포함). *(단위 9개 + 통합 1개 파일, 37개 테스트 전부 통과, 라인 커버리지 96%)*

**구현 중 직접 발견/수정한 결함**: PostgreSQL `numeric` 컬럼(`latitude`/`longitude`)이 `pg` 기본 동작상 JSON 응답에서 문자열로 반환되어 swagger 스펙(`type: number`)과 불일치 — `db/pool.js`에 `pg.types.setTypeParser(NUMERIC, parseFloat)`를 추가해 전역적으로 숫자 타입으로 반환되도록 수정(향후 모든 numeric 컬럼에 공통 적용).

**의존성**: BE-0, DB-3(apartment_complexes, listings 테이블).

**규모**: 중간

---

## 4. 프론트엔드 트랙

### FE-1. 공통 인프라 및 전역 Provider 설정

**목적**: F1~F7 전체가 의존하는 기반 레이어 구축.

**완료 조건**
- [x] `QueryClientProvider`가 앱 루트에 장착되어 하위 컴포넌트에서 `useQuery` 정상 동작.
- [x] `shared/api/client.ts` 외 위치에서 fetch 직접 호출이 없다.
- [x] `shared/api/client.ts`의 API 서버 base URL이 하드코딩되지 않고 `import.meta.env.VITE_API_BASE_URL`로만 주입된다(4-project-principle.md §5).
- [x] `frontend/.env.example`에 `VITE_API_BASE_URL` 키가 값 없이 존재하고, `frontend/.env`(로컬 전용)에는 백엔드 BE-0의 `PORT`(기본 3000)와 일치하는 `http://localhost:3000` 실값이 채워져 있으며 `.gitignore`에 포함되어 커밋되지 않는다.
- [x] 프론트엔드 개발 서버 origin(Vite 기본 `http://localhost:5173`)이 백엔드 `.env`의 `CORS_ORIGIN`과 일치해 실제 API 호출 시 CORS 오류가 없다.
- [x] `Modal` 컴포넌트가 "중복입니다"(FE-5), "비교셋 최대 5개"(FE-5) 등에 재사용 가능한 범용 API(열림/닫힘/제목/본문/확인버튼)를 제공한다.
- [x] `Badge` 컴포넌트가 "확인필요"(FE-7) variant를 지원한다.
- [x] 라우터에 5개 화면(지도/목록, 매물 상세, 즐겨찾기, 비교셋, 내 정보) 경로가 등록되어 있다.
- [x] `tsc --noEmit`, ESLint 통과.
- [x] 공용 컴포넌트 테스트 커버리지 80% 이상. *(vitest, Modal/Badge 9개 테스트 전부 통과, 라인 커버리지 100%. 구현 중 발견한 설정 공백: `vitest.config.ts`에 `test.globals: true`가 누락되어 `@testing-library/jest-dom` setup이 전역 `expect` 없이 실패하던 문제를 직접 수정)*

**의존성**: 없음(최우선 선행). 단, `VITE_API_BASE_URL` 기본값(`http://localhost:3000`)과 CORS 연동 검증을 위해 BE-0이 먼저 완료되어 있으면 수월(필수는 아님 — mock 기반 개발 가능).

**규모**: 중간

---

### FE-2. 지도 연동 (네이버지도, 제약 시 구글맵 대체)

**목적**: F1 매물 탐색 화면용 지도 렌더링 컴포넌트를 독립적으로 구축.

**완료 조건**
- [x] `MapView`는 `listings` 좌표 배열 props만 받아 마커를 렌더링하며, 호출부는 SDK 종류(네이버/구글)를 알지 못한다(어댑터 격리). *(`MapAdapter` 인터페이스 + `NaverMapAdapter` 구현으로 분리)*
- [x] 네이버지도 SDK 사용 시 확대/축소, 마커 클릭 콜백이 정상 동작한다. *(SDK 네이티브 줌 컨트롤 사용, 마커 클릭 → `onMarkerClick` 콜백 연결을 mocking 테스트로 검증)*
- [x] API 키는 환경변수로만 주입되며 하드코딩되지 않는다. *(`VITE_NAVER_MAP_CLIENT_ID`, 실제 발급된 키는 아직 없음 — 4-project-principle.md §5에 발급 절차 문서화)*
- [x] SDK 로드 실패 시 앱 크래시 없이 안내 문구를 표시한다. *(키 미설정 상태에서 실제로 이 경로가 동작 중임을 확인 — "지도를 불러올 수 없습니다" 폴백)*
- [x] 관련 훅/유틸 테스트 커버리지 80% 이상(SDK는 mocking). *(46개 테스트 전부 통과, `shared/map` 라인 커버리지 100%)*

**의존성**: FE-1.

**규모**: 중간

---

### FE-3. F1 매물 탐색 및 셔틀 통근 분석

**목적**: 매매가 7~15억 구간 매물을 지도/목록에 노출하고, 매물이 속한 단지의 셔틀 통근시간·연식 등을 함께 표시.

**완료 조건**
- [x] "7억~15억" 필터 조회 시 매물 카드/지도 핀이 정상 표시된다(시나리오 1-1). *(계획 단계에서 BE-1 응답에 단지 좌표가 없던 결함을 발견해 백엔드 수정 — v0.17 참조)*
- [x] 조건에 맞는 매물 0건 시 "조건에 맞는 매물이 0건입니다"가 표시되고 필터 조정 UI는 계속 사용 가능하다(시나리오 1-2).
- [x] 셔틀 정보가 소속 단지 기준으로 미확보된 매물은 통근시간 항목에 "정보 없음"이 표시되고 다른 기능 이용은 차단되지 않는다(시나리오 1-3).
- [x] 매물 카드에 매물 자체 정보(매매가, 전용면적)와 함께 소속 단지의 최근접 셔틀 정류장명·거리·통근시간·연식이 함께 노출된다(BE-1 응답의 단지 join 데이터 사용).
- [x] 컴포넌트/훅 테스트 커버리지 80% 이상(0건/정보없음 케이스 포함). *(zustand 대신 컴포넌트 로컬 useState 채택 — 필터 상태가 단일 화면에서만 쓰여 오버엔지니어링 방지)*

**의존성**: FE-1, FE-2. **백엔드: BE-1 완료 필요.**

**규모**: 큼

---

### FE-4. F2 즐겨찾기 (단지 즐겨찾기 탭 / 매물 즐겨찾기 탭)

**목적**: 단지 즐겨찾기와 매물 즐겨찾기를 각각 독립된 탭으로 제공하고, 각 탭 내에서 추가·해제 토글을 제공.

**완료 조건**
- [x] 즐겨찾기 화면이 "단지 즐겨찾기" 탭과 "매물 즐겨찾기" 탭 2개로 구성되고, 각 탭은 독립적으로 목록을 조회·표시한다.
- [x] 매물 카드/단지 카드의 하트 아이콘 탭 시 활성 전환되고 해당 유형(단지 또는 매물)의 즐겨찾기 목록에 즉시 반영된다(시나리오 2-1). *(이 화면에 보이는 항목은 이미 즐겨찾기된 상태이므로 하트 탭 = 해제만 구현 — 검색 화면(FE-3)에 추가 토글을 연동하는 것은 완료조건 문구·의존성 목록에 없어 범위 밖으로 판단)*
- [x] 이미 즐겨찾기된 단지/매물 재탭 시 토글 OFF(해제)되며 신규 항목이 추가되지 않는다(시나리오 2-2). *(즉시 목록에서 제거되고 쿼리 무효화로 재조회됨을 테스트로 검증)*
- [x] 각 탭(단지/매물)에 체크박스 선택 UI가 제공되어 FE-5(비교셋)에 대응하는 비교 유형(단지 비교/매물 비교)으로 선택 결과를 전달할 수 있다. *(zustand `favoritesSelectionStore` — 설계문서 §6이 명시한 정확한 사용 사례라 신규 설치, 탭 전환 간에도 선택 상태 유지)*
- [x] 컴포넌트/훅 테스트 커버리지 80% 이상(단지 탭/매물 탭 각각). *(38개 테스트 전부 통과, 라인 커버리지 100%)*

**의존성**: FE-1, FE-3(ListingCard 재사용). **백엔드: BE-2, BE-8 완료 필요.**

**규모**: 작음~중간

---

### FE-5. F3 비교셋 생성 및 비교 (단지 비교 / 매물 비교)

**목적**: 비교 대상 유형(단지 비교/매물 비교) 선택 UI를 제공하고, 선택한 유형의 즐겨찾기 중 2~5개를 골라 다축 비교 화면을 구성한다. 동일 단지/매물 중복 추가 방지 포함.

**완료 조건**
- [x] "비교하기" 진입 시 비교 대상 유형(단지 비교/매물 비교)을 먼저 선택하는 UI가 제공되고, 선택한 유형에 해당하는 즐겨찾기 탭(FE-4)에서 2~5개를 선택한다. *("비교하기" 버튼을 FE-4의 각 즐겨찾기 탭에 추가 — 탭 자체가 유형 선택 역할을 겸함)*
- [x] **단지 비교** 선택 시: 서로 다른 단지 2~5개가 나란히 배치되고, 연식/리모델링 이력/재건축 추진현황/주변 재개발 정보/교통/상권/학군/강남접근성/유흥·공원/셔틀 통근시간/개발호재/주변일자리/**단지 시세**(매물 0건 시 "매물 없음") 축이 표로 비교된다(시나리오 3-4).
- [x] **매물 비교** 선택 시: 매물 2~5개(서로 다른 단지끼리든 동일 단지 내 매물끼리든 모두 가능)가 나란히 배치되고, 매물 자체 속성(매매가/전용면적)과 소속 단지의 위 축들이 조합되어 표시된다. 동일 단지 내 매물끼리 비교하는 경우 단지 축 값이 모든 대상에서 동일하게 표시되며 이는 정상 동작이다(시나리오 3-5). *(백엔드가 이미 단지 단위로 축 값을 채워 반환하므로 프론트는 그대로 렌더링 — 단위테스트로 동일 단지 축 값 일치 확인)*
- [x] 데이터 미확보 항목은 "정보 없음"으로 표시된다(시나리오 3-1).
- [x] 6번째 선택 시도 시 선택이 막히고 "비교셋은 최대 5개까지 선택할 수 있습니다"(시나리오 3-2 Case 1).
- [x] 1개만 선택 후 "비교하기" 시 진입이 막히고 "비교하려면 2개 이상 선택해야 합니다"(시나리오 3-2 Case 2).
- [x] 이미 포함된 단지/매물 재추가 시도 시 "중복입니다" 팝업이 뜨고 추가되지 않으며 기존 상태가 유지된다(시나리오 3-3). *(비교셋 상세 화면에 즐겨찾기 중 미포함 항목을 추가하는 선택 UI 구현, 409 응답을 `Modal`로 표시 — 구현 중 `shared/api/client.ts`가 에러 응답 바디를 JSON 파싱하지 않고 원문 텍스트만 사용하던 공백을 발견해 `.message` 필드를 파싱하도록 수정)*
- [x] 컴포넌트/훅 테스트 커버리지 80% 이상(단지 비교/매물 비교/동일 단지 매물 비교/5개 초과/1개 이하/중복 추가 케이스 포함). *(전체 197개 테스트 통과, 라인 커버리지 96.94%)*

**의존성**: FE-1, FE-4. **백엔드: BE-3, BE-8 완료 필요.**

**규모**: 큼

---

### FE-6. 매물 상세 공통 셸

**목적**: F4·F5·F6·F7이 탭으로 공존하는 매물 상세 화면의 공통 골격 구축.

**완료 조건**
- [x] 매물 상세 진입 시 4개 탭(규제/대출, 입지 정보, 대출 시뮬레이션, 매매가 변동 이력)이 표시되고, 각 탭은 독립적으로 로딩/에러 상태를 가진다(한 탭 실패가 다른 탭을 막지 않음 — 시나리오 6-2, 7-3 반영). *(탭 패널을 모두 동시 마운트하고 `hidden` 속성으로 전환, 각 패널을 독립된 `TabErrorBoundary`로 감싸 구조적으로 격리 — 한 탭 강제 에러 상황에서도 나머지 탭 정상 동작함을 테스트로 검증)*
- [x] 각 탭 콘텐츠는 FE-7/FE-8/FE-9/FE-11이 구현하며, 이 Task는 탭 전환 골격과 공통 로딩/에러 처리만 담당한다. *(4개 탭 모두 1줄 placeholder 컴포넌트로 스텁 처리)*
- [x] 컴포넌트/훅 테스트 커버리지 80% 이상. *(30개 테스트 전부 통과, 신규 파일 라인 커버리지 90~100%)*

**의존성**: FE-1. **백엔드: BE-1(매물 기본 정보 조회), BE-8(소속 단지 정보 조회) 완료 필요.**

**규모**: 작음

---

### FE-7. F4 매물 상세 - 규제/대출 분석

**목적**: 매물이 속한 단지의 토지거래허가구역·규제지역 여부, 최대 대출가능금액, 갭투자 가능 여부, 실거주 필수 기간 표시.

**완료 조건**
- [x] 투기과열지구에 속한 매물 조회 시 (소속 단지 기준) 규제 현황, LTV 적용 결과 대출가능금액, "갭투자 불가"·"6개월 이내 전입 의무"가 표시된다(시나리오 4-1).
- [x] 소속 단지의 규제지역이 미확정인 매물(평택 등)은 "확인필요" 배지와 "임시 산출값" 안내 문구가 표시된다(시나리오 4-2). *(`Badge` needs-confirmation variant + 시나리오 4-2 안내 문구 그대로 표시)*
- [x] LTV/DSR 계산 로직을 프론트에서 재구현하지 않고 백엔드 응답을 그대로 표시한다. *(모든 수치는 API 필드 직접 렌더링, `toLocaleString()` 포맷팅만 적용)*
- [x] 컴포넌트/훅 테스트 커버리지 80% 이상. *(regulation 관련 파일 라인 커버리지 100%)*

**의존성**: FE-6. **백엔드: BE-4-3 완료 필요.**

**규모**: 중간

---

### FE-8. F5 매물 상세 - 입지 정보

**목적**: F3과 동일한 입지 축을 단독 매물 기준으로 표시(입지/연식/리모델링/재건축/재개발 정보는 소속 단지 데이터).

**완료 조건**
- [x] "입지 정보" 탭에서 소속 단지 기준 교통/상권/학군/강남 접근성/유흥·공원과 연식/리모델링 이력/재건축 추진현황/주변 재개발 정보가 단일 매물 기준으로 표시된다(시나리오 5-1).
- [x] 데이터 없는 단지에 속한 매물은 해당 항목이 "정보 없음"으로 표시되고 나머지는 정상 표시, 화면 전체가 오류 없이 렌더링된다(시나리오 5-2).
- [x] FE-5(비교셋)와 입지 축 표시 로직/컴포넌트를 가능한 재사용한다. *(FE-5가 아직 미착수라 이 Task가 먼저 `shared/components/LocalityAxisList.tsx`를 재사용 가능한 형태로 구축 — FE-5가 나중에 재사용)*
- [x] 컴포넌트/훅 테스트 커버리지 80% 이상. *(라인 커버리지 100%)*

**의존성**: FE-6. **백엔드: BE-5 완료 필요.**

**규모**: 작음

---

### FE-9. F7 매물 상세 - 20년 매매가 변동 이력

**목적**: 국토교통부 실거래가 오픈API 기반 매매가 변동 그래프/테이블 표시(실거래 이력은 매물이 아닌 소속 단지 단위 데이터).

**완료 조건**
- [x] 소속 단지 기준 20년 이상 데이터 보유 매물은 최근 20년 그래프와 거래 테이블이 출처와 함께 표시된다(시나리오 7-1).
- [x] 20년 미만 데이터는 전체 데이터만으로 표시되고 "최초거래(YYYY-MM) 이후 데이터" 안내가 노출된다(시나리오 7-2).
- [x] 소속 단지의 실거래 데이터가 0건인 매물은 "실거래 이력 없음"이 표시되고 다른 탭은 정상 이용 가능하다(시나리오 7-3).
- [x] 동일 단지에 속한 서로 다른 매물 상세를 열어도 동일한 매매가 변동 이력이 표시됨을 확인한다(단지 단위 데이터임을 반영). *(백엔드가 단지 단위로 집계하므로 프론트는 매물 id로 그대로 조회)*
- [x] dataviz 스킬 가이드에 따라 그래프가 라이트·다크 모드 모두에서 가독성 있게 구성된다. *(신규 의존성 없이 순수 SVG 라인 차트로 구현, dataviz 검증기로 라이트/다크 대비·명도 기준을 통과하는 `--color-chart-price-line` 토큰 추가)*
- [x] 컴포넌트/훅 테스트 커버리지 80% 이상(3가지 케이스 포함). *(라인 커버리지 100%)*

**의존성**: FE-6. **백엔드: BE-7 완료 필요.**

**규모**: 중간

---

### FE-10. "내 정보"(재무 프로필) 입력/수정 폼

**목적**: F6 입력값(명의구성/소득/성과금/자본금/세대주택보유구분)을 수집·저장·수정하는 폼. `user-profile/` feature가 단독 소유(4-project-principle.md §6 정정 반영).

**완료 조건**
- [x] 앱 최초 진입 시 명의구성/연소득/성과금(기본값 0)/자본금/세대주택보유구분/생애최초해당여부(무주택일 때만 활성화)를 입력받는 폼이 렌더링된다.
- [x] 저장 성공 시 단일 프로필로 영구 저장되며 "내 정보" 화면에서 재조회·수정 가능하다. *(동일 컴포넌트가 최초입력/재조회·수정 겸용)*
- [x] 수정 후 저장 시 관련 쿼리 캐시가 무효화되어 FE-11(대출 시뮬레이션)이 최신값 기준으로 재계산 트리거된다. *(`userProfileQueryKey`를 FE-11이 재사용할 공용 계약으로 export, `invalidateQueries` 호출을 테스트로 검증)*
- [x] "세대 주택 보유 구분"이 "무주택"이 아니면 생애최초 해당 여부가 자동 false 처리되거나 선택 불가 처리된다.
- [x] 컴포넌트/훅 테스트 커버리지 80% 이상. *(신규 코드 라인 커버리지 100%)*

**의존성**: FE-1. **백엔드: BE-6-1 완료 필요.**

**규모**: 중간

---

### FE-11. F6 매물 상세 - 대출 시뮬레이션 (결과 화면)

**목적**: 저장된 재무 프로필(FE-10) 기반으로 부부합산 vs 단독명의 시나리오를 매물별로 계산·비교.

**완료 조건**
- [x] "내 정보" 입력 상태에서 탭 진입 시 두 시나리오의 최대 대출가능금액·10/20/30년 상환액·필요 자기자본이 나란히 표시되고 유리한 시나리오가 안내된다(시나리오 6-1).
- [x] "내 정보" 미입력 상태에서는 계산 결과 대신 "내 정보를 입력해주세요" 문구와 "내 정보 입력하기" 버튼이 표시되고, 클릭 시 FE-10 화면으로 이동한다(시나리오 6-2).
- [x] "내 정보" 미입력 상태에서도 F4/F5/F7 탭은 정상 이용 가능하다(FE-6 셸의 독립 탭 로딩과 연동 확인).
- [x] 정책모기지 제외 안내 문구가 노출된다.
- [x] LTV/DSR/PMT 계산 로직을 프론트에서 재구현하지 않는다.
- [x] 컴포넌트/훅 테스트 커버리지 80% 이상(프로필 미입력/입력완료 2케이스 포함). *(라인 커버리지 100%. FE-10 수정 후 재계산 요구사항은 `refetchOnMount: 'always'`로 해결 — `/profile` 왕복 시 항상 최신 데이터 재조회, FE-10 코드 변경 불필요함을 분석으로 확인)*

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
