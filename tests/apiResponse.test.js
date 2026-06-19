const apiResponse = require('../src/utils/apiResponse');

describe('apiResponse Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  test('should attach functions and call next', () => {
    apiResponse(req, res, next);
    expect(res.success).toBeDefined();
    expect(res.created).toBeDefined();
    expect(res.fail).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  test('res.success should format response correctly', () => {
    apiResponse(req, res, next);
    res.success({ key: 'value' }, 'All good', 200, { total: 1 });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'All good',
      data: { key: 'value' },
      pagination: { total: 1 }
    });
  });

  test('res.created should format response with status 201', () => {
    apiResponse(req, res, next);
    res.created({ id: 1 }, 'Created entity');

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Created entity',
      data: { id: 1 }
    });
  });

  test('res.fail should format failure response correctly', () => {
    apiResponse(req, res, next);
    res.fail('Invalid input', 400, ['Error 1']);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid input',
      errors: ['Error 1']
    });
  });
});
