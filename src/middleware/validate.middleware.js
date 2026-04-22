const Joi = require('joi');

/**
 * validate middleware
 * @param {Object} schema - Joi schema object containing body, query, and/or params
 */
const validate = (schema) => (req, res, next) => {
  const validSchema = {};
  const object = {};

  // Pick relevant parts of the request based on the schema
  ['body', 'query', 'params'].forEach((key) => {
    if (schema[key]) {
      validSchema[key] = schema[key];
      object[key] = req[key];
    }
  });

  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return res.fail(errorMessage, 400, error.details);
  }

  Object.assign(req, value);
  return next();
};

module.exports = validate;
