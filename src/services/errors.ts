/**
 * Error carrying an HTTP status code. Fastify's default error handler reads
 * `statusCode` off thrown errors and uses it for the response status.
 */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
