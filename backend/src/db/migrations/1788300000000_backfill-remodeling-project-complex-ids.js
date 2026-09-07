exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE apartment_complexes
      ALTER COLUMN completion_year DROP NOT NULL;

    WITH mappings(project_complex_name, lawd_cd, cache_complex_name) AS (
      VALUES
        ('수지초입마을아파트', '41465', '풍림아파트'),
        ('신성신안쌍용진흥아파트', '41117', '신나무실신성'),
        ('벽적골주공8단지', '41117', '벽적골주공휴먼시아8단지'),
        ('벽적골 두산우성한신아파트', '41117', '벽적골두산')
    ),
    cache_targets AS (
      SELECT DISTINCT ON (m.project_complex_name, m.lawd_cd)
             m.project_complex_name, m.lawd_cd, c.complex_name, c.address,
             c.latitude, c.longitude
      FROM mappings m
      JOIN regional_transaction_cache c
        ON c.lawd_cd = m.lawd_cd
       AND c.complex_name = m.cache_complex_name
      ORDER BY m.project_complex_name, m.lawd_cd, c.transaction_date DESC, c.id DESC
    )
    INSERT INTO apartment_complexes
      (complex_name, latitude, longitude, address, completion_year, lawd_cd, molit_apt_name)
    SELECT ct.complex_name, ct.latitude, ct.longitude, ct.address, NULL, ct.lawd_cd, ct.complex_name
    FROM cache_targets ct
    WHERE NOT EXISTS (
      SELECT 1
      FROM apartment_complexes ac
      WHERE ac.lawd_cd = ct.lawd_cd
        AND ac.address = ct.address
    );

    WITH mappings(project_complex_name, lawd_cd, cache_complex_name) AS (
      VALUES
        ('수지초입마을아파트', '41465', '풍림아파트'),
        ('신성신안쌍용진흥아파트', '41117', '신나무실신성'),
        ('벽적골주공8단지', '41117', '벽적골주공휴먼시아8단지'),
        ('벽적골 두산우성한신아파트', '41117', '벽적골두산')
    ),
    cache_targets AS (
      SELECT DISTINCT ON (m.project_complex_name, m.lawd_cd)
             m.project_complex_name, m.lawd_cd, c.address
      FROM mappings m
      JOIN regional_transaction_cache c
        ON c.lawd_cd = m.lawd_cd
       AND c.complex_name = m.cache_complex_name
      ORDER BY m.project_complex_name, m.lawd_cd, c.transaction_date DESC, c.id DESC
    ),
    resolved_targets AS (
      SELECT ct.project_complex_name, ct.lawd_cd,
             (
               SELECT ac.id
               FROM apartment_complexes ac
               WHERE ac.lawd_cd = ct.lawd_cd
                 AND ac.address = ct.address
               ORDER BY ac.id
               LIMIT 1
             ) AS complex_id
      FROM cache_targets ct
    )
    UPDATE remodeling_projects rp
    SET complex_id = rt.complex_id,
        updated_at = now()
    FROM resolved_targets rt
    WHERE rp.complex_id IS NULL
      AND rp.lawd_cd = rt.lawd_cd
      AND rp.complex_name = rt.project_complex_name
      AND rt.complex_id IS NOT NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    UPDATE remodeling_projects
    SET complex_id = NULL,
        updated_at = now()
    WHERE (lawd_cd, complex_name) IN (
      ('41465', '수지초입마을아파트'),
      ('41117', '신성신안쌍용진흥아파트'),
      ('41117', '벽적골주공8단지'),
      ('41117', '벽적골 두산우성한신아파트')
    );
  `);
};
