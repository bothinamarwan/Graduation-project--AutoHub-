const { verifyToken, isDealer, isUser } = require('../src/middleware/auth.middleware');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');

jest.mock('jsonwebtoken');
jest.mock('../src/models/User');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {},
      session: {}
    };
    res = {
      fail: jest.fn().mockImplementation((message, statusCode) => {
        res.statusCode = statusCode || 400;
        res.body = { success: false, message };
        return res;
      })
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    test('should authenticate successfully with a valid Bearer JWT', async () => {
      req.headers.authorization = 'Bearer valid-jwt-token';
      jwt.verify.mockReturnValue({ id: 'user-id-123' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user-id-123', name: 'John Doe', role: 'user' })
      });

      await verifyToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-jwt-token', process.env.JWT_SECRET);
      expect(req.user).toBeDefined();
      expect(req.user.name).toBe('John Doe');
      expect(next).toHaveBeenCalled();
    });

    test('should fallback to session when JWT is not present', async () => {
      req.session.userId = 'session-user-id';
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'session-user-id', name: 'Jane Doe', role: 'dealer' })
      });

      await verifyToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.name).toBe('Jane Doe');
      expect(next).toHaveBeenCalled();
    });

    test('should fail when no JWT and no session exist', async () => {
      await verifyToken(req, res, next);

      expect(res.fail).toHaveBeenCalledWith('Not authorized, please login.', 401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should fail when user is not found in the database', async () => {
      req.session.userId = 'missing-user-id';
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await verifyToken(req, res, next);

      expect(res.fail).toHaveBeenCalledWith('User not found.', 404);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isDealer', () => {
    test('should allow access if user has dealer role', () => {
      req.user = { role: 'dealer' };

      isDealer(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.fail).not.toHaveBeenCalled();
    });

    test('should block access if user does not have dealer role', () => {
      req.user = { role: 'user' };

      isDealer(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.fail).toHaveBeenCalledWith('Access denied: Dealers only.', 403);
    });
  });

  describe('isUser', () => {
    test('should allow access if user has user role', () => {
      req.user = { role: 'user' };

      isUser(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.fail).not.toHaveBeenCalled();
    });

    test('should block access if user does not have user role', () => {
      req.user = { role: 'dealer' };

      isUser(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.fail).toHaveBeenCalledWith('Access denied: Users only.', 403);
    });
  });
});
