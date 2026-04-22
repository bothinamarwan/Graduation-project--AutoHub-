const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    index: true
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true,
    index: true
  },
  bodyType: {
    type: String,
    trim: true
  },
  fuelType: {
    type: String,
    trim: true
  },
  transmission: {
    type: String,
    trim: true
  },
  engineSize: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Enable text search for brand and model as used in the searchVehicles controller
vehicleSchema.index({ brand: 'text', model: 'text', description: 'text' });

// Ensure brand and model combinations are easy to find/sort
vehicleSchema.index({ brand: 1, model: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
