const Joi = require('joi');

const updateUserRole = {
  params: Joi.object().keys({
    id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'Invalid user ID format.',
    }),
  }),
  body: Joi.object().keys({
    role: Joi.string().valid('user', 'dealer', 'admin').required(),
  }),
};

module.exports = {
  updateUserRole,
};
