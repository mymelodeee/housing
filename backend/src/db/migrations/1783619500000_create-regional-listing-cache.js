exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE regional_listing_cache (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        lawd_cd varchar(5) NOT NULL,
        kapt_code varchar(20),
        complex_name varchar(255) NOT NULL,
        address varchar(255),
        exclusive_area numeric(6, 2) NOT NULL CHECK (exclusive_area > 0),
        sale_price integer NOT NULL CHECK (sale_price > 0),
        transaction_date date NOT NULL,
        household_count integer,
        latitude numeric(9, 6),
        longitude numeric(9, 6),
        collected_at timestamp NOT NULL DEFAULT now(),
        UNIQUE (lawd_cd, complex_name, exclusive_area)
    );

    CREATE INDEX idx_regional_listing_cache_sale_price ON regional_listing_cache (sale_price);
    CREATE INDEX idx_regional_listing_cache_exclusive_area ON regional_listing_cache (exclusive_area);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS regional_listing_cache CASCADE;`);
};
