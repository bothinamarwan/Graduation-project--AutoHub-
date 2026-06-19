const { updateUserRole } = require('../src/controllers/admin.controller');
const User = require('../src/models/User');

jest.mock('../src/models/User');

describe('Admin Controller - updateUserRole', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      params: { id: '60d0fe4f5311236168a109ca' },
      body: { role: 'admin' },
      user: { _id: '60d0fe4f5311236168a109cb' } // active admin ID
    };
    res = {
      success: jest.fn().mockImplementation((data, message) => {
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

  test('should successfully update a user\'s role to admin', async () => {
    const mockUser = {
      _id: '60d0fe4f5311236168a109ca',
      role: 'user',
      save: jest.fn().mockResolvedValue(true)
    };
    User.findById.mockResolvedValue(mockUser);

    await updateUserRole(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('60d0fe4f5311236168a109ca');
    expect(mockUser.role).toBe('admin');
    expect(mockUser.save).toHaveBeenCalled();
    expect(res.success).toHaveBeenCalledWith({ user: mockUser }, expect.stringContaining("updated successfully"));
  });

  test('should prevent self-demotion', async () => {
    req.user._id = '60d0fe4f5311236168a109ca'; // same ID as target user

    await updateUserRole(req, res, next);

    expect(res.fail).toHaveBeenCalledWith('You cannot change your own role.', 400);
    expect(User.findById).not.toHaveBeenCalled();
  });

  test('should return 404 if user not found', async () => {
    User.findById.mockResolvedValue(null);

    await updateUserRole(req, res, next);

    expect(res.fail).toHaveBeenCalledWith('User not found.', 404);
  });
});
