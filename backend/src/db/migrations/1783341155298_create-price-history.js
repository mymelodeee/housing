exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE price_history (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        complex_id integer NOT NULL REFERENCES apartment_complexes (id) ON DELETE CASCADE,
        transaction_date date NOT NULL CHECK (transaction_date <= CURRENT_DATE),
        transaction_price integer NOT NULL CHECK (transaction_price > 0),
        data_source varchar(255) NOT NULL DEFAULT '국토교통부 아파트 실거래가 공개시스템(오픈API)'
            CHECK (data_source = '국토교통부 아파트 실거래가 공개시스템(오픈API)'),
        lookup_period_type varchar(20) NOT NULL CHECK (lookup_period_type IN ('최근 20년', '최초거래 이후'))
    );

    CREATE INDEX idx_price_history_complex_id ON price_history (complex_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS price_history CASCADE;`);
};
