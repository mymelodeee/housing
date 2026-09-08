exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE market_interest_rates (
        id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        rate_percent numeric(5,2) NOT NULL,
        reference_period varchar(20) NOT NULL,
        source_name varchar(255) NOT NULL,
        source_url text,
        checked_at date NOT NULL,
        updated_at timestamp NOT NULL DEFAULT now()
    );

    INSERT INTO market_interest_rates (id, rate_percent, reference_period, source_name, source_url, checked_at)
    VALUES (
        1,
        4.48,
        '2026-07',
        '한국은행 금융기관 가중평균금리(예금은행 신규취급액 기준 주택담보대출)',
        'https://www.bok.or.kr/portal/main/main.do',
        '2026-09-08'
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TABLE market_interest_rates;');
};
