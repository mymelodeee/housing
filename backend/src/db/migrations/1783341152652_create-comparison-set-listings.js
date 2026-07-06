exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE comparison_set_listings (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        comparison_set_id integer NOT NULL REFERENCES comparison_sets (id) ON DELETE CASCADE,
        listing_id integer NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
        UNIQUE (comparison_set_id, listing_id)
    );

    CREATE INDEX idx_comparison_set_listings_comparison_set_id ON comparison_set_listings (comparison_set_id);
    CREATE INDEX idx_comparison_set_listings_listing_id ON comparison_set_listings (listing_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS comparison_set_listings CASCADE;`);
};
