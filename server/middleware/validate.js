/**
 * Simple validation middleware to check for required fields and basic data types.
 * Prevents malformed data from reaching the database.
 */
const validate = (schema) => (req, res, next) => {
  const errors = [];
  
  Object.keys(schema).forEach(key => {
    const rules = schema[key];
    const value = req.body[key];

    if (rules.required && (value === undefined || value === null || value === "")) {
      errors.push(`${key} is required`);
    }

    if (value !== undefined && value !== null) {
      if (rules.type === "number" && typeof value !== "number") {
        errors.push(`${key} must be a number`);
      }
      if (rules.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${key} must be a valid email`);
      }
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${key} must be one of: ${rules.enum.join(", ")}`);
      }
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  next();
};

module.exports = validate;
