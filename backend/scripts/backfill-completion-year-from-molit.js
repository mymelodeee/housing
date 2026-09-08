/**
 * 준공년도(연식) 자동 보정 스크립트.
 *
 * 신규 공공API/키 없이, 이미 승인되어 사용 중인 국토교통부 아파트 매매 실거래가 API
 * (RTMSDataSvcAptTrade) 응답의 buildYear(건축년도) 필드를 단지별 매칭 거래에서 다수결로
 * 뽑아 apartment_complexes.completion_year를 보정한다.
 *
 *   node scripts/backfill-completion-year-from-molit.js --check
 *   node scripts/backfill-completion-year-from-molit.js --apply
 *
 * --check: DB를 변경하지 않고 현재값과 API 조회 결과를 비교해 보고만 한다.
 * --apply: 조회에 성공(sampleSize > 0)한 단지만 completion_year를 갱신한다.
 *          API 호출 실패(hasApiError)로 값을 얻지 못한 단지는 기존 값을 그대로 보존한다
 *          (실패를 "0건"으로 오인해 지우지 않는다).
 */
require('dotenv').config();

const apartmentComplexesRepository = require('../src/repositories/apartment-complexes.repository');
const molitPriceHistoryService = require('../src/services/molit-price-history.service');
const pool = require('../src/db/pool');

function parseArgs(argv) {
  const args = argv.slice(2);
  return { apply: args.includes('--apply') };
}

async function main() {
  const { apply } = parseArgs(process.argv);
  const complexes = await apartmentComplexesRepository.findAllWithMolitLookupInfo();

  console.log(`대상 단지 ${complexes.length}건 (lawd_cd/molit_apt_name 보유)`);

  let changed = 0;
  let unresolved = 0;
  let apiErrors = 0;

  for (const complex of complexes) {
    const { completionYear, sampleSize, hasApiError } = await molitPriceHistoryService.resolveCompletionYearFromTrades({
      lawdCd: complex.lawd_cd,
      aptName: complex.molit_apt_name
    });

    if (hasApiError && sampleSize === 0) {
      apiErrors += 1;
      console.log(`[확인 필요] id=${complex.id} ${complex.complex_name}: API 조회 실패, 기존값(${complex.completion_year ?? '없음'}) 유지`);
      continue;
    }

    if (completionYear === null) {
      unresolved += 1;
      console.log(`[정보 없음] id=${complex.id} ${complex.complex_name}: 매칭된 실거래 buildYear 없음, 기존값(${complex.completion_year ?? '없음'}) 유지`);
      continue;
    }

    if (completionYear === complex.completion_year) {
      continue;
    }

    console.log(
      `[변경] id=${complex.id} ${complex.complex_name}: ${complex.completion_year ?? '없음'} -> ${completionYear} (표본 ${sampleSize}건)`
    );
    changed += 1;

    if (apply) {
      await apartmentComplexesRepository.updateCompletionYear(complex.id, completionYear);
    }
  }

  console.log(
    `\n${apply ? '적용' : '점검'} 완료: 변경대상 ${changed}건, 정보 없음 ${unresolved}건, API 확인필요 ${apiErrors}건`
  );
  if (!apply && changed > 0) {
    console.log('실제 반영하려면 --apply 옵션으로 다시 실행하세요.');
  }
}

main()
  .catch((err) => {
    console.error('[ERROR] 준공년도 보정 실패:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
