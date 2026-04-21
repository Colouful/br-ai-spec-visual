import { errorResponse } from '@/server/http';
import { listChangesAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    return await listChangesAction(request);
  } catch (error) {
    return errorResponse(error);
  }
}
