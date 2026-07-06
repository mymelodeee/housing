exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE comparison_set_complexes (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        comparison_set_id integer NOT NULL REFERENCES comparison_sets (id) ON DELETE CASCADE,
        complex_id integer NOT NULL REFERENCES apartment_complexes (id) ON DELETE CASCADE,
        UNIQUE (comparison_set_id, complex_id)
    );

    CREATE INDEX idx_comparison_set_complexes_comparison_set_id ON comparison_set_complexes (comparison_set_id);
    CREATE INDEX idx_comparison_set_complexes_complex_id ON comparison_set_complexes (complex_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS comparison_set_complexes CASCADE;`);
};
