class ServiceError extends Error {
  constructor(message, status = 500, code = 'internal_error') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

class NotFoundError extends ServiceError {
  constructor(message = 'Not found') {
    super(message, 404, 'not_found');
  }
}

class ValidationError extends ServiceError {
  constructor(message = 'Validation failed', details = []) {
    super(message, 400, 'validation_error');
    this.details = details;
  }
}

module.exports = { ServiceError, NotFoundError, ValidationError };
