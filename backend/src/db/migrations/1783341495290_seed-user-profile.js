exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`INSERT INTO user_profiles (id) VALUES (1);`);
};

exports.down = (pgm) => {
  pgm.sql(`DELETE FROM user_profiles WHERE id = 1;`);
};
