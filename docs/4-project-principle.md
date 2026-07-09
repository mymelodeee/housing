# housing 프로젝트 구조 설계 원칙

- 버전: v0.8
- 최종 수정일: 2026-07-08
- 참조 문서: [1-domain-definition.md](./1-domain-definition.md) (v0.8), [2-prd.md](./2-prd.md) (v0.6), [3-user-scenario.md](./3-user-scenario.md) (v0.5), [9-style-guide.md](./9-style-guide.md) (v0.1)
- 버전 관리 규칙: 본 문서를 수정할 때마다 상단 버전(v0.1 → v0.2 …)과 최종 수정일을 함께 갱신한다. 과거 버전 이력은 별도 변경이력 절에 누적 기록한다.

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v0.1 | 2026-07-05 | 최초 초안 작성 |
| v0.2 | 2026-07-05 | 정합성 검토 반영: 참조 문서 버전 갱신(PRD v0.3, 사용자 시나리오 v0.2) / §6 "내 정보(재무 프로필)" 입력 폼의 소유 feature를 `user-profile/`로 단일화(기존 `loan-simulation/`과의 중복 서술 제거) |
| v0.3 | 2026-07-05 | 참조 문서 버전 갱신(도메인 v0.5, PRD v0.4, 사용자 시나리오 v0.3) — 실거래가 출처 명칭 통일 반영 |
| v0.4 | 2026-07-05 | 참조 문서 버전 갱신(도메인 v0.6, PRD v0.5, 사용자 시나리오 v0.4) — 비교셋 중복 매물 방지 규칙 반영 |
| v0.5 | 2026-07-05 | **구조 변경(도메인 v0.8 반영)**: §3 네이밍 예시에 `apartment_complexes`/`complex_id` 추가 및 단지·매물 식별자 분리 원칙 명시, 즐겨찾기·비교셋 이원화(`favorite_complexes`/`favorite_listings`, `comparison_set_complexes`/`comparison_set_listings`) 원칙 추가. §6 프론트엔드 구조에 각 feature의 "소속 단지" 조회 책임 명시. §7 백엔드 구조에 `complexes.routes/controller.js`, `apartment-complexes.repository.js`, `comparison.service.js` 추가 및 즐겨찾기/비교셋 repository 파일 분리 반영 |
| v0.6 | 2026-07-06 | 로컬 개발 환경에 실제 설치된 버전 확인 결과를 반영해 확정 기술 스택의 데이터베이스 버전을 PostgreSQL 17 → 18.4로 정정(§0, §5) |
| v0.7 | 2026-07-06 | 백엔드 구현(BE-0~BE-8 등) 진행 중 발견한 공백 수정: §5 `.env` 관리 규칙이 "백엔드 루트"만 언급하고 프론트엔드 `.env`/API base URL 규칙이 전혀 없었음 → 프론트엔드는 `VITE_API_BASE_URL`(Vite `VITE_` 접두사 규칙)로 API 서버 주소를 주입하고 `shared/api/client.ts`에 하드코딩하지 않는다는 원칙과, 백엔드 `CORS_ORIGIN`과 프론트엔드 개발 서버 origin이 일치해야 한다는 상호 연동 규칙을 §5에 추가 |
| v0.8 | 2026-07-08 | FE-2(네이버지도 연동) 진행에 맞춰 §5에 `VITE_NAVER_MAP_CLIENT_ID` 환경변수 규칙과 네이버 클라우드 플랫폼(NCP) 키 발급 사전 준비 절차 추가. 참조 문서에 `docs/9-style-guide.md`(신규) 추가 |

---

## 0. 문서 목적 및 범위

본 문서는 F1~F7 기능(PRD §5)을 구현하기 위한 **프로젝트 구조·코드 원칙**을 정의한다. DB 스키마 상세 설계, API 명세 전체, 실제 코드 구현은 본 문서 범위가 아니며 후속 실행계획 문서(`docs/7-execution-plan.md`)와 `swagger/swagger.json`에서 다룬다.

**확정 기술 스택**

| 영역 | 스택 |
|---|---|
| 플랫폼 | 웹 우선, 모바일은 별도 네이티브 앱 없이 반응형 웹 UI로만 대응 |
| 프론트엔드 | React 19 + TypeScript, 클라이언트 상태: Zustand, 서버 상태/캐싱: TanStack Query |
| 백엔드 | Node.js + JavaScript(TypeScript 아님) + Express, DB 접근은 `pg` 라이브러리로 직접 SQL 작성(ORM 미사용) |
| 데이터베이스 | PostgreSQL 18.4 |

---

## 1. 모든 스택에 공통인 최상위 원칙

1. **오버엔지니어링 금지 (CLAUDE.md 최우선 원칙 반영)**
   본 서비스는 인증 없는 단일 사용자용 웹앱이며 F1~F7 7개 기능이 전부다. 마이크로서비스, 이벤트소싱, CQRS, 과도한 추상화 인터페이스, 사용하지 않을 확장성을 위한 설계를 도입하지 않는다. 지시받지 않은 기능·레이어·설정은 추가하지 않는다.

2. **관심사 분리(Separation of Concerns)**
   "요청을 받는 것", "업무 규칙을 계산하는 것", "데이터를 저장/조회하는 것"을 서로 다른 코드 단위로 분리한다. 규제/대출 계산(도메인 §5)처럼 정책이 자주 바뀌는 로직은 특히 별도 모듈로 격리해, 정책 변경 시 해당 모듈만 수정하면 되도록 한다.

3. **문서-코드 정합성**
   도메인 정의서(§2 용어, §4 엔티티, §5 비즈니스 규칙)에서 사용한 용어를 코드의 타입명·변수명·테이블명에 그대로 사용한다(예: "세대 주택 보유 구분" → `housing_ownership_tier`). 도메인 문서와 코드에서 같은 개념이 다른 이름으로 존재하지 않도록 한다.

4. **요구사항 추적 가능성**
   PRD의 기능 ID(F1~F7)를 커밋 메시지, 디렉토리/파일 주석, 테스트 파일명 등에서 식별 가능하게 남긴다(예: `favorites.test.js` 상단에 `// F2 즐겨찾기`). 별도의 추적 ID 체계(도메인 §7에서 범위 밖으로 명시)를 새로 만들지 않고, 기존 F-번호를 그대로 재사용한다.

5. **단일 사용자 전제의 단순화**
   인증/세션/권한 분기 로직을 만들지 않는다. "사용자 프로필"은 테이블 1행 또는 고정 ID 레코드로 취급하며, 이를 위해 별도의 인증 미들웨어·JWT·세션 스토어를 도입하지 않는다.

---

## 2. 의존성/레이어 원칙

### 2.1 공통 원칙

- 의존 방향은 항상 **상위(정책/화면) → 하위(구현 세부)** 한 방향이다. 하위 레이어는 상위 레이어를 알지 못한다.
- 상위 레이어는 하위 레이어의 "무엇을 하는지"만 알고 "어떻게 하는지"는 몰라야 한다. 예: 컨트롤러는 SQL을 몰라야 하고, 컴포넌트는 fetch URL을 몰라야 한다.
- 레이어를 건너뛰는 호출을 금지한다(예: 라우트에서 DB 커넥션을 직접 호출하거나, 컴포넌트에서 axios/fetch를 직접 호출하는 것 금지).

### 2.2 프론트엔드 레이어와 의존 방향

```
components (화면/프레젠테이션)
    ↓ 사용
hooks (화면별 로직 조합: zustand + tanstack query 호출을 조합)
    ↓ 사용
zustand store (클라이언트 전용 상태: UI 상태, 선택된 비교셋 등)
tanstack query (서버 상태: 매물/즐겨찾기/대출계산 등 API 데이터 캐싱)
    ↓ 사용
api client (fetch 래퍼: baseURL, 에러 파싱 등 공통 처리)
    ↓ 호출
backend REST API
```

- **역할 구분**
  - `zustand`: 서버에 존재하지 않는 순수 클라이언트 상태만 관리한다(예: 지도 필터 UI 상태, 비교셋 선택 체크박스 상태, 모달 open/close). 서버에서 온 데이터(매물 목록, 대출 계산 결과)를 zustand에 복제해 두지 않는다.
  - `tanstack query`: 서버에서 가져오는 모든 데이터(매물 목록, 즐겨찾기, 대출 시뮬레이션 결과, 매매가 이력)의 fetch·캐싱·재검증을 전담한다.
  - `api client`: 이 계층에만 실제 HTTP 호출 코드(fetch)가 존재한다. 컴포넌트나 훅은 이 계층을 통해서만 서버와 통신한다.
- 컴포넌트는 `zustand`/`tanstack query`를 **훅을 통해서만** 접근하는 것을 원칙으로 하되, 화면이 단순한 F1~F7 규모에서는 컴포넌트가 훅(`useFavorites`, `useListingDetail` 등)을 직접 호출하는 정도의 얕은 구조로 충분하다(별도의 서비스/유즈케이스 레이어 추가 금지 — §1.1).

### 2.3 백엔드 레이어와 의존 방향

```
routes (URL ↔ 컨트롤러 매핑만 담당, 로직 없음)
    ↓
controllers (요청 파싱 · 응답 형식화, 트랜잭션 경계 지정)
    ↓
services (도메인 규칙: LTV/DSR 계산, 규제 판단, PMT 계산 등 순수 비즈니스 로직)
    ↓
repositories (raw SQL 격리: pg Pool/Client로 쿼리 실행 — SQL 문자열은 이 계층에만 존재)
    ↓
db (pg Pool 설정, 커넥션 관리)
```

- **SQL 격리 원칙**: `pg`를 직접 사용하므로 ORM이 주는 격리를 코드 규율로 대신한다. **SQL 쿼리 문자열은 오직 `repositories/` 계층에만 존재**해야 하며, controller나 service에서 직접 `pool.query(...)`를 호출하지 않는다. 이유: SQL을 한 곳에 모아야 스키마 변경 시 영향 범위를 repository 파일만 검토하면 되고, 인젝션 방지(파라미터 바인딩 `$1,$2...`) 규칙을 한 곳에서 강제할 수 있다.
- **services는 SQL을 몰라야 한다**: 규제/대출 계산(도메인 §5.1~§5.4) 같은 순수 계산 로직은 DB 접근 없이 입력값→출력값 함수로 작성한다. 이렇게 하면 정책 수치가 바뀌어도 DB나 라우팅 코드를 건드릴 필요가 없고, 단위 테스트도 DB 없이 가능하다.
- **controllers는 HTTP만 다룬다**: req/res 파싱, 상태 코드 결정, 에러 응답 포맷팅만 수행하고 비즈니스 판단(예: "이 매물은 갭투자 가능한가")은 services에 위임한다.
- 상위 레이어가 하위 레이어의 세부 구현(SQL 문법, 특정 테이블 구조)에 의존하지 않도록, repository는 "무엇을 조회/저장하는지"를 나타내는 함수 시그니처(`findListingById(id)`, `saveUserProfile(profile)`)로 상위에 노출한다.

---

## 3. 코드/네이밍 원칙

| 대상 | 규칙 | 예시 |
|---|---|---|
| React 컴포넌트 파일/명 | PascalCase | `ListingCard.tsx`, `LoanSimulationPanel.tsx` |
| 커스텀 훅 | camelCase, `use` 접두사 | `useFavorites.ts`, `useLoanSimulation.ts` |
| zustand store 파일 | camelCase, `~Store` 접미사 | `mapFilterStore.ts` |
| 일반 TS 함수/변수 | camelCase | `calculateMaxLoanAmount` |
| TS 타입/인터페이스 | PascalCase | `ListingDetail`, `LoanScenarioInput` |
| 백엔드 파일(JS) | kebab-case 또는 camelCase 중 택1(케밥 권장, 확장자 `.js`) | `loan-calculation.service.js`, `apartment-complexes.repository.js`, `listings.repository.js` |
| 백엔드 함수/변수(JS) | camelCase | `getMaxLoanAmount`, `dsrLimitAmount` |
| DB 테이블/컬럼 | snake_case, 테이블은 복수형 (Postgres 관례) | `apartment_complexes`, `listings`, `price_history`, `housing_ownership_tier` |
| DB PK/FK | `id` / `{단수테이블명}_id` | `complex_id`, `listing_id`, `user_profile_id` |
| REST 엔드포인트 | 소문자 kebab-case, 명사(복수) 기반 리소스 경로, 동사 금지 | `GET /api/complexes`, `GET /api/complexes/:id/price-history`, `GET /api/listings`, `POST /api/favorites/listings`, `POST /api/favorites/complexes`, `PUT /api/user-profile` |
| 도메인 용어 매핑 | 도메인 정의서 §2 용어를 그대로 영문화해 사용 | "아파트 단지"→`apartment_complex`(테이블명은 `apartment_complexes`), "매물"→`listing`, "즐겨찾기"→`favorite`, "비교셋"→`comparison_set`, "대출 시나리오"→`loan_scenario` |

- **단지(Apartment Complex) vs 매물(Listing) 식별자 분리**(도메인 v0.8 §2·§4): 연식/리모델링/재건축/주변재개발정보/규제지역·토허구역 여부/셔틀/입지 속성은 전부 `complex_id` 기준으로 조회하고, 매매가·전용면적만 `listing_id` 기준으로 조회한다. 매물 관련 코드에서 단지 속성을 매물 테이블에 중복 저장하지 않는다.
- **비교/즐겨찾기의 이원화**: 즐겨찾기와 비교셋은 "단지 대상"과 "매물 대상"을 별도 테이블(`favorite_complexes`/`favorite_listings`, `comparison_set_complexes`/`comparison_set_listings`)로 관리한다(도메인 §4.4~§4.5, ERD 참조). 하나의 비교셋 내 대상 유형은 항상 동일해야 한다.

---

## 4. 테스트/품질 원칙

- **커버리지 기준**: 프론트엔드/백엔드 모두 **라인 커버리지 80% 이상**을 기준으로 한다(기존 `frontend-resolver`/`backend-resolver` skill 규칙과 동일하게 유지).
- **테스트 범위 구분**
  - **단위 테스트**: 도메인 계산 로직 중심 — 백엔드 services(LTV/DSR/PMT 계산, 규제 판단), 프론트 순수 유틸/훅 로직. DB·네트워크 mocking.
  - **통합 테스트**: 백엔드 routes→controller→service→repository→실제(또는 테스트) PostgreSQL까지 연결한 API 레벨 테스트. 프론트는 컴포넌트+훅+tanstack query를 msw 등으로 API mocking하여 검증.
  - **E2E 테스트**: F1~F7 핵심 시나리오(3-user-scenario.md의 "핵심" 시나리오, 예: 6-1 대출 시나리오 비교, 1-2 매물 0건) 중심으로 최소 개수만 작성한다. 개인용 앱 규모에 맞춰 전체 화면을 모두 E2E로 덮지 않는다(오버엔지니어링 금지).
- **정적 분석/포맷**
  - 프론트엔드(TS): ESLint + TypeScript 컴파일러 타입체크(`tsc --noEmit`)를 커밋 전 필수로 통과시킨다. 포맷은 Prettier.
  - 백엔드(JS, TS 아님): ESLint(JS 설정)로 정적 검사. 타입체크 도구는 도입하지 않는다(스택 결정 존중). 포맷은 Prettier.
- **커밋 전 체크리스트**
  1. lint 통과 (프론트/백엔드 각각)
  2. 프론트 타입체크(`tsc --noEmit`) 통과
  3. 관련 단위/통합 테스트 통과, 커버리지 80% 이상 유지
  4. 변경한 기능의 PRD 기능 ID(F1~F7)와 도메인 규칙(§5 등) 대조 확인
  5. `.env` 등 자격증명 파일이 스테이징에 포함되지 않았는지 확인

---

## 5. 설정/보안/운영 원칙

- **자격증명**: DB 접속정보(호스트/포트/유저/비밀번호), 외부 API 키(국토교통부 실거래가 API, 지도 API) 등 모든 주요 자격증명은 **환경변수**로만 관리한다(기존 backend-resolver skill 규칙). 코드/설정 파일에 하드코딩 금지.
- **`.env` 관리**: 백엔드/프론트엔드 각 루트에 `.env`(로컬 전용, 실제 값)와 `.env.example`(키 목록만, 값은 placeholder)을 둔다. `.env`는 반드시 `.gitignore`에 포함하고 저장소에 커밋하지 않는다.
  - **백엔드**: `POSTGRES_CONNECTION_STRING`, `TEST_POSTGRES_CONNECTION_STRING`(통합 테스트용 DB), `PORT`, `CORS_ORIGIN`(프론트엔드 개발 서버 origin, 아래 CORS 항목과 연동).
  - **프론트엔드(Vite)**: API 서버 주소는 `shared/api/client.ts`에 하드코딩하지 않고 `VITE_API_BASE_URL` 환경변수로만 주입한다. Vite는 `VITE_` 접두사가 붙은 변수만 클라이언트 번들에 노출하므로(빌드 도구 자체 제약), 이 접두사를 반드시 지킨다. 로컬 `.env`에는 `VITE_API_BASE_URL=http://localhost:3000`(백엔드 BE-0의 `PORT` 값과 일치)을, `.env.example`에는 값 없이 키만 둔다.
  - **프론트엔드 지도 API 키(FE-2)**: 네이버지도 JavaScript SDK 클라이언트 ID는 `VITE_NAVER_MAP_CLIENT_ID` 환경변수로만 주입하며, `src/shared/map/useNaverMapsScript.ts`가 SDK 스크립트 URL(`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=...`)에 이 값을 동적으로 삽입한다. 코드에 키를 하드코딩하지 않는다. `.env.example`에는 값 없이 키만 두고, `.env`에는 실제 발급받은 값을 채운다 — **키가 없거나 비어 있으면 지도 SDK 로드가 실패한 것으로 간주해 앱 크래시 없이 대체 안내 문구를 표시**하도록 설계되어 있으므로(FE-2 완료조건), 키 미발급 상태에서도 개발 서버는 정상 기동된다.
    - 키 발급 사전 준비(네이버 클라우드 플랫폼, NCP): ① ncloud.com 가입, ② 콘솔에서 AI·NAVER API > Maps 서비스 신청(결제수단 등록 필요할 수 있음), ③ Application 등록 시 Web Dynamic Map 등 필요한 서비스 선택 및 **서비스 URL**에 로컬 개발 origin(`http://localhost:5173`)과 배포 도메인을 등록, ④ 발급된 Client ID를 `frontend/.env`의 `VITE_NAVER_MAP_CLIENT_ID`에 입력.
  - 백엔드 `.env`의 `CORS_ORIGIN`과 프론트엔드 개발 서버의 실제 origin(Vite 기본 `http://localhost:5173`)이 반드시 일치해야 하며, 어느 한쪽만 바꾸고 다른 쪽을 갱신하지 않으면 CORS 오류가 발생한다.
- **로깅**: 모든 로깅은 **콘솔 기반**(`console.log`/`console.error` 등)을 사용한다(기존 backend-resolver skill 규칙). winston/pino 등 별도 로깅 라이브러리는 도입하지 않는다. 다만 최소한의 가독성을 위해 로그 레벨 성격만 접두사로 구분한다(예: `console.log('[INFO] ...')`, `console.error('[ERROR] ...')`, `console.warn('[WARN] ...')`) — 이는 문자열 접두사 규칙일 뿐 새로운 라이브러리/추상화가 아니다.
- **CORS**: 프론트엔드 개발 서버 origin만 명시적으로 허용하는 최소 CORS 설정을 Express에 둔다(`cors` 미들웨어, 와일드카드 `*` 지양). 운영 환경 origin도 환경변수로 주입한다.
- **PostgreSQL 접속 정보**: `pg.Pool` 설정값(host/port/database/user/password/max connection)은 전부 환경변수에서 읽어 `db/pool.js` 등 단일 초기화 지점에서만 생성한다. 애플리케이션 코드 곳곳에서 개별적으로 `new Client()`를 생성하지 않는다.
- **비밀 정보 커밋 방지**: `.gitignore`에 `.env`, `.env.*`(단, `.env.example` 제외), `node_modules`, 빌드 산출물을 포함한다.

---

## 6. 프론트엔드 디렉토리 구조

**선택 근거**: F1~F7 7개 기능이 각각 명확히 분리된 화면/기능 단위(매물탐색, 즐겨찾기, 비교셋, 규제/대출, 입지정보, 대출시뮬레이션, 가격이력)이고 팀 규모가 1인(개인용)이므로, 대규모 조직에서 쓰는 순수 layer 단위(atoms/molecules 등) 구조보다 **feature(기능) 단위 구조**가 코드 위치를 예측하기 쉽고 유지보수 비용이 낮다. 다만 지도/매물 상세처럼 여러 기능(F4~F7)이 한 화면(탭)에 공존하므로, 화면 단위가 아니라 **PRD의 F-번호에 대응하는 기능 단위**로 폴더를 나눈다. 여러 기능이 공유하는 것(매물 카드, 버튼 등)은 `shared/`에 둔다.

```
frontend/
├── src/
│   ├── app/                     # 앱 진입점, 라우터, 전역 Provider(QueryClientProvider 등)
│   │   ├── App.tsx
│   │   └── router.tsx
│   ├── features/
│   │   ├── listing-search/      # F1: 매물 탐색 및 셔틀 통근 분석(매물 카드에 소속 단지의 연식/셔틀 정보 함께 노출)
│   │   │   ├── components/      # PascalCase 컴포넌트 (MapView.tsx, ListingCard.tsx)
│   │   │   ├── hooks/            # useListingSearch.ts (tanstack query + zustand 조합)
│   │   │   └── store/            # mapFilterStore.ts (zustand: 필터 UI 상태)
│   │   ├── favorites/            # F2: 즐겨찾기(단지 탭 / 매물 탭 2개 목록)
│   │   ├── comparison/           # F3: 비교셋 생성 및 비교("단지 비교"/"매물 비교" 모드 선택, 도메인 §5.5)
│   │   ├── listing-detail/       # F4·F5·F7 등 매물 상세 탭 공통 셸(소속 단지 정보 join 조회)
│   │   │   ├── components/       # ListingDetailTabs.tsx 등
│   │   │   ├── regulation/       # F4: 규제/대출 분석(소속 단지 규제 정보 기준)
│   │   │   ├── locality/         # F5: 입지 정보(연식/리모델링/재건축/재개발정보 포함, 소속 단지 기준)
│   │   │   └── price-history/    # F7: 매매가 변동 이력(소속 단지 기준)
│   │   ├── loan-simulation/      # F6: 대출 시뮬레이션 계산 결과 화면(부부합산 vs 단독명의 비교). "내 정보" 폼은 소유하지 않고 user-profile의 훅을 통해 저장된 프로필만 조회
│   │   └── user-profile/         # "내 정보" 화면의 유일한 소유자: 재무 프로필(F6 입력값) 입력/수정 폼과 단일 레코드 조회·저장을 전담
│   ├── shared/
│   │   ├── components/           # 여러 feature가 공유하는 UI(Button, Badge, Modal 등)
│   │   ├── api/                  # api client 계층: fetch 래퍼, baseURL, 공통 에러 처리
│   │   ├── hooks/                 # 여러 feature가 공유하는 범용 훅
│   │   └── types/                 # 도메인 공용 타입(Listing, LoanScenario 등, 도메인 §4 용어 반영)
│   ├── styles/                    # 전역 스타일/테마
│   └── main.tsx
├── tests/                         # 통합/e2e 테스트 (또는 각 feature 폴더 내 *.test.tsx 병행)
├── .env.example
├── package.json
└── tsconfig.json
```

- 각 `features/*` 폴더는 자신의 `components/hooks/store`만 가지며, 다른 feature의 내부 폴더를 직접 import하지 않는다(공유가 필요하면 `shared/`로 승격).
- API 호출 코드(`fetch`)는 `shared/api/`에만 위치하며, `features/*/hooks`는 이 계층을 통해서만 서버와 통신한다(§2.2 의존 방향 준수).

---

## 7. 백엔드 디렉토리 구조

**선택 근거**: ORM 없이 `pg`로 raw SQL을 작성하므로, SQL을 한 곳(`repositories/`)에 모으는 것이 §2.3의 SQL 격리 원칙을 지키는 핵심이다. 마이그레이션 도구도 ORM에 딸려오지 않으므로 **경량 마이그레이션 도구(`node-pg-migrate`)** 를 별도로 도입해 SQL 기반 마이그레이션 파일을 버전 관리한다(Prisma 등 ORM 마이그레이션 금지 원칙과 충돌하지 않음 — `node-pg-migrate`는 ORM이 아니라 순수 SQL/마이그레이션 실행 도구).

```
backend/
├── src/
│   ├── routes/                   # URL ↔ controller 매핑만. 로직 없음
│   │   ├── complexes.routes.js       # 단지 조회, 단지 규제/입지/가격이력
│   │   ├── listings.routes.js        # 매물 조회(매매가/전용면적)
│   │   ├── favorites.routes.js       # /api/favorites/complexes, /api/favorites/listings
│   │   ├── comparison-sets.routes.js # target_type(complex/listing) 분기
│   │   ├── loan-simulation.routes.js
│   │   └── user-profile.routes.js
│   ├── controllers/               # 요청 파싱, 응답 포맷, 상태코드 결정
│   │   ├── complexes.controller.js
│   │   ├── listings.controller.js
│   │   ├── favorites.controller.js
│   │   ├── comparison-sets.controller.js
│   │   ├── loan-simulation.controller.js
│   │   └── user-profile.controller.js
│   ├── services/                  # 순수 도메인 로직(DB 접근 없음)
│   │   ├── regulation.service.js  # 도메인 §5.1 규제/갭투자/실거주 판단
│   │   ├── loan-limit.service.js  # 도메인 §5.2 최대 대출가능금액 산출
│   │   ├── repayment.service.js   # 도메인 §5.3 원리금균등상환(PMT) 계산
│   │   ├── loan-scenario.service.js # 도메인 §5.4 부부합산 vs 단독명의 비교
│   │   ├── comparison.service.js  # 도메인 §5.5 단지 비교(시세 집계)/매물 비교 데이터 조합
│   │   └── shuttle-commute.service.js
│   ├── repositories/               # raw SQL은 이 계층에만 존재
│   │   ├── apartment-complexes.repository.js  # findComplexById, aggregateComplexPriceRange 등
│   │   ├── listings.repository.js
│   │   ├── favorite-complexes.repository.js
│   │   ├── favorite-listings.repository.js
│   │   ├── comparison-sets.repository.js       # comparison_set_complexes/comparison_set_listings 모두 처리
│   │   ├── user-profile.repository.js
│   │   └── price-history.repository.js         # complex_id 기준 조회
│   ├── db/
│   │   ├── pool.js                # pg.Pool 단일 초기화 지점 (환경변수 기반)
│   │   └── migrations/            # node-pg-migrate SQL 마이그레이션 파일
│   │       ├── 1690000000000_create-apartment-complexes.js
│   │       ├── 1690000000001_create-listings.js
│   │       └── ...
│   ├── middlewares/
│   │   ├── error-handler.js       # 공통 에러 응답 포맷
│   │   └── cors.js
│   ├── config/
│   │   └── env.js                 # 환경변수 로딩/검증 단일 지점
│   └── app.js                     # Express 앱 조립(라우트 등록, 미들웨어 장착)
├── tests/
│   ├── unit/                      # services 단위 테스트(계산 로직 중심)
│   └── integration/               # routes~repository~테스트 DB 통합 테스트
├── .env.example
├── .gitignore
└── package.json
```

- **SQL 위치**: 쿼리 문자열은 `repositories/*.js` 파일 내부에 파라미터 바인딩(`$1, $2 ...`)과 함께 작성한다. 재사용 빈도가 높거나 긴 쿼리는 같은 폴더 내 `*.sql`로 분리해 `fs.readFileSync`로 로드하는 것도 허용하되, 이번 규모(F1~F7)에서는 JS 파일 내 문자열 작성만으로 충분하다(오버엔지니어링 금지).
- **마이그레이션 관리**: `node-pg-migrate`로 스키마 변경 이력을 SQL 마이그레이션 파일로 관리한다. 각 마이그레이션 파일은 순차 실행 가능한 단위여야 하며, 운영 반영 전 로컬 PostgreSQL 18.4에서 up/down을 검증한다.
- **의존 방향 강제**: `routes`는 `controllers`만 import, `controllers`는 `services`만 import(단, 단순 CRUD는 controller가 repository를 직접 호출하는 것도 허용 가능하나 규제/대출처럼 계산이 있는 기능은 반드시 service를 경유), `services`는 `repositories`만 import, `repositories`는 `db/pool.js`만 import한다. 역방향 import(예: repository가 service를 import)는 금지한다.

---

## 8. 범위 밖(Out of Scope) 명시

본 문서는 원칙과 구조까지만 다루며 다음은 포함하지 않는다: DB 스키마 상세 설계(테이블별 전체 컬럼 정의), API 명세 전체(엔드포인트별 요청/응답 스펙), 실제 코드 구현. 이들은 `docs/7-execution-plan.md`와 `swagger/swagger.json`에서 후속으로 다룬다.
