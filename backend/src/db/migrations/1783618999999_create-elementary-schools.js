exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE elementary_schools (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        school_name varchar(255) NOT NULL,
        latitude numeric(9, 6) NOT NULL,
        longitude numeric(9, 6) NOT NULL,
        address varchar(255) NOT NULL
    );

    CREATE INDEX idx_elementary_schools_lat_lng ON elementary_schools (latitude, longitude);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS elementary_schools CASCADE;`);
};
