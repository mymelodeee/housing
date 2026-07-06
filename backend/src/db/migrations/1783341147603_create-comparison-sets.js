exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE comparison_sets (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_profile_id integer NOT NULL REFERENCES user_profiles (id),
        target_type varchar(10) NOT NULL CHECK (target_type IN ('complex', 'listing')),
        created_at timestamp NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_comparison_sets_user_profile_id ON comparison_sets (user_profile_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS comparison_sets CASCADE;`);
};
