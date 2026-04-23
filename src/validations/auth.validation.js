const Joi = require('joi');

const register = {
  body: Joi.object().keys({
    name:     Joi.string().required(),
    email:    Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone:    Joi.string().optional().allow(''),
    role:     Joi.string().valid('user', 'dealer').empty(Joi.any().valid('', null)).default('user'),
  }),
};

const login = {
  body: Joi.object().keys({
    email:    Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const setRole = {
  body: Joi.object().keys({
    role: Joi.string().valid('user', 'dealer').empty(Joi.any().valid('', null)).default('user'),
  }),
};

module.exports = {
  register,
  login,
  setRole,
};
