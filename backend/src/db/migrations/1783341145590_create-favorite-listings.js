exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE favorite_listings (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_profile_id integer NOT NULL REFERENCES user_profiles (id),
        listing_id integer NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
        registered_at timestamp NOT NULL DEFAULT now(),
        UNIQUE (user_profile_id, listing_id)
    );

    CREATE INDEX idx_favorite_listings_user_profile_id ON favorite_listings (user_profile_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS favorite_listings CASCADE;`);
};
