exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE apartment_complexes
      ADD COLUMN household_count integer CHECK (household_count IS NULL OR household_count > 0),
      ADD COLUMN building_count integer CHECK (building_count IS NULL OR building_count > 0);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE apartment_complexes
      DROP COLUMN IF EXISTS household_count,
      DROP COLUMN IF EXISTS building_count;
  `);
};
