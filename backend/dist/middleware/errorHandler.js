export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
export function errorHandler(err, _req, res, _next) {
    console.error('[Error]', err);
    if (err instanceof AppError) {
        const response = {
            error: err.name,
            message: err.message,
            statusCode: err.statusCode
        };
        res.status(err.statusCode).json(response);
        return;
    }
    // Zod validation errors
    if (err.name === 'ZodError') {
        const response = {
            error: 'ValidationError',
            message: 'Invalid request data',
            statusCode: 400
        };
        res.status(400).json(response);
        return;
    }
    // Default error
    const response = {
        error: 'InternalServerError',
        message: 'Something went wrong',
        statusCode: 500
    };
    res.status(500).json(response);
}
export function notFoundHandler(_req, res) {
    const response = {
        error: 'NotFound',
        message: 'Route not found',
        statusCode: 404
    };
    res.status(404).json(response);
}
//# sourceMappingURL=errorHandler.js.map