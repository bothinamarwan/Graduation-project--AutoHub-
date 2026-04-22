/**
 * apiResponse
 * Attaches res.success() and res.fail() to every response object.
 * Ensures a consistent JSON shape across the entire API:
 *
 * Success: { success: true,  message, data, pagination? }
 * Failure: { success: false, message, errors? }
 *
 * Usage (in app.js):
 *   app.use(apiResponse)
 *
 * Usage (in controllers):
 *   res.success({ user })
 *   res.success({ posts }, 'Posts fetched.', 200, pagination)
 *   res.fail('Not found.', 404)
 *   res.created({ post }, 'Post created.')
 */
const apiResponse = (req, res, next) => {
  /**
   * res.success(data, message, statusCode, pagination)
   */
  res.success = (data = {}, message = 'Success.', statusCode = 200, pagination = null) => {
    const body = { success: true, message, data };
    if (pagination) body.pagination = pagination;
    return res.status(statusCode).json(body);
  };

  /**
   * res.created(data, message)  — shorthand for 201
   */
  res.created = (data = {}, message = 'Created successfully.') => {
    return res.status(201).json({ success: true, message, data });
  };

  /**
   * res.fail(message, statusCode, errors)
   */
  res.fail = (message = 'Something went wrong.', statusCode = 400, errors = null) => {
    const body = { success: false, message };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
  };

  next();
};

module.exports = apiResponse;