// error/errorHandler.js

class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "AppError";
  }
}

export const createError = (status, message) => {
  return new AppError(status, message);
};
