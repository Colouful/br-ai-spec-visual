import { errorResponse } from '@/server/http';
import { listSpecsAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    return await listSpecsAction(request);
  } catch (error) {
    return errorResponse(error);
  }
}
