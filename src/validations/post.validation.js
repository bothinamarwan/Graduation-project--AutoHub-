const Joi = require('joi');

const createPost = {
  body: Joi.object().keys({
    title:        Joi.string().required(),
    description:  Joi.string().required(),
    brand:        Joi.string().required(),
    model:        Joi.string().required(),
    bodyType:     Joi.string().optional(),
    year:         Joi.number().integer().optional(),
    mileage:      Joi.number().optional(),
    price:        Joi.number().required(),
    currency:     Joi.string().optional(),
    condition:    Joi.string().valid('New', 'Used', 'Certified Pre-Owned').optional(),
    color:        Joi.string().optional(),
    transmission: Joi.string().optional(),
    fuelType:     Joi.string().optional(),
    contactPhone: Joi.string().required(),
    // images will be handled by multer
  }),
};

const updatePost = {
  params: Joi.object().keys({
    id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  }),
  body: Joi.object().keys({
    title:        Joi.string().optional(),
    description:  Joi.string().optional(),
    brand:        Joi.string().optional(),
    model:        Joi.string().optional(),
    bodyType:     Joi.string().optional(),
    year:         Joi.number().integer().optional(),
    mileage:      Joi.number().optional(),
    price:        Joi.number().optional(),
    currency:     Joi.string().optional(),
    condition:    Joi.string().valid('New', 'Used', 'Certified Pre-Owned').optional(),
    color:        Joi.string().optional(),
    transmission: Joi.string().optional(),
    fuelType:     Joi.string().optional(),
    contactPhone: Joi.string().optional(),
  }).min(1),
};

const getPost = {
  params: Joi.object().keys({
    id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  }),
};

module.exports = {
  createPost,
  updatePost,
  getPost,
};
