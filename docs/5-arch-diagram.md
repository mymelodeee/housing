# housing 기술 아키텍처 다이어그램

- 버전: v0.5
- 최종 수정일: 2026-07-06
- 참조 문서: [1-domain-definition.md](./1-domain-definition.md) (v0.6), [2-prd.md](./2-prd.md) (v0.5), [3-user-scenario.md](./3-user-scenario.md) (v0.4), [4-project-principle.md](./4-project-principle.md) (v0.4)
- 버전 관리 규칙: 본 문서를 수정할 때마다 상단 버전(v0.1 → v0.2 …)과 최종 수정일을 함께 갱신한다. 과거 버전 이력은 별도 변경이력 절에 누적 기록한다.

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v0.1 | 2026-07-05 | 최초 초안 작성 (전체 시스템 구성도, 백엔드/프론트엔드 레이어 다이어그램, F6 핵심 흐름 시퀀스 다이어그램) |
| v0.2 | 2026-07-05 | 정합성 검토 반영: 참조 문서 버전 갱신(PRD v0.3, 사용자 시나리오 v0.2, 구조원칙 v0.2) / 국토교통부 실거래가 출처 표기를 "국토교통부 아파트 실거래가 공개시스템(오픈API)"으로 통일 |
| v0.3 | 2026-07-05 | 참조 문서 버전 재갱신(도메인 v0.5, PRD v0.4, 사용자 시나리오 v0.3, 구조원칙 v0.3) |
| v0.4 | 2026-07-05 | 참조 문서 버전 재갱신(도메인 v0.6, PRD v0.5, 사용자 시나리오 v0.4, 구조원칙 v0.4) |
| v0.5 | 2026-07-06 | 로컬 개발 환경에 실제 설치된 버전 확인 결과를 반영해 대상 DB 버전을 PostgreSQL 17 → 18.4로 정정(§1 시스템 구성도) |

---

## 0. 문서 목적 및 범위

본 문서는 1~4번 문서에서 확정된 기술 스택과 구조 원칙을 mermaid 다이어그램으로 시각화한다. `4-project-principle.md` §1의 오버엔지니어링 금지 원칙을 그대로 따라, 이 앱이 **인증 없는 개인용 단일 사용자 웹앱(F1~F7)** 임을 전제로 최대한 단순한 구조만 그린다. 마이크로서비스, 다중 서버, 별도 캐시 레이어, 메시지 큐 등은 실제로 사용하지 않으므로 다이어그램에도 포함하지 않는다.

이 문서는 DB 스키마 전체와 API 명세 전체를 다루지 않는다(범위 밖). 상세 내용은 `4-project-principle.md`와 후속 `docs/7-execution-plan.md`를 참조한다.

---

## 1. 전체 시스템 구성도

브라우저에서 동작하는 React SPA가 Express API 서버 하나와 통신하고, 이 서버가 PostgreSQL 18.4 및 외부 데이터 소스(국토교통부 실거래가 API, 지도, 삼성전자 셔틀 포털)와 연동하는 가장 단순한 형태의 구성이다. 별도 앱 서버 분리, 캐시 서버, 큐 없이 서버 한 대가 모든 API를 처리한다.

```mermaid
flowchart LR
    User["사용자(웹/모바일 브라우저)"] --> SPA["React 19 SPA\n(반응형 웹 UI)"]
    SPA -->|"REST API 호출(HTTPS)"| API["Express API 서버\n(Node.js)"]
    API -->|"SQL(pg)"| DB[("PostgreSQL 18.4")]

    API -->|"실거래가 조회(F7)"| MOLIT["국토교통부\n아파트 실거래가 공개시스템(오픈API)"]
    SPA -->|"지도 UI 렌더링(F1)"| MAP["네이버지도\n(약관 제약 시 구글맵 대체)"]
    API -->|"셔틀 배차 정보 확보(F1)"| SBUS["삼성전자 통근버스 포털\n(sbus.u-vis.com, 수동 조사/옵션 처리)"]
```

---

## 2. 백엔드 레이어 다이어그램

`4-project-principle.md` §2.3에서 정의한 `routes → controllers → services → repositories → db` 단방향 의존 구조를 그대로 표현한다. SQL 문자열은 `repositories` 계층에만 존재하며, `services`는 순수 계산 로직(LTV/DSR/PMT 등)만 담당해 DB를 알지 못한다.

```mermaid
flowchart TD
    routes["routes\n(URL ↔ 컨트롤러 매핑, 로직 없음)"]
    controllers["controllers\n(요청 파싱 · 응답 형식화, 트랜잭션 경계)"]
    services["services\n(도메인 규칙: LTV/DSR/PMT 계산, 규제 판단 등 순수 로직)"]
    repositories["repositories\n(raw SQL 격리, pg Pool/Client 쿼리 실행)"]
    db[("db\n(pg Pool 설정 · 커넥션 관리)")]

    routes --> controllers --> services --> repositories --> db
```

---

## 3. 프론트엔드 레이어 다이어그램

`4-project-principle.md` §2.2에서 정의한 `components → hooks → (zustand / tanstack query) → api client → backend` 의존 방향을 표현한다. zustand는 서버에 없는 순수 클라이언트 상태(필터 UI, 비교셋 선택 등)만 담당하고, tanstack query는 서버 데이터(매물/즐겨찾기/대출계산 등)의 fetch·캐싱을 전담하며, 실제 HTTP 호출은 api client 계층에만 존재한다.

```mermaid
flowchart TD
    components["components\n(화면/프레젠테이션)"]
    hooks["hooks\n(화면별 로직 조합: zustand + tanstack query 호출 조합)"]
    zustand["zustand store\n(클라이언트 전용 상태: UI 상태, 비교셋 선택 등)"]
    tanstack["tanstack query\n(서버 상태: 매물/즐겨찾기/대출계산 등 캐싱)"]
    apiClient["api client\n(fetch 래퍼: baseURL, 공통 에러 처리)"]
    backend["backend REST API"]

    components --> hooks
    hooks --> zustand
    hooks --> tanstack
    zustand --> apiClient
    tanstack --> apiClient
    apiClient --> backend
```

---

## 4. 핵심 유스케이스 흐름 - F6 대출 시뮬레이션

가장 대표적인 흐름 하나만 표현한다: 사용자가 "내 정보"(재무 프로필)를 입력해 저장하고, 이후 매물 상세 화면에서 대출 시뮬레이션 결과를 조회하는 흐름이다(도메인 §3.6, PRD F6, 시나리오 6-1 기준). 다른 유스케이스(F1~F5, F7)는 단순화 지시에 따라 생략한다.

```mermaid
sequenceDiagram
    actor U as 사용자
    participant C as 컴포넌트(내 정보 화면)
    participant H as hooks(useUserProfile 등)
    participant A as api client
    participant S as Express API\n(routes→controllers→services→repositories)
    participant D as PostgreSQL

    U->>C: "내 정보" 입력(소득/성과금/자본금/주택보유구분)
    C->>H: 저장 요청
    H->>A: 프로필 저장 호출
    A->>S: PUT /api/user-profile
    S->>D: 사용자 프로필 저장(단일 레코드)
    D-->>S: 저장 완료
    S-->>A: 200 OK
    A-->>H: 저장 결과 반환
    H-->>C: 저장 완료 반영(tanstack query 캐시 갱신)

    U->>C: 매물 상세 화면 진입(대출 시뮬레이션 탭)
    C->>H: 대출 시뮬레이션 조회 요청
    H->>A: 대출 계산 호출
    A->>S: GET /api/listings/:id/loan-simulation
    S->>D: 저장된 사용자 프로필 조회
    D-->>S: 프로필 값 반환
    Note over S: services에서 LTV/DSR/PMT 계산\n(부부합산 vs 단독명의 비교)
    S-->>A: 시나리오별 대출가능금액·상환액 응답
    A-->>H: 결과 반환
    H-->>C: 대출 시뮬레이션 결과 렌더링
    C-->>U: 유리한 시나리오 안내 표시
```

---

## 5. 범위 밖(Out of Scope) 명시

본 문서는 다이어그램과 최소 설명만을 다룬다. DB 스키마 전체, API 명세 전체, UI 와이어프레임/목업, 실제 코드 구현은 포함하지 않으며 `4-project-principle.md`와 후속 `docs/7-execution-plan.md`, `swagger/swagger.json`에서 다룬다. F1~F5·F7의 개별 시퀀스 다이어그램은 오버엔지니어링 금지 원칙에 따라 이번 버전에서 그리지 않는다.
