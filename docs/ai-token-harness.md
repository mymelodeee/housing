# AI 작업 Token-Efficient Harness

Claude Code, Codex 등 이 저장소에서 작업하는 모든 AI 코딩 도구가 공통으로 따르는 모델 선택 및 토큰 절약 규칙이다.

## Model routing

3단계만 사용한다. 복잡한 tier 체계를 만들지 않는다.

| 단계 | 사용 시점 | Effort |
|---|---|---|
| BALANCED (기본값) | 명백하지 않으면 항상 이 값을 사용 | medium |
| FAST | 단순 작업 | low |
| DEEP | 아래 승격 조건 중 하나라도 해당할 때만 | high |

DEEP으로 승격하는 조건:

- 원인이 불명확함
- frontend/backend/database 등 여러 계층을 추적해야 함
- architecture/schema/API 설계 판단이 필요함
- 일반 모델로 한 번 시도했지만 해결되지 않음

매 작업마다 모델 선택을 분석하지 않는다. 애매하면 BALANCED를 쓴다.

### Provider mapping

**Codex**

| 단계 | 모델 |
|---|---|
| FAST | Luna |
| BALANCED | Terra |
| DEEP | Sol |

**Claude**

| 단계 | 모델 |
|---|---|
| FAST | Haiku |
| BALANCED | Sonnet |
| DEEP | Opus |

## Token-saving rules

모델 선택보다 이 규칙들을 우선한다.

- 현재 working tree와 `git diff`를 source of truth로 사용한다.
- 관련 파일부터 확인한다.
- repository 전체를 재탐색하지 않는다.
- 이미 읽은 파일을 반복 탐색하지 않는다.
- 작은 작업에서는 Plan mode를 사용하지 않는다.
- 작은 작업에서는 subagent를 사용하지 않는다.
- MCP/tool은 실제로 필요한 경우에만 호출한다.
- 관련 test부터 실행한다.
- 전체 test suite는 regression risk가 큰 경우에만 실행한다.
- 동일한 실패 접근을 반복하지 않는다.
- 완료 보고는 변경사항, 파일, 검증 결과, 남은 문제만 간단히 출력한다.
