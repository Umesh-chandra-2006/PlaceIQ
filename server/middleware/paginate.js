const { PAGINATION_DEFAULTS } = require("../config/constants");

/**
 * Reusable pagination middleware.
 * Attaches pagination options (page, limit, skip) to the request object.
 */
const paginate = (
  defaultLimit = PAGINATION_DEFAULTS.DEFAULT_LIMIT, 
  maxLimit = PAGINATION_DEFAULTS.MAX_LIMIT
) => (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit) || defaultLimit));
  
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };
  
  next();
};

module.exports = paginate;
