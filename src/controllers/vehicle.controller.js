const Vehicle        = require('../models/Vehicle');
const asyncHandler   = require('../utils/asyncHandler');
const { getPaginationParams, buildPagination } = require('../utils/Paginate');

// GET /api/vehicles
const searchVehicles = asyncHandler(async (req, res) => {
  const { brand, model, bodyType, fuelType, search } = req.query;
  const { page, limit, skip } = getPaginationParams(req.query);

  const filter = {};
  if (brand)    filter.brand    = new RegExp(brand, 'i');
  if (model)    filter.model    = new RegExp(model, 'i');
  if (bodyType) filter.bodyType = bodyType;
  if (fuelType) filter.fuelType = fuelType;
  if (search)   filter.$text    = { $search: search };

  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter).sort({ brand: 1, model: 1 }).skip(skip).limit(limit).lean(),
    Vehicle.countDocuments(filter),
  ]);

  res.success({ vehicles }, 'Vehicles fetched.', 200, buildPagination(total, page, limit));
});

// GET /api/vehicles/:id
const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.fail('Vehicle not found.', 404);
  res.success({ vehicle });
});

// GET /api/vehicles/brands
const getBrands = asyncHandler(async (req, res) => {
  const brands = await Vehicle.distinct('brand');
  res.success({ brands: brands.sort() });
});

// GET /api/vehicles/body-types
const getBodyTypes = asyncHandler(async (req, res) => {
  const bodyTypes = await Vehicle.distinct('bodyType');
  res.success({ bodyTypes });
});

// POST /api/vehicles  (seed)
const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.create(req.body);
  res.created({ vehicle }, 'Vehicle added to knowledge base.');
});

module.exports = { searchVehicles, getVehicleById, getBrands, getBodyTypes, createVehicle };