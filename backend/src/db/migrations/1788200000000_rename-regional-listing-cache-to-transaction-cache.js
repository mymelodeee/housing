exports.shorthands = undefined;

// "listing"(매물)이라는 이름이 실제로는 국토부 과거 실거래 캐시를 가리켜 개념을 혼동시킨다는
// 문제(docs/search-architecture-refactor-plan.md §3.3, .claude/plans의 §14.5)를 해소하기 위한 rename.
// 개인용 단일 사용자 앱이라 뷰 병행 등 무중단 절차 없이 한 번에 rename한다.
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE regional_listing_cache RENAME TO regional_transaction_cache;
    ALTER TABLE regional_transaction_cache RENAME CONSTRAINT regional_listing_cache_pkey TO regional_transaction_cache_pkey;
    ALTER TABLE regional_transaction_cache RENAME CONSTRAINT regional_listing_cache_lawd_cd_complex_name_exclusive_area_key TO regional_transaction_cache_lawd_cd_complex_name_excl_area_key;
    ALTER INDEX idx_regional_listing_cache_sale_price RENAME TO idx_regional_transaction_cache_sale_price;
    ALTER INDEX idx_regional_listing_cache_exclusive_area RENAME TO idx_regional_transaction_cache_exclusive_area;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE regional_transaction_cache RENAME TO regional_listing_cache;
    ALTER TABLE regional_listing_cache RENAME CONSTRAINT regional_transaction_cache_pkey TO regional_listing_cache_pkey;
    ALTER TABLE regional_listing_cache RENAME CONSTRAINT regional_transaction_cache_lawd_cd_complex_name_excl_area_key TO regional_listing_cache_lawd_cd_complex_name_exclusive_area_key;
    ALTER INDEX idx_regional_transaction_cache_sale_price RENAME TO idx_regional_listing_cache_sale_price;
    ALTER INDEX idx_regional_transaction_cache_exclusive_area RENAME TO idx_regional_listing_cache_exclusive_area;
  `);
};
