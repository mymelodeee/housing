exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE apartment_complexes
      ALTER COLUMN lawd_cd SET NOT NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE apartment_complexes
      ALTER COLUMN lawd_cd DROP NOT NULL;
  `);
};
