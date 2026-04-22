const Joi = require('joi');

const searchVehicles = {
  query: Joi.object().keys({
    brand:    Joi.string().optional(),
    model:    Joi.string().optional(),
    bodyType: Joi.string().optional(),
    fuelType: Joi.string().optional(),
    search:   Joi.string().optional(),
    page:     Joi.number().integer().min(1).optional(),
    limit:    Joi.number().integer().min(1).optional(),
  }),
};

const createVehicle = {
  body: Joi.object().keys({
    brand:        Joi.string().required(),
    model:        Joi.string().required(),
    bodyType:     Joi.string().optional(),
    fuelType:     Joi.string().optional(),
    transmission: Joi.string().optional(),
    engineSize:   Joi.string().optional(),
    description:  Joi.string().optional(),
    image:        Joi.string().optional(),
  }),
};

module.exports = {
  searchVehicles,
  createVehicle,
};
