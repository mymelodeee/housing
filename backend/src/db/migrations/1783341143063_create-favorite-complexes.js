exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE favorite_complexes (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_profile_id integer NOT NULL REFERENCES user_profiles (id),
        complex_id integer NOT NULL REFERENCES apartment_complexes (id) ON DELETE CASCADE,
        registered_at timestamp NOT NULL DEFAULT now(),
        UNIQUE (user_profile_id, complex_id)
    );

    CREATE INDEX idx_favorite_complexes_user_profile_id ON favorite_complexes (user_profile_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS favorite_complexes CASCADE;`);
};
