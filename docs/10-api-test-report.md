# housing 백엔드 API 테스트 보고서

- 작성일: 2026-07-10
- 대상: `backend`(Express, `housing` 로컬 개발 DB, `http://localhost:3000`)
- 근거 문서: [3-user-scenario.md](./3-user-scenario.md) (v0.5), [1-domain-definition.md](./1-domain-definition.md) (v0.8), [2-prd.md](./2-prd.md) (v0.6), `swagger/swagger.json`
- 방법: `docs/3-user-scenario.md`의 F1~F7 시나리오를 기반으로 `housing` DB에 테스트 픽스처(단지 6개, 매물 7개, 실거래이력 등)를 시딩하고, 실행 중인 백엔드에 curl로 실제 HTTP 요청을 보내 시나리오별 기대 동작을 검증. 테스트 종료 후 픽스처와 `user_profiles`는 원상복구함. 별도로 `npm test`(Jest, 단위+통합)도 전체 재실행해 회귀 여부 확인.

## 1. 결과 요약

| 구분 | 결과 |
|---|---|
| 시나리오 테스트(F1~F7, curl) | 전부 통과(발견된 결함은 아래 §2에서 수정 후 재검증 통과) |
| `npm test`(Jest 단위+통합) | 24 suites / 204 tests 전부 통과, 라인 커버리지 95.16% |
| 발견 후 수정한 실제 코드 결함 | 3건 (§2) |
| 시딩 과정의 테스트 데이터 실수(코드 결함 아님) | 1건 (§2.4) |
| `docs`와 실제 API/구현 간 불일치로 문서 갱신 | `swagger/swagger.json`, `docs/4-project-principle.md` (§3) |

## 2. 발견 및 수정한 결함

### 2.1 즐겨찾기/비교셋 추가 시 존재하지 않는 대상 → 500 (기대: 404)

- **증상**: `POST /api/favorites/complexes`에 존재하지 않는 `complexId`를 보내면 swagger 문서상 404가 기대되지만 실제로는 500 `서버 오류가 발생했습니다`가 반환됨. 동일 패턴이 `POST /api/favorites/listings`, `POST /api/comparison-sets/:id/complexes`, `POST /api/comparison-sets/:id/listings`에도 존재.
- **원인**: 각 repository의 INSERT가 Postgres FK 위반(`23503`)을 그대로 throw하는데, 컨트롤러는 UNIQUE 위반(`23505`)만 잡아 409로 변환하고 FK 위반은 처리하지 않아 전역 에러 핸들러가 500으로 응답.
- **수정**: `backend/src/middlewares/error-handler.js`의 `errorHandler`에서 `err.code === '23503'`인 경우 일괄적으로 404 `{"message": "존재하지 않는 리소스입니다"}`로 변환하도록 추가(단일 지점 수정으로 4개 엔드포인트 모두 해결, Clean 아키텍처 원칙에 따라 컨트롤러마다 중복 처리하지 않음).
- **재검증**: `POST /api/favorites/complexes {"complexId":9999}` → 404 확인. `POST /api/comparison-sets/9999/listings` → 404 확인.

### 2.2 규제/대출 정보 응답 내 필드 간 모순 (토지거래허가구역 "확인필요" 상태)

- **증상**: 소속 단지의 `is_land_transaction_permission_zone`이 `null`(확인필요)인 매물의 `GET /api/listings/:id/regulation`에서, `ltvPercent`/`maxLoanAmount`는 "임시로 비규제지역 취급"(PRD F4 인수조건)한 값인데, 같은 응답의 `gapInvestmentAllowed`/`occupancyRequirementMonths`/`regionalLoanCapAmount`는 원본 `isRegulatedArea`(규제지역 true)를 그대로 사용해 "6개월 실거주 의무", "갭투자 불가", "6억원 상한"을 동시에 표시 — 하나의 응답 안에서 비규제 임시 적용과 규제지역 제약이 동시에 나타나는 내적 모순.
- **원인**: `listings.service.js`의 `getListingRegulation`에서 `ltvPercent`/`maxLoanAmount` 계산에는 `effectiveIsRegulatedAreaForLoan`(확인필요 시 false로 강제)을 사용하면서, `isMortgageInRegulatedArea` 산출과 `regionalLoanCapAmount`에는 원본 `isRegulatedArea`를 사용하는 불일치.
- **수정**: 두 곳 모두 `effectiveIsRegulatedAreaForLoan`을 사용하도록 통일.
- **재검증**: `is_regulated_area=true` + `is_land_transaction_permission_zone=null` 조합에서 `ltvPercent:60, gapInvestmentAllowed:true, occupancyRequirementMonths:null, regionalLoanCapAmount:null`로 일관되게 "임시 비규제 취급" 반영됨을 확인.

### 2.3 매매가 변동 이력 조회 기간(`lookupPeriodType`)이 실거래 데이터가 아닌 단지 준공년도로 결정됨

- **증상**: 도메인 정의서 §3.7/§4.7은 "**단지의 실거래 데이터**가 20년 이상 존재하면 최근 20년만 노출"이라고 명시하나, 실제 코드는 `now - 준공년도 >= 20`이면 무조건 "최근 20년"으로 판정. 준공은 오래됐지만 실제 실거래 이력이 최근 5년치만 있는 단지(테스트로 구성)에서 `lookupPeriodType: "최근 20년"`, `firstTransactionMonth: null`이 반환되어 "최초거래 이후 데이터" 안내가 누락되는 오표시 확인.
- **원인**: `price-history.service.js`의 `buildPriceHistoryResult`가 `completionYear` 기반 나이로 분기.
- **수정**: 실제 `price_history` 최초거래일(`rows[0].transaction_date`, repository에서 이미 오름차순 정렬됨)이 20년 이상 지났는지로 분기하도록 변경. `completionYear` 파라미터와 호출부(`listings.service.js`)의 전달 제거.
- **테스트 보완**: `tests/unit/price-history.service.test.js`, `tests/unit/listings.service.test.js`가 옛 로직(준공년도 기준)을 정답으로 가정하고 있어 함께 수정. `tests/fixtures/fixtures.sql`의 동탄 단지 실거래 이력에 20년보다 확실히 이전인 앵커 row(2000-01-01)를 추가해 "최근 20년" 분기가 특정 실행 시점의 날짜 경계에 취약해지지 않도록 보완(`housing_test` DB에도 반영). `npm test` 204/204 통과 재확인.

### 2.4 (코드 결함 아님) 테스트 시딩 실수 — `locality_attributes` 키 형식

- 처음 테스트 픽스처에 `locality_attributes`를 영문 camelCase 키(`transportation` 등)로 넣었더니 입지 정보가 전부 "정보 없음"으로 나와 결함처럼 보였으나, 실제로는 `apartment-complexes.service.js`의 `LOCALITY_KEY_MAP`이 한글 키(`교통`, `상권` 등)를 기대하는 기존 설계였음(테스트 픽스처 `tests/fixtures/fixtures.sql`과 단위 테스트로 이미 검증된 동작). 픽스처를 한글 키로 정정해 재검증 통과. 코드 변경 없음.

## 3. 시나리오별 테스트 결과 (요약)

| 기능 | 시나리오 | 결과 |
|---|---|---|
| F1 매물 탐색 | 기본 필터(70000~150000) 전체 조회, 0건 조회, bbox(`minLat/maxLat/minLng/maxLng`) 필터, 셔틀 정보 없음 → `null` | 통과 |
| F2 즐겨찾기 | 단지/매물 추가, 중복 추가(409, 실제 메시지 확인), 해제(토글 OFF), 존재하지 않는 대상 추가(404, §2.1 수정 후) | 통과 |
| F3 비교셋 | 매물 비교/단지 비교/동일 단지 내 매물 비교 생성, 1개 이하(400), 6개 이상(400), 중복 멤버 추가(409), 존재하지 않는 비교셋/대상(404, §2.1 수정 후) | 통과 |
| F4 규제/대출 | 규제지역 LTV/한도, 확인필요(미확정) 지역 임시 비규제 적용(§2.2 수정 후 필드 일관성 확보), 프로필 미입력 시 `profileMessage` | 통과 |
| F5 입지 정보 | 전체 채워진 단지, 일부 누락(→"정보 없음") | 통과 |
| F6 대출 시뮬레이션 | 프로필 미입력(`profileIncomplete:true`), 프로필 입력 후 단독/부부합산 시나리오 산출, 자금 조달 불가로 `recommendedScenario:null`인 경우와 조달 가능 시 선정되는 경우 모두 확인 | 통과 |
| F7 매매가 이력 | 실제 20년 이상 데이터(§2.3 수정 후 정상), 7년 데이터(최초거래 이후), 이력 없음(0건) | 통과 |

## 4. `docs` ↔ 백엔드 API 정합성 점검 결과

### 4.1 `swagger/swagger.json` 갱신

- `GET /api/listings`가 실제로 지원하는 `minLat`/`maxLat`/`minLng`/`maxLng` bbox 쿼리 파라미터가 문서화되지 않아 추가.
- 즐겨찾기 중복 추가(409) 응답의 실제 메시지가 `"이미 즐겨찾기에 추가된 단지/매물입니다"`인데 문서는 공용 `"중복입니다"` 예시를 쓰고 있어, 단지/매물 각각의 실제 메시지로 정정(비교셋 중복 메시지 `"중복입니다"`는 실제 코드와 일치해 그대로 유지).
- 위 확인 과정에서 §2.1~§2.3 결함을 코드에서 수정했으므로, 이 3건은 "코드를 문서 기준에 맞게 고친 것"이며 swagger 자체는 이미 정확했다.

### 4.2 `docs/4-project-principle.md` §7 갱신 (v0.8 → v0.9)

- 설계 초안 당시 계획했던 `loan-simulation.routes.js`/`loan-simulation.controller.js`, `shuttle-commute.service.js`, `price-history.repository.js`가 실제 구현에는 존재하지 않음(각각 `listings.*`로 통합되었거나 생략됨)을 확인, 실제 디렉토리 구조로 정정.
- `swagger/` 디렉토리와 `tests/fixtures/`를 구조도에 반영.

### 4.3 `docs/8-wireframe.md` 갱신 (v0.1 → v0.2)

- §5 "내 정보" 화면 목업이 연소득/성과금을 **본인/배우자 각각 별도 입력**하는 것으로 그려져 있었으나, 실제 DB(`user_profiles.annual_income`/`annual_bonus`, 각각 단일 컬럼)와 프론트엔드 `UserProfileForm.tsx`는 필드가 **각각 1개씩**만 존재하고 부부합산 시 백엔드가 해당 값을 ×2로 계산하는 구조(이전 세션에서 "배우자 소득 별도 컬럼 없음"을 문서화된 가정으로 확정, `loan-scenario.service.js` 참조). 와이어프레임은 실제 구현 이전 초안이라 이 결정이 반영되지 않았던 것으로 확인 — 데스크톱/모바일 목업 모두 단일 입력 필드로 정정하고, 부부합산 계산 방식에 대한 안내 문구를 추가.

### 4.4 `docs/2-prd.md` — 불일치 없음(용어 관련 참고사항 1건)

- F1의 "500m 기준"(도보/차량 판정)은 순수 프론트엔드 표시 로직이며 백엔드는 미터 단위 원시값만 반환 — API와 무관, 불일치 아님.
- F4의 "규제지역 여부가 미확정인 매물" 표현은 실제로는 `is_land_transaction_permission_zone`(토지거래허가구역) 컬럼의 `null` 상태를 대리 신호로 사용해 판정한다(스키마상 `is_regulated_area`는 NOT NULL이라 그 자체로는 "미확정"을 표현할 수 없음). 이 대응관계는 도메인 정의서·사용자 시나리오 문서에서도 동일하게 나타나는 기존 설계이며 PRD만의 개별 오류가 아니라 문서 전반에 일관되게 적용된 모델링이므로 별도 정정하지 않음.

### 4.5 그 외 확인 문서 — 불일치 없음

- `docs/6-erd.md`: 전체 9개 테이블 컬럼·제약조건을 실제 마이그레이션 파일과 대조해 일치 확인. 다만 `price_history.lookup_period_type` 컬럼은 삽입 시점에 값이 채워지지만 API 응답 계산에는 전혀 사용되지 않는(§2.3 수정 후에도 여전히 미사용) 컬럼임을 참고로 남김 — 별도 조치는 하지 않음(스키마상 문제는 아니며, 저장은 되지만 조회 로직이 항상 재계산하므로 값 자체가 stale해도 응답에 영향 없음).
- `docs/5-arch-diagram.md`, `docs/7-execution-plan.md`: 백엔드 API 관련 서술에서 추가 불일치 발견되지 않음.

## 5. 정리

- 발견된 3건의 실제 코드 결함은 모두 수정 완료 및 재검증 통과.
- 관련 단위 테스트 2개 파일과 통합 테스트 픽스처 1개 파일을 실제 동작에 맞게 함께 갱신.
- `npm test` 24 suites / 204 tests 전부 통과(라인 커버리지 95.16%, 기존 80% 기준 상회).
- 테스트용으로 시딩했던 단지/매물/실거래이력/즐겨찾기/비교셋 데이터와 `user_profiles` 값은 모두 원상복구함(`housing` DB는 테스트 이전과 동일하게 빈 상태).
