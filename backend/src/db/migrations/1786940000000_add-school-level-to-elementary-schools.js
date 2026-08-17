exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE elementary_schools
      ADD COLUMN school_level varchar(20) NOT NULL DEFAULT '초등학교';

    CREATE INDEX idx_elementary_schools_school_level ON elementary_schools (school_level);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_elementary_schools_school_level;
    ALTER TABLE elementary_schools DROP COLUMN IF EXISTS school_level;
  `);
};
