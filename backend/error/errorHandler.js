class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const createError = (status, message) => {
  return new AppError(status, message);
};
