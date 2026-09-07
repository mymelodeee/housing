exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE remodeling_projects (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        complex_id integer REFERENCES apartment_complexes(id) ON DELETE SET NULL,
        lawd_cd varchar(5) NOT NULL,
        complex_name varchar(255) NOT NULL,
        region_name varchar(50),
        project_name varchar(255),
        is_active boolean NOT NULL DEFAULT true,
        last_checked_at date NOT NULL,
        note text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        UNIQUE (lawd_cd, complex_name)
    );

    CREATE INDEX idx_remodeling_projects_complex_id ON remodeling_projects (complex_id);
    CREATE INDEX idx_remodeling_projects_last_checked_at ON remodeling_projects (last_checked_at);

    CREATE TABLE remodeling_sources (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        project_id integer NOT NULL REFERENCES remodeling_projects(id) ON DELETE CASCADE,
        source_url text,
        source_name varchar(255),
        source_title varchar(500),
        source_type varchar(30) NOT NULL
            CHECK (source_type IN ('고시', '공고', '조합공지', '지자체보도', '뉴스', '커뮤니티', '기타')),
        source_date date,
        checked_at date NOT NULL,
        reliability varchar(20) NOT NULL CHECK (reliability IN ('high', 'medium', 'low')),
        is_accessible boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_remodeling_sources_project_id ON remodeling_sources (project_id);

    CREATE TABLE remodeling_facts (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        project_id integer NOT NULL REFERENCES remodeling_projects(id) ON DELETE CASCADE,
        field_name varchar(50) NOT NULL,
        field_key varchar(50),
        value text NOT NULL,
        value_numeric numeric,
        unit varchar(20),
        value_status varchar(20) NOT NULL
            CHECK (value_status IN ('confirmed', 'estimated', 'proposal', 'unknown')),
        effective_date date,
        checked_at date NOT NULL,
        source_id integer REFERENCES remodeling_sources(id) ON DELETE SET NULL,
        confidence varchar(20) NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
        is_current boolean NOT NULL DEFAULT true,
        is_conflicted boolean NOT NULL DEFAULT false,
        superseded_at timestamp,
        created_at timestamp NOT NULL DEFAULT now()
    );

    CREATE UNIQUE INDEX idx_remodeling_facts_current_unique
        ON remodeling_facts (project_id, field_name, COALESCE(field_key, ''))
        WHERE is_current;
    CREATE INDEX idx_remodeling_facts_project_current ON remodeling_facts (project_id, is_current);
    CREATE INDEX idx_remodeling_facts_checked_at ON remodeling_facts (checked_at);

    CREATE TABLE remodeling_project_history (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        project_id integer NOT NULL REFERENCES remodeling_projects(id) ON DELETE CASCADE,
        stage varchar(30) NOT NULL
            CHECK (stage IN ('추진위원회', '조합설립인가', '안전진단', '건축심의', '사업계획승인', '이주', '착공', '준공', '중단')),
        effective_date date,
        status varchar(20) NOT NULL CHECK (status IN ('confirmed', 'estimated', 'proposal', 'unknown')),
        source_id integer REFERENCES remodeling_sources(id) ON DELETE SET NULL,
        checked_at date NOT NULL,
        note text,
        UNIQUE (project_id, stage)
    );

    CREATE INDEX idx_remodeling_project_history_project_id ON remodeling_project_history (project_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS remodeling_project_history CASCADE;
    DROP TABLE IF EXISTS remodeling_facts CASCADE;
    DROP TABLE IF EXISTS remodeling_sources CASCADE;
    DROP TABLE IF EXISTS remodeling_projects CASCADE;
  `);
};
