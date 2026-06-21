const express = require('express');
const router  = express.Router();
const {
  searchVehicles, getVehicleById,
  getBrands, getBodyTypes, createVehicle,
} = require('../controllers/vehicle.controller');
const validate = require('../middleware/validate.middleware');
const vehicleValidation = require('../validations/vehicle.validation');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

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
 *     summary: Create a new vehicle in the knowledge base (Admin only)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *               fuelType:
 *                 type: string
 *               transmission:
 *                 type: string
 *               engineSize:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Vehicle image upload
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (Admins only)
 */
router.post('/', verifyToken, isAdmin, uploadSingle, validate(vehicleValidation.createVehicle), createVehicle);

module.exports = router;