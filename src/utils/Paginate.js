/**
 * paginate
 * Reusable pagination helper — was copy-pasted across 4 controllers.
 *
 * Usage:
 *   const { skip, limit, page } = getPaginationParams(req.query)
 *   const total = await Model.countDocuments(filter)
 *   const items = await Model.find(filter).skip(skip).limit(limit)
 *   const pagination = buildPagination(total, page, limit)
 *   res.success({ items }, 'Fetched.', 200, pagination)
 */

/**
 * Extract and validate page + limit from query string.
 * Defaults: page=1, limit=12. Max limit capped at 50.
 */
const getPaginationParams = (query = {}) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 12));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build the pagination meta object to attach to the response.
 */
const buildPagination = (total, page, limit) => ({
  total,
  page,
  limit,
  pages:    Math.ceil(total / limit),
  hasNext:  page < Math.ceil(total / limit),
  hasPrev:  page > 1,
});

module.exports = { getPaginationParams, buildPagination };