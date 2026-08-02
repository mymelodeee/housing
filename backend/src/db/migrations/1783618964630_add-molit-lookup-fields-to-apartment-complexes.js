exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE apartment_complexes
      ADD COLUMN lawd_cd varchar(5),
      ADD COLUMN molit_apt_name varchar(255);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE apartment_complexes
      DROP COLUMN IF EXISTS lawd_cd,
      DROP COLUMN IF EXISTS molit_apt_name;
  `);
};
