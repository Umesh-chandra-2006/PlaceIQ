const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  COORDINATOR: 'coordinator',
  STUDENT: 'student'
};

const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx'];

const PAGINATION_DEFAULTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

module.exports = {
  ROLES,
  ALLOWED_FILE_EXTENSIONS,
  PAGINATION_DEFAULTS
};
