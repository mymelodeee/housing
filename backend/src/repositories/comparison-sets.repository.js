const pool = require('../db/pool');

async function createSetWithMembers(userProfileId, targetType, ids) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO comparison_sets (user_profile_id, target_type) VALUES ($1, $2) RETURNING *',
      [userProfileId, targetType]
    );
    const set = rows[0];
    const table = targetType === 'complex' ? 'comparison_set_complexes' : 'comparison_set_listings';
    const column = targetType === 'complex' ? 'complex_id' : 'listing_id';
    for (const id of ids) {
      await client.query(
        `INSERT INTO ${table} (comparison_set_id, ${column}) VALUES ($1, $2)`,
        [set.id, id]
      );
    }
    await client.query('COMMIT');
    return set;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function findSetsByUserProfileId(userProfileId) {
  const { rows } = await pool.query(
    `SELECT
        cs.id,
        cs.target_type,
        cs.created_at,
        COALESCE(items.item_count, 0)::int AS item_count,
        COALESCE(items.item_names, ARRAY[]::text[]) AS item_names
     FROM comparison_sets cs
     LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS item_count, array_agg(name) AS item_names
        FROM (
          SELECT ac.complex_name AS name
          FROM comparison_set_complexes csc
          JOIN apartment_complexes ac ON ac.id = csc.complex_id
          WHERE csc.comparison_set_id = cs.id
          UNION ALL
          SELECT ac.complex_name || ' ' || l.sale_price::text || '만원' AS name
          FROM comparison_set_listings csl
          JOIN listings l ON l.id = csl.listing_id
          JOIN apartment_complexes ac ON ac.id = l.complex_id
          WHERE csl.comparison_set_id = cs.id
        ) names
     ) items ON true
     WHERE cs.user_profile_id = $1
     ORDER BY cs.created_at DESC, cs.id DESC`,
    [userProfileId]
  );
  return rows;
}

async function findSetById(id) {
  const { rows } = await pool.query('SELECT * FROM comparison_sets WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findComplexIdsBySetId(id) {
  const { rows } = await pool.query('SELECT complex_id FROM comparison_set_complexes WHERE comparison_set_id = $1', [id]);
  return rows.map((r) => r.complex_id);
}

async function findListingIdsBySetId(id) {
  const { rows } = await pool.query('SELECT listing_id FROM comparison_set_listings WHERE comparison_set_id = $1', [id]);
  return rows.map((r) => r.listing_id);
}

async function countComplexMembers(setId) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM comparison_set_complexes WHERE comparison_set_id = $1', [setId]);
  return rows[0].count;
}

async function countListingMembers(setId) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM comparison_set_listings WHERE comparison_set_id = $1', [setId]);
  return rows[0].count;
}

async function addComplexMember(setId, complexId) {
  const { rows } = await pool.query(
    'INSERT INTO comparison_set_complexes (comparison_set_id, complex_id) VALUES ($1, $2) RETURNING *',
    [setId, complexId]
  );
  return rows[0];
}

async function addListingMember(setId, listingId) {
  const { rows } = await pool.query(
    'INSERT INTO comparison_set_listings (comparison_set_id, listing_id) VALUES ($1, $2) RETURNING *',
    [setId, listingId]
  );
  return rows[0];
}

module.exports = {
  createSetWithMembers, findSetsByUserProfileId, findSetById, findComplexIdsBySetId, findListingIdsBySetId,
  countComplexMembers, countListingMembers, addComplexMember, addListingMember
};
