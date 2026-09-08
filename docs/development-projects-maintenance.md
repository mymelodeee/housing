# 개발호재 데이터 유지보수

- 기준일: 2026-09-08
- 기본 재검증 주기: 30일

## 1. 데이터 성격

`development_projects`는 일회성 static seed가 아니라 공식 또는 신뢰 가능한 출처를 추적하는 curated dataset이다. 현재 JSON은 최초 적재와 재검증 입력 파일이며, 기존 행이 있으면 무조건 건너뛰지 않는다.

- 동일한 값: `checked_at`과 출처 확인일만 갱신한다.
- 값 변경: 기존 project와 출처 snapshot을 `development_project_history`에 보존한 뒤 current 값을 갱신한다.
- 출처 충돌: 입력에 `hasConflict: true`를 표시하고 `is_conflicted=true`만 반영한다. current 값은 자동으로 덮어쓰지 않는다.
- stale: `checked_at < CURRENT_DATE - 30`인 행이다. `npm run development:list-stale`로 재조사 대상을 확인한다.

## 2. 공공 API 적용 범위

다음 공공데이터는 자동 수집 후보지만 서로 의미와 갱신 주기가 달라 하나의 범용 collector로 합치지 않는다.

| 데이터 | 자동화 가능한 신호 | 한계 및 적용 판단 |
|---|---|---|
| [국토교통부 공간정보오픈플랫폼 WMS/WFS](https://www.data.go.kr/data/15058805/openapi.do) 및 [도시계획(도로)](https://www.data.go.kr/data/15058180/openapi.do) | 도시계획시설의 위치·종류·도형 | 계획시설 존재 여부 확인에는 적합하지만 사업의 확정·착공·완료 상태를 직접 의미하지 않는다. 후보 탐지/공간 검증용으로만 사용한다. |
| [국토교통부 주택인허가 정보](https://www.data.go.kr/dataset/15004814/openapi.do) | 승인일·착공일·사용검사일·세대수 | 주택건설사업은 관리 PK와 주소를 canonical key로 자동 갱신할 수 있다. 철도·도로·산업단지에는 적용하지 않는다. |
| [국토교통부 택지정보 지구정보이력](https://www.data.go.kr/data/15072156/fileData.do) 및 택지개발지구 WFS | 지구 지정·경계·지구정보 이력 | 하남교산 같은 택지사업의 지정/경계 검증 보조에 적합하다. 공개 파일의 갱신 시점과 사업 공정 상태는 별도로 확인해야 한다. |
| [국토교통부 산업입지도 WMS/WFS](https://www.data.go.kr/dataset/3046400/openapi.do) 및 [산업단지 일반현황](https://www.data.go.kr/data/3069733/fileData.do) | 산업단지 경계·지정일·사업기간·조성 상태 | 용인 국가산업단지의 지정/공간 범위 교차 검증에 사용할 수 있다. 개별 공사 착공일과 최신 공정은 공식 발표로 재검증한다. |
| [국토교통부 도로시설물 관리현황](https://www.data.go.kr/data/15052291/fileData.do) | 준공된 일반국도 교량·터널 등 시설물 | 연간 갱신이며 계획·공사중 도로사업 coverage가 아니므로 개발호재 자동 수집원으로 사용하지 않는다. |

자동 ingestion은 대상 지역 표본에서 project canonical key, 위치 coverage, 상태 날짜의 의미가 검증된 API별 adapter로만 추가한다. 수집 결과가 기존 curated 값과 충돌하면 자동 overwrite하지 않고 conflict review 대상으로 보낸다.

## 3. 현재 7건 분류

- **API 보조 검증 가능**: 하남교산 3기 신도시는 택지정보/택지개발지구 공간데이터, 용인 첨단시스템반도체 국가산업단지는 도시계획·산업단지 공간데이터로 위치·지정 여부를 보조 검증할 수 있다. 현재 상태·기준일은 curated source 재검증이 필요하다.
- **수동 관리 필요**: GTX-A, GTX-C, 위례신사선 3개 지역 행은 노선별 현재 사업 단계와 기준일을 안정적으로 제공하는 단일 구조화 API가 없어 국토교통부·지자체·사업시행자 공식 발표를 우선 확인한다.
- **현재 seed에만 존재하는 current 값**: 7개 행 모두 아직 자동 collector가 없으므로 project status/effective date의 current 값은 curated JSON과 DB에만 있다. API 후보는 자동 대체가 아니라 교차 검증 수단이다.

## 4. 운영 절차

1. `npm run development:list-stale`로 30일 초과 항목만 조회한다.
2. 공식 source를 우선 확인하고 `source_url`, `source_name`, `source_date`, `checked_at`, `status`, `confidence`를 갱신한다.
3. 값이 같으면 `npm run development:apply`로 확인일만 갱신한다.
4. 값이 바뀌면 같은 명령으로 history snapshot을 남기고 current를 갱신한다.
5. 동급 출처가 충돌하면 `hasConflict: true`로 기록해 자동 덮어쓰기를 막고 사람이 판단한다.
