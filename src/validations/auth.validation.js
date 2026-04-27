const Joi = require('joi');



const registerUser = {
  body: Joi.object().keys({
    name:            Joi.string().required(),
    email:           Joi.string().email().required(),
    password:        Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({ 'any.only': 'Passwords do not match' }),
  }),
};

const registerDealer = {
  body: Joi.object().keys({
    name:            Joi.string().required(),
    email:           Joi.string().email().required(),
    password:        Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({ 'any.only': 'Passwords do not match' }),
    location:        Joi.string().required(),
    phone:           Joi.string().required(),
    whatsapp:        Joi.string().required(),
    taxNumber:       Joi.string().required(),
  }),
};

const login = {
  body: Joi.object().keys({
    email:    Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};



module.exports = {
  registerUser,
  registerDealer,
  login,
};
