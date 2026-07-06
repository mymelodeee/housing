exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE listings (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        complex_id integer NOT NULL REFERENCES apartment_complexes (id) ON DELETE CASCADE,
        sale_price integer NOT NULL CHECK (sale_price BETWEEN 70000 AND 150000),
        exclusive_area numeric(6, 2) NOT NULL CHECK (exclusive_area > 0)
    );

    CREATE INDEX idx_listings_complex_id ON listings (complex_id);
    CREATE INDEX idx_listings_sale_price ON listings (sale_price);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS listings CASCADE;`);
};
