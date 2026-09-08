exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE development_projects
      ADD COLUMN confidence varchar(20) NOT NULL DEFAULT 'medium'
        CHECK (confidence IN ('high', 'medium', 'low')),
      ADD COLUMN is_conflicted boolean NOT NULL DEFAULT false;

    CREATE INDEX idx_development_projects_checked_at
      ON development_projects (checked_at);

    CREATE UNIQUE INDEX idx_development_project_sources_project_url
      ON development_project_sources (project_id, source_url)
      WHERE source_url IS NOT NULL;

    CREATE TABLE development_project_history (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        project_id integer NOT NULL REFERENCES development_projects(id) ON DELETE CASCADE,
        region_name varchar(50),
        category varchar(30) NOT NULL,
        status varchar(20) NOT NULL,
        effective_date date,
        checked_at date NOT NULL,
        confidence varchar(20) NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
        is_conflicted boolean NOT NULL,
        note text,
        sources_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
        change_reason varchar(50) NOT NULL,
        superseded_at timestamp NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_development_project_history_project_id
      ON development_project_history (project_id, superseded_at DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS development_project_history;
    DROP INDEX IF EXISTS idx_development_project_sources_project_url;
    DROP INDEX IF EXISTS idx_development_projects_checked_at;
    ALTER TABLE development_projects
      DROP COLUMN IF EXISTS is_conflicted,
      DROP COLUMN IF EXISTS confidence;
  `);
};
