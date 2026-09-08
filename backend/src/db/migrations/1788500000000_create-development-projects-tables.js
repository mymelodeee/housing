exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE development_projects (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        complex_id integer REFERENCES apartment_complexes(id) ON DELETE SET NULL,
        lawd_cd varchar(5) NOT NULL,
        region_name varchar(50),
        project_name varchar(255) NOT NULL,
        category varchar(30) NOT NULL CHECK (category IN ('철도', '도로', '택지개발', '기타')),
        status varchar(20) NOT NULL
            CHECK (status IN ('계획', '확정', '착공', '공사중', '완료', '취소')),
        effective_date date,
        checked_at date NOT NULL,
        note text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_development_projects_complex_id ON development_projects (complex_id);

    CREATE TABLE development_project_sources (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        project_id integer NOT NULL REFERENCES development_projects(id) ON DELETE CASCADE,
        source_url text,
        source_name varchar(255),
        source_type varchar(30) NOT NULL
            CHECK (source_type IN ('고시', '공고', '보도자료', '뉴스', '기타')),
        source_date date,
        checked_at date NOT NULL,
        reliability varchar(20) NOT NULL CHECK (reliability IN ('high', 'medium', 'low')),
        is_accessible boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_development_project_sources_project_id ON development_project_sources (project_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS development_project_sources;
    DROP TABLE IF EXISTS development_projects;
  `);
};
