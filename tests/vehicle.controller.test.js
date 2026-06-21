const { createVehicle } = require('../src/controllers/vehicle.controller');
const Vehicle = require('../src/models/Vehicle');
const { getFileUrl } = require('../src/utils/Imagehelper');

jest.mock('../src/models/Vehicle', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
  distinct: jest.fn()
}));
jest.mock('../src/utils/Imagehelper');

describe('Vehicle Controller - createVehicle', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {
        brand: 'Toyota',
        model: 'Camry',
        bodyType: 'Sedan'
      }
    };
    res = {
      created: jest.fn().mockImplementation((data, message) => {
        res.body = data;
        res.message = message;
        return res;
      }),
      fail: jest.fn().mockImplementation((message, statusCode) => {
        res.statusCode = statusCode || 400;
        res.body = { success: false, message };
        return res;
      })
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('should successfully create a vehicle without image if no file is uploaded', async () => {
    const mockVehicle = {
      _id: 'vehicle-id-123',
      brand: 'Toyota',
      model: 'Camry',
      bodyType: 'Sedan'
    };
    Vehicle.create.mockResolvedValue(mockVehicle);

    await createVehicle(req, res, next);

    expect(Vehicle.create).toHaveBeenCalledWith({
      brand: 'Toyota',
      model: 'Camry',
      bodyType: 'Sedan'
    });
    expect(res.created).toHaveBeenCalledWith(
      { vehicle: mockVehicle },
      'Vehicle added to knowledge base.'
    );
  });

  test('should successfully create a vehicle with image URL if file is uploaded', async () => {
    req.file = { path: 'https://cloudinary.com/image.jpg' };
    getFileUrl.mockReturnValue('https://cloudinary.com/image.jpg');

    const mockVehicle = {
      _id: 'vehicle-id-123',
      brand: 'Toyota',
      model: 'Camry',
      bodyType: 'Sedan',
      image: 'https://cloudinary.com/image.jpg'
    };
    Vehicle.create.mockResolvedValue(mockVehicle);

    await createVehicle(req, res, next);

    expect(getFileUrl).toHaveBeenCalledWith(req, req.file);
    expect(Vehicle.create).toHaveBeenCalledWith({
      brand: 'Toyota',
      model: 'Camry',
      bodyType: 'Sedan',
      image: 'https://cloudinary.com/image.jpg'
    });
    expect(res.created).toHaveBeenCalledWith(
      { vehicle: mockVehicle },
      'Vehicle added to knowledge base.'
    );
  });
});
