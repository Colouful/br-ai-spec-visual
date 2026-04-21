export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return jsonResponse(
      {
        error: error.message,
        details: error.details,
      },
      { status: error.status },
    );
  }

  return jsonResponse(
    {
      error: 'Internal server error',
    },
    { status: 500 },
  );
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch (error) {
    throw new HttpError(400, 'Invalid JSON body', error);
  }
}
