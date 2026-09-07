# 검색 아키텍처 분석 및 리팩터 계획

- 버전: v0.1
- 작성일: 2026-09-07
- 참조: [1-domain-definition.md](./1-domain-definition.md), [6-erd.md](./6-erd.md), [7-execution-plan.md](./7-execution-plan.md), `database/schema.sql`, `backend/src/config/target-regions.js`
- 근거 기준: 본 문서의 모든 판단은 실제 코드(파일·줄번호)와 개발 DB(`housing`) 실측 쿼리 결과에 근거하며, 추측으로 작성한 항목은 없다.

## 요약

등록 매물 목록에 서비스 대상이 아닌 지역(평택)이 노출된다는 신고를 계기로, 지역 정책·도메인 모델·보안·UI 구조를 코드와 개발 DB 기준으로 전수 검증했다. 핵심 원인은 **지역 scope를 강제하는 코드가 backend query 어디에도 없다**는 구조적 결함이며, 부수적으로 `listing`이라는 이름이 실제로는 국토부 실거래 데이터를 가리키는 **개념 충돌**도 확인됐다. 보안 감사에서는 실제 유출은 없었으나 미사용 secret 노출 위험 1건과 `.env.example` 불완전 1건을 확인했다.

---

## 1. 현재 데이터 흐름

### 1.1 등록 매물(Registered Listing) 경로
```
Frontend (ListingSearchScreen, searchMode='registered')
  → GET /api/listings?minPrice&maxPrice&minLat&maxLat&minLng&maxLng
  → listings.controller.listListings
  → listings.service.listListings
  → listings.repository.findByPriceRange(minPrice, maxPrice, [bbox])
  → SELECT ... FROM listings l JOIN apartment_complexes c WHERE l.sale_price BETWEEN $1 AND $2 [AND bbox]
```
`apartment_complexes`/`listings`는 사용자가 실시간 탐색 결과를 선택(`POST /api/listings/live-search/select`)할 때 `regional-listings.service.selectCacheEntry()`가 upsert하며 생성된다(`findOrCreateComplex`/`findOrCreateListing`).

### 1.2 실시간 탐색(Live Search) 경로
```
Frontend (searchMode='live')
  → GET /api/listings/live-search?minPrice&maxPrice&minArea&maxArea
  → regional-listings.controller.liveSearch
  → regional-listings.service.searchLiveListings
  → regional-listing-cache.repository.findByFilters(price, area, minHouseholdCount)
  → SELECT * FROM regional_listing_cache WHERE ...
```
`regional_listing_cache`는 배치 스크립트 `backend/scripts/collect-regional-listings.js`가 `TARGET_REGIONS`(`backend/src/config/target-regions.js`)를 순회하며 국토부 실거래 API + 단지목록 API + Geocoding API로 채운다.

### 1.3 두 경로의 지역 정책 참조 여부

| 경로 | 지역 조건 참조 |
|---|---|
| 배치 수집기(`collect-regional-listings.js`) | `TARGET_REGIONS`를 순회해 수집 **대상을 결정** |
| 실시간 탐색 조회(`findByFilters`) | 없음 — 캐시에 있는 건 전부 반환 |
| 등록 매물 조회(`findByPriceRange`) | 없음 — `apartment_complexes`에 있는 건 전부 반환 |

즉 `TARGET_REGIONS`는 **데이터를 채우는 쪽**에서만 참조되고, **데이터를 꺼내는 쪽**은 그 정책을 전혀 모른다.

---

## 2. 평택 노출 root cause

### 2.1 실측 결과 (개발 DB `housing`)

```sql
SELECT c.id, c.complex_name, c.lawd_cd FROM apartment_complexes c ORDER BY c.id;
```

| lawd_cd | 지역 | 단지 수 | TARGET_REGIONS 포함 |
|---|---|---|---|
| `41220` | 평택시 | 1 (힐스테이트고덕센트럴) | ✗ |
| `41463` | 용인시 기흥구 | 3 (힐스테이트구성, 블루밍구성더센트럴, 더샵보정애비뉴1단지) | ✗ |
| `11740`/`41131`/`41133`/`41597` | 강동·성남수정·성남중원·화성동탄 | 9 | ✓ |

**평택만의 문제가 아니다.** 전체 13건 중 4건(평택 1 + 용인기흥 3)이 대상 지역 밖인데도 등록 매물 목록에 그대로 노출되고 있었다.

### 2.2 코드 근거

`backend/src/repositories/listings.repository.js:15` (수정 전):
```js
async function findByPriceRange({ minPrice, maxPrice, minLat, maxLat, minLng, maxLng }) {
  // WHERE l.sale_price BETWEEN $1 AND $2 [AND bbox] 뿐, lawd_cd 조건 없음
```
가격과 선택적 bbox만 필터링하고 지역 조건이 전혀 없다. `GET /api/listings` → `listings.controller` → `listings.service` → 이 함수로 직결되므로 DB의 모든 단지가 그대로 나간다.

`backend/src/repositories/regional-listing-cache.repository.js:35` `findByFilters()`도 동일하게 지역 조건이 없어, 대상 지역이 앞으로 다시 축소되면 같은 문제가 재발한다(현재는 우연히 캐시가 정합할 뿐).

### 2.3 데이터가 생긴 경위 — fixture 오염 아님

`docs/1-domain-definition.md` v0.18 변경이력에 원인이 명시돼 있다:

> 평택시(41220)와 화성시 만세구·효행구를 대상에서 제외 … **제외 지역의 기존 수집 데이터는 `regional_listing_cache`에서 삭제**. … 기존 등록 매물 시드 중 평택 단지(힐스테이트고덕센트럴)는 **실시간 수집 대상에서만 제외된 것으로, 등록 매물에는 그대로 유지**

즉 실시간 캐시만 정리하고 등록 매물은 의도적으로 방치했으며, 이를 막을 쿼리 제약이 없었다. 용인 기흥(41463) 제외는 v0.31 변경이력에 있으며 동일한 패턴이 반복됐다.

`backend/tests/fixtures/fixtures.sql`의 `평택 소사벌 한라비발디`는 개발 DB의 `힐스테이트고덕센트럴`과 **다른 행**이고 `housing_test` 전용이다(§5 참조). fixture가 개발 DB로 유입되는 코드 경로는 없다.

---

## 3. Listing / Transaction 개념 충돌

### 3.1 도메인 정의와의 불일치

`docs/1-domain-definition.md` §2:
> **매물(Listing)**: 특정 아파트 단지에 속한 **개별 판매 건**. 매매가, 전용면적 등 "거래 건"에 종속된 속성

그러나 `regional_listing_cache`가 담는 것은 국토부 **과거 완료된 실거래**다. `database/schema.sql:224`도 스스로 한계를 명시한다:
> 실제 "매물 호가"가 아닌 "최근 실거래가"를 시세 근사치로 사용한다는 한계가 있다

`docs/7-execution-plan.md` v0.34 변경이력도 이를 재확인한다:
> 국토교통부 실거래가 API는 완료된 거래만 공개하고 "현재 매물로 올라온 건"을 조회할 수 있는 공개 API가 존재하지 않아 실데이터로 대체 불가함을 확인

### 3.2 승격(promotion) 구조

`backend/src/services/regional-listings.service.js` `selectCacheEntry()`:
```js
const complex = await findOrCreateComplex(row, coordinates);
const listing = await findOrCreateListing(complex.id, row);
return { listingId: listing.id };
```
과거 실거래 캐시 행이 그대로 `listings` 테이블(판매 건)로 INSERT된다. **과거 거래 기록이 "판매 중 매물"로 승격**되는 셈이며, 현재 서비스에는 실제 호가(현재 매물) API가 전혀 없다.

### 3.3 명칭이 야기하는 혼란

| 현재 명칭 | 실제 의미 | 제안 명칭 |
|---|---|---|
| `live-search` (`GET /api/listings/live-search`) | 국토부 최근 실거래 조회 | `market-search` 또는 `recent-transactions` |
| `RegionalListing` (FE 타입) | 지역 실거래 캐시 row | `RegionalTransaction` |
| `LiveListingCard`/`LiveListingComplexGroup` | 실거래 카드/그룹 | `RecentTransactionCard`/`...Group` |
| `regional_listing_cache` (테이블) | 실거래 캐시 | `regional_transaction_cache` |
| `useLiveListings`/`useSelectLiveListing` | 실거래 조회/승격 훅 | `useRecentTransactions`/`useSelectRecentTransaction` |

`ApartmentComplex`(단지)·`PriceHistory`(단지의 확정 실거래 이력)·`Listing`(판매 건)은 이미 분리돼 있다. 여기에 **RecentTransaction**(지역 실거래 캐시, 승격 전 상태)을 별도 개념으로 명시하면 `Listing`을 "실제 판매 의사가 있는 건"이라는 원래 의미로 되돌릴 수 있다. **단, 이번 문서는 rename을 실행하지 않고 계획만 수립한다**(§7.2, §8.2 참조).

### 3.4 Rename 영향 범위 (28개 파일 실측)

**Backend (9개)**
- `backend/src/controllers/regional-listings.controller.js`
- `backend/src/services/regional-listings.service.js`
- `backend/src/repositories/regional-listing-cache.repository.js`
- `backend/src/db/migrations/1783619500000_create-regional-listing-cache.js`
- `backend/scripts/collect-regional-listings.js`
- `backend/src/routes/listings.routes.js` (`/live-search` 경로)
- `backend/tests/unit/regional-listings.controller.test.js`
- `backend/tests/unit/regional-listings.service.test.js`
- `backend/tests/unit/collect-regional-listings.test.js`

**Frontend (11개)**
- `frontend/src/features/listing-search/types.ts` (`RegionalListing`)
- `frontend/src/features/listing-search/hooks/useLiveListings.ts` + `.test.ts`
- `frontend/src/features/listing-search/hooks/useSelectLiveListing.ts` + `.test.ts`
- `frontend/src/features/listing-search/components/LiveListingCard.tsx`
- `frontend/src/features/listing-search/components/LiveListingComplexGroup.tsx` + `.test.tsx` + `.css`
- `frontend/src/features/listing-search/utils/groupLiveListingsByComplex.ts` + `.test.ts`
- `frontend/src/features/listing-search/components/ListingSearchScreen.tsx` + `.test.tsx`

**문서/스키마 (3개 + docs 5개)**
- `database/schema.sql`, `backend/swagger/swagger.json`
- `docs/1-domain-definition.md`, `docs/6-erd.md`, `docs/7-execution-plan.md`, `docs/remodeling/implementation-plan.md`(교차 참조), 본 문서

### 3.5 `remodeling.service.js`의 우발적 결합

리모델링 기능 구현 중 `backend/src/services/remodeling.service.js`가 `priceLink`를 만들 때 실거래가 조회 흐름을 재사용하며 `regional_listing_cache`/`listings` 개념과 다시 얽힌다. rename 시 이 파일도 영향권에 들어간다(§3.4 목록에는 미포함이나 실행 시 재확인 필요).

---

## 4. Region source of truth 문제

### 4.1 분산 현황

| 위치 | 형태 | 참조하는 코드 |
|---|---|---|
| `backend/src/config/target-regions.js` | `{ regionName, lawdCd, dongs? }[]` | 배치 수집기, `findRegionNameByLawdCd` |
| `apartment_complexes.lawd_cd` | varchar(5), nullable | MOLIT fetch-through 매핑 |
| `apartment_complexes.address` | 자유 문자열 | 표시용, 좌표 실패 시 지오코딩 쿼리 |
| `regional_listing_cache.lawd_cd` | varchar(5), NOT NULL | 실시간 캐시 |

`isTargetRegion`/`getTargetRegion` 같은 helper가 이번 작업 전에는 존재하지 않았고, `regional-listings.service.js`의 `findRegionNameByLawdCd()`가 매번 배열을 순회하는 것이 유일한 조회 로직이었다.

### 4.2 canonical contract (이번에 구현 완료 — §7.1 참조)

`lawdCd`를 canonical identifier로, `regionName`은 표시용으로 확정하고 `target-regions.js`에 3개 helper를 추가했다:
```js
getTargetRegionCodes()  // 중복 제거된 lawdCd 배열
getTargetRegion(lawdCd) // { regionName, lawdCd, dongs? } | null
isTargetRegion(lawdCd)  // boolean
```
새 모듈을 만들지 않고 기존 `target-regions.js`를 그대로 source of truth로 확장했다(오버엔지니어링 방지).

### 4.3 legacy `lawd_cd IS NULL` 처리

개발 DB 실측: `apartment_complexes` 13건 중 `lawd_cd IS NULL` **0건**. `housing_test` 픽스처는 3건 모두 NULL이었으나(§5), 이번 작업에서 지역 필터 검증이 가능하도록 실제 값(41597/41220/41131)을 채웠다.
`lawd_cd`는 이번에 **NOT NULL로 전환**했다(§9 마이그레이션). `regional-listings.service.findOrCreateComplex()`는 항상 `lawd_cd`를 넘기므로 기존 승격 경로는 영향받지 않는다.

---

## 5. Public repository security audit

### 5.1 Git tracked 상태 (실측)

```
git ls-files | grep -Ei "\.env|node_modules|dist/|coverage/|settings.local"
→ backend/.env.example
→ frontend/.env.example
```
`backend/.env`, `frontend/.env`, `node_modules/`, `coverage/`, `.claude/settings.local.json` 중 tracked된 것은 **없음**.

### 5.2 Git history 조사

`git log --all --diff-filter=A --name-only`으로 전체 이력을 뒤졌으나 `.env` 파일이 추가된 커밋은 **없음**. 과거 유출 이력 없음.

### 5.3 `.gitignore` 커버리지 확인

`git check-ignore -v`로 확인: `backend/.env`, `frontend/.env`, `backend/node_modules`, `backend/coverage`는 `.gitignore:69/41/22`에 의해, `.claude/settings.local.json`은 전역 git ignore(`~/.config/git/ignore`)에 의해 정상 무시됨.

### 5.4 발견된 문제 2건

**(1) 미사용 `VITE_NAVER_MAP_CLIENT_SECRET`**
`frontend/.env`에 실제 값이 채워진 채 존재했으나, `frontend/src` 전체에서 참조 0건(`VITE_API_BASE_URL`, `VITE_NAVER_MAP_CLIENT_ID`만 코드에서 사용). Vite는 `VITE_` 접두사 변수를 클라이언트 번들에 **인라인**하므로, 참조되는 순간 브라우저에 그대로 노출된다. `.env.example`엔 애초에 없었으므로 실제 유출은 없었으나, 미사용 secret이 `.env`에 남아있는 것 자체가 향후 실수로 참조될 위험이었다. → **제거 완료**(§7.3).

**(2) `backend/.env.example` 불완전**
`config/env.js`의 `requiredKeys`는 8개(`PORT`, `POSTGRES_CONNECTION_STRING`, `CORS_ORIGIN`, `DATA_APT_KR_API_KEY`, `DATA_APT_KR_API_KEY2`, `DATA_STORE_API_KEY`, `DATA_GEOCODING_CLIENT_ID`, `DATA_GEOCODING_CLIENT_SECRET`)인데 `.env.example`엔 4개만 있어 신규 클론 시 부팅이 실패한다. `DATA_SCHOOL_API_KEY`(스크립트 전용)와 `REMODELING_STALE_AFTER_DAYS`도 누락돼 있었다. → **키 이름만 추가 완료**(값은 비워둠, §7.3).

---

## 6. 삭제하거나 Git에서 제외할 파일

실측 결과 **삭제·제외가 필요한 파일은 없다.** `.gitignore`가 이미 올바르게 동작 중이며, git tracked 상태에 민감 파일이 없다. `frontend/.env`의 미사용 secret 값은 파일 삭제가 아니라 해당 줄만 제거하는 것으로 충분했다(§5.4, §7.3).

---

## 7. Backend 변경안

### 7.1 이번에 구현함 — 지역 필터 강제

- `target-regions.js`에 `getTargetRegionCodes`/`getTargetRegion`/`isTargetRegion` 추가
- `listings.repository.findByPriceRange()`에 `targetLawdCds` 파라미터와 `c.lawd_cd = ANY($n)` 조건 추가
- `regional-listing-cache.repository.findByFilters()`에 동일하게 `targetLawdCds` 조건 추가
- `listings.service.listListings()` / `regional-listings.service.searchLiveListings()`가 `getTargetRegionCodes()`로 코드 배열을 주입(repository는 config를 직접 import하지 않아 계층 유지)
- `regional-listings.service.findRegionNameByLawdCd()`를 `getTargetRegion()` 기반으로 교체(중복 로직 제거)
- `apartment_complexes.lawd_cd`를 `NOT NULL`로 전환하는 마이그레이션 추가(§9)

### 7.2 계획만 수립 — Listing/Transaction 분리 (이번에 실행하지 않음)

**마이그레이션 전략** (§3.4의 28개 파일 대상):

1. **1단계 — DB 병행기**: `regional_listing_cache` 테이블은 유지한 채 `regional_transaction_cache`를 뷰(view) 또는 synonym으로 병행 노출. 코드 변경 없이 이름만 검증.
2. **2단계 — Backend rename**: repository → service → controller → route 순으로 안쪽부터 이름을 바꾸고, 매 단계마다 `npm test` 통과 확인. 라우트 경로(`/live-search`)는 하위 호환을 위해 당분간 별칭으로 유지(`/market-search`를 신설하고 `/live-search`는 deprecated 응답 헤더만 추가).
3. **3단계 — Frontend rename**: 타입 → 훅 → 컴포넌트 순으로, API 클라이언트가 새 경로를 호출하도록 전환.
4. **4단계 — docs 동기화**: `1-domain-definition.md`에 `RecentTransaction` 개념을 정식 추가하고 `Listing` 정의를 "판매 의사가 확인된 건"으로 좁힌다.
5. **5단계 — 구 명칭 제거**: 별칭 라우트/뷰 제거.

각 단계는 독립적으로 되돌릴 수 있어야 하며, 1~2단계 사이에 최소 1회 배포 검증을 권장한다.

### 7.3 이번에 구현함 — 보안 정리

- `frontend/.env`에서 `VITE_NAVER_MAP_CLIENT_SECRET` 라인 제거
- `backend/.env.example`에 누락 키 이름 추가: `DATA_APT_KR_API_KEY`, `DATA_APT_KR_API_KEY2`, `DATA_STORE_API_KEY`, `DATA_GEOCODING_CLIENT_ID`, `DATA_GEOCODING_CLIENT_SECRET`, `DATA_SCHOOL_API_KEY`, `REMODELING_STALE_AFTER_DAYS`(값은 비워두거나 기본값만 표기)

---

## 8. Frontend 변경안

### 8.1 이번에 구현함
없음 — 이번 범위는 backend 지역 필터와 보안 정리이며, 프론트엔드는 API 응답이 이미 필터링되어 오므로 코드 변경 없이 자동으로 반영된다(`ListingSearchScreen`은 `/api/listings`/`/api/listings/live-search` 응답을 그대로 사용).

### 8.2 계획만 수립 — UI 정보 계층 재설계 (§10에서 상술)

`ComplexLocationCard`/`LiveListingComplexGroup`/`ListingCard` 3종 카드가 서로 다른 정보 계층을 갖고 있어(§10.1) 재설계가 필요하나, 이번 문서에서는 목표 계층 구조만 정의하고 구현은 후속 작업으로 미룬다.

---

## 9. DB migration 필요 여부

**필요함 — 이번에 적용함.**

`backend/src/db/migrations/1788100000000_set-lawd-cd-not-null.js`:
```sql
ALTER TABLE apartment_complexes ALTER COLUMN lawd_cd SET NOT NULL;
```
`database/schema.sql`도 동기화(컬럼 정의에 `NOT NULL` 반영). 이 김에 기존에 `schema.sql`이 반영하지 못하고 있던 `lawd_cd`/`molit_apt_name` 컬럼 자체도 함께 추가했다(마이그레이션 `1783618964630`은 이미 존재했으나 `schema.sql`에는 누락되어 있던 기존 결함).

**적용 대상**: 개발 DB(`housing`)와 테스트 DB(`housing_test`) 양쪽. `housing_test`는 마이그레이션 이력 없이 `schema.sql`로 구축돼 있어, 기존 마이그레이션 14개를 `--fake`로 표시한 뒤 이번 마이그레이션만 실제 적용하는 절차가 필요하다(리모델링 테이블 적용 때와 동일한 절차, §9.1 참조).

### 9.1 픽스처 영향

`backend/tests/fixtures/fixtures.sql`의 단지 3건이 모두 `lawd_cd IS NULL`이었다(마이그레이션이 컬럼만 추가하고 픽스처는 갱신되지 않았던 기존 결함). NOT NULL 전환과 지역 필터 테스트가 의미를 가지려면 값이 필요해, 다음과 같이 채웠다:

| 픽스처 단지 | lawd_cd | 대상 지역 여부 |
|---|---|---|
| 동탄역 시범 우남퍼스트빌 | `41597`(화성시 동탄구) | ✓ 대상 |
| 평택 소사벌 한라비발디 | `41220`(평택시) | ✗ 비대상(필터 검증용) |
| 위례신도시 롯데캐슬 | `41131`(성남시 수정구) | ✓ 대상 |

---

## 10. UI 개선안

### 10.1 현재 정보 계층 (실측)

| 카드 | 현재 표시 항목 |
|---|---|
| `ComplexLocationCard`(등록 매물) | 단지명, 주소, 준공년도 |
| `LiveListingComplexGroup`(실시간, 접힘) | 단지명, 거래건수, 주소, 가격범위, 세대수 |
| `LiveListingCard`(실시간, 펼침 개별건) | 가격, 단지명, 주소, 전용면적, 거래일, 세대수 |
| `ListingCard`(검색 화면 미사용, 즐겨찾기 탭에서만 사용) | 가격, 단지명, 주소, 전용면적, 준공년도, 셔틀 정보 |

동일한 "목록 카드" 역할인데 4종이 서로 다른 항목 조합을 쓰고 있다.

### 10.2 목표 정보 계층 (요청 기준 정리, 구현은 후속)

- **Primary**: 단지명, 대표 최근 실거래가 또는 가격 범위, 전용면적
- **Secondary**: 지역, 최근 거래일, 준공연도, 세대수
- **Derived**: 평당가, 전세가율, 리모델링 여부
- **Detail only**(카드에 넣지 않음): 대출 시뮬레이션, 규제 상세, 학교 상세, 리모델링 분담금, 전체 거래 이력

현재 어떤 카드도 "평당가"·"전세가율"·"리모델링 여부"를 Derived 축으로 계산해 보여주지 않는다. 리모델링 데이터는 이미 `remodeling.service.js`로 조회 가능하므로(`docs/remodeling/implementation-plan.md`), 카드 재설계 시 재사용 가능하다.

---

## 11. 지도와 목록

### 11.1 현재 상태 (실측)

`frontend/src/shared/map/mapAdapter.ts`:
```ts
interface MapAdapter {
  init(...): void
  setMarkers(points, onMarkerClick): void
  fitBounds(points): void
  destroy(): void
}
```
선택 상태(selected marker)나 highlight, `panTo` 개념이 인터페이스에 없다. `ListingSearchScreen.tsx:103-105`의 마커 클릭 핸들러는 `searchMode === 'live'`일 때만 동작하고, 등록 매물 모드에서는 클릭이 무시된다(`ComplexLocationCard`는 클릭 핸들러 자체가 없음, §10.1). 목록 hover/click이 지도에 영향을 주는 코드는 없다.

### 11.2 개선 방향 (계획만 수립)

1. `MapAdapter`에 `highlightMarker(id)`/`panTo(point)` 추가
2. `MapView`가 `selectedId` prop을 받아 하이라이트 마커 스타일 적용
3. 목록 카드에 `onHover`/`onClick` → 부모 상태(`selectedComplexId`) 갱신 → `MapView`에 전달
4. 마커 클릭 → 목록에서 해당 카드로 스크롤(`ref` + `scrollIntoView`) — 등록 매물 모드에서도 동작하도록 확장

---

## 12. 테스트 변경안

### 12.1 이번에 반영함

- `backend/tests/unit/target-regions.test.js` 신규 — helper 3종 단위테스트
- `backend/tests/unit/listings.service.test.js` — `findByPriceRange` 호출 인자에 `targetLawdCds` 추가 반영
- `backend/tests/unit/regional-listings.service.test.js` — `findByFilters` 호출 인자에 `targetLawdCds` 추가 반영
- `backend/tests/integration/listings.test.js` — "매물 4건(동탄 3+평택 1)" 기대를 "매물 3건(동탄만)"으로 수정하고, "평택은 비대상 지역이라 목록에서 제외된다" 테스트를 신설. locality/price-history/regulation 하위 테스트가 목록 API에서 평택 매물을 찾던 방식을 DB 직접 조회로 변경(목록에서 사라졌으므로)
- `backend/tests/fixtures/fixtures.sql` — 단지 3건에 `lawd_cd` 값 추가(§9.1)

### 12.2 유지함 (변경 불필요, 실측으로 확인)

`fixtures.sql`은 어떤 테스트에서도 자동 로드되지 않고 `housing_test`에 수동 적용되며, 개발 DB로 유입되는 코드 경로가 없다. 평택 edge case(`토허구역 미확정`, `셔틀 정보 없음`, `준공 20년 미만`)는 다수 통합테스트가 의존하므로 **행 자체는 그대로 유지**하고 `lawd_cd`만 채웠다.

---

## 13. 수정 예정 파일

**신규**
- `docs/search-architecture-refactor-plan.md` (본 문서)
- `backend/src/db/migrations/1788100000000_set-lawd-cd-not-null.js`
- `backend/tests/unit/target-regions.test.js`

**수정**
- `backend/src/config/target-regions.js`
- `backend/src/repositories/listings.repository.js`
- `backend/src/repositories/regional-listing-cache.repository.js`
- `backend/src/services/listings.service.js`
- `backend/src/services/regional-listings.service.js`
- `database/schema.sql`
- `backend/tests/integration/listings.test.js`
- `backend/tests/unit/listings.service.test.js`
- `backend/tests/unit/regional-listings.service.test.js`
- `backend/tests/fixtures/fixtures.sql`
- `backend/.env.example`
- `frontend/.env`

**후속 작업(이번에 실행하지 않음, §7.2·§8.2·§11.2)**
- rename 대상 28개 파일(§3.4)
- UI 카드 재설계 대상(§10.1의 4개 컴포넌트)
- 지도 동기화 대상(`mapAdapter.ts`, `MapView.tsx`, `naverMapAdapter.ts`, `ListingSearchScreen.tsx`)

---

## 14. Regression risk

1. **지역 필터가 기존 정상 데이터까지 가릴 위험**: `TARGET_REGIONS`에 새 지역을 추가할 때 `getTargetRegionCodes()`가 즉시 반영되므로 배포 시점 동기화가 중요하다. 배치 수집기 실행과 목록 API 배포 순서가 어긋나면 "수집은 됐는데 목록엔 안 보임" 현상이 생길 수 있다(단, 이는 안전한 방향의 실패다).
2. **`lawd_cd NOT NULL` 전환**: 개발 DB는 NULL 0건으로 안전하지만, 이 마이그레이션을 다른 환경(스테이징 등)에 적용하기 전에는 반드시 해당 환경의 `lawd_cd IS NULL` 행 존재 여부를 먼저 확인해야 한다. NULL 행이 있으면 마이그레이션이 즉시 실패한다(데이터 유실은 없음, 실패만 함).
3. **fixture `lawd_cd` 변경의 파급**: 위례신도시 픽스처에 `41131`을 부여했는데, 위례는 도메인상 여러 법정동에 걸친 권역(§4.1)이라 향후 `TARGET_REGIONS`가 재편되면 이 픽스처도 재검토가 필요하다.
4. **`priceRange` 등 `apartment_complexes` 집계 API는 영향 없음**: `/api/complexes`, 비교셋, 즐겨찾기는 지역 필터를 적용하지 않았다(승인된 범위 밖). 사용자가 과거에 즐겨찾기/비교셋에 추가해 둔 비대상 지역 단지는 계속 보인다 — 이는 의도된 것으로, 목록 노출과 사용자가 명시적으로 선택한 데이터는 다른 정책을 가져야 한다는 판단이다.
5. **rename 미실행에 따른 개념 혼란 지속**: §3의 `Listing`/실거래 혼용은 이번 작업으로 해소되지 않는다. 신규 기능(예: 리모델링의 `priceLink`)이 계속 이 혼동 위에 쌓일 수 있어, §7.2 마이그레이션 계획의 착수 시점을 조기에 정하는 것을 권장한다.
6. **UI/지도 재설계 미실행**: 사용자가 신고했던 "평택 노출"은 해소되지만, 카드 정보 계층 불일치와 지도-목록 비동기화는 그대로 남는다. 다음 개선 착수 시 §10~11을 그대로 인수인계 자료로 사용 가능하다.
