exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE user_profiles (
        id integer PRIMARY KEY CHECK (id = 1),
        workplace varchar(50) CHECK (workplace IS NULL OR workplace IN ('화성', '평택')),
        ownership_structure varchar(20) CHECK (ownership_structure IS NULL OR ownership_structure IN ('단독', '부부합산')),
        annual_income integer CHECK (annual_income IS NULL OR annual_income >= 0),
        annual_bonus integer CHECK (annual_bonus IS NULL OR annual_bonus >= 0),
        housing_ownership_tier varchar(20) CHECK (housing_ownership_tier IS NULL OR housing_ownership_tier IN ('무주택', '1주택', '다주택')),
        available_capital integer CHECK (available_capital IS NULL OR available_capital >= 0),
        is_first_time_buyer boolean CHECK (
            is_first_time_buyer IS NULL
            OR is_first_time_buyer = false
            OR housing_ownership_tier = '무주택'
        )
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS user_profiles CASCADE;`);
};
