// 조정대상지역/투기과열지구가 하나의 is_regulated_area boolean으로 합쳐져 있어 어떤 규제가
// 실제로 적용된 것인지 구분할 수 없던 문제를 해소한다(2026-09-10 [대출/자금] 탭 감사).
// is_regulated_area는 LTV/대출한도 계산의 기존 입력값으로 그대로 유지하되(호출부 변경 없음),
// CHECK 제약으로 항상 두 세부 플래그의 논리합과 일치하도록 강제해 값이 어긋날 수 없게 한다.
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE apartment_complexes
      ADD COLUMN is_adjustment_target_area boolean NOT NULL DEFAULT false,
      ADD COLUMN is_speculative_overheated_area boolean NOT NULL DEFAULT false;

    UPDATE apartment_complexes
    SET is_adjustment_target_area = is_regulated_area,
        is_speculative_overheated_area = is_regulated_area;

    ALTER TABLE apartment_complexes
      ADD CONSTRAINT apartment_complexes_regulated_area_consistency
      CHECK (is_regulated_area = (is_adjustment_target_area OR is_speculative_overheated_area));
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE apartment_complexes
      DROP CONSTRAINT apartment_complexes_regulated_area_consistency,
      DROP COLUMN is_adjustment_target_area,
      DROP COLUMN is_speculative_overheated_area;
  `);
};
