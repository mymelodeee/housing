exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE apartment_complexes (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        complex_name varchar(255) NOT NULL,
        latitude numeric(9, 6) NOT NULL,
        longitude numeric(9, 6) NOT NULL,
        address varchar(255) NOT NULL,
        completion_year integer NOT NULL CHECK (completion_year BETWEEN 1970 AND EXTRACT(YEAR FROM CURRENT_DATE)),
        remodeling_status varchar(20) NOT NULL DEFAULT '해당없음'
            CHECK (remodeling_status IN ('해당없음', '추진중', '완료')),
        remodeling_completion_year integer CHECK (
            remodeling_completion_year IS NULL
            OR (remodeling_status = '완료' AND remodeling_completion_year BETWEEN 1970 AND EXTRACT(YEAR FROM CURRENT_DATE))
        ),
        reconstruction_status varchar(20) NOT NULL DEFAULT '해당없음'
            CHECK (reconstruction_status IN ('해당없음', '추진위원회', '조합설립인가', '사업시행인가', '관리처분인가', '이주철거중', '착공')),
        nearby_redevelopment_info text,
        is_regulated_area boolean NOT NULL DEFAULT false,
        is_land_transaction_permission_zone boolean,
        nearest_shuttle_stop_name varchar(255),
        nearest_shuttle_stop_distance integer CHECK (nearest_shuttle_stop_distance IS NULL OR nearest_shuttle_stop_distance >= 0),
        shuttle_commute_minutes integer CHECK (shuttle_commute_minutes IS NULL OR shuttle_commute_minutes >= 0),
        locality_attributes jsonb
    );

    CREATE INDEX idx_apartment_complexes_is_regulated_area ON apartment_complexes (is_regulated_area);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS apartment_complexes CASCADE;`);
};
