const express = require('express');
const router  = express.Router();
const {
  searchVehicles, getVehicleById,
  getBrands, getBodyTypes, createVehicle,
} = require('../controllers/vehicle.controller');
const validate = require('../middleware/validate.middleware');
const vehicleValidation = require('../validations/vehicle.validation');

// ⚠️  Specific named routes before /:id
/**
 * @swagger
 * /api/vehicles/brands:
 *   get:
 *     summary: Get a list of all vehicle brands
 *     tags: [Vehicles]
 *     responses:
 *       200:
 *         description: List of vehicle brands
 */
router.get('/brands',     getBrands);

/**
 * @swagger
 * /api/vehicles/body-types:
 *   get:
 *     summary: Get a list of all vehicle body types
 *     tags: [Vehicles]
 *     responses:
 *       200:
 *         description: List of vehicle body types
 */
router.get('/body-types', getBodyTypes);

// Public knowledge base
/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Search for vehicles in the knowledge base
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *       - in: query
 *         name: bodyType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of vehicles
 */
router.get('/',    validate(vehicleValidation.searchVehicles), searchVehicles);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get vehicle details by ID
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle details
 */
router.get('/:id', getVehicleById);

// Seed — protect with admin key in production
/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Create a new vehicle in the knowledge base (Admin)
 *     tags: [Vehicles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brand
 *               - model
 *             properties:
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               bodyType:
 *                 type: string
 *               year:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 */
router.post('/', validate(vehicleValidation.createVehicle), createVehicle);

module.exports = router;