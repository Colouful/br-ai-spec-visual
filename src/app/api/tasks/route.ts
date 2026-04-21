import { errorResponse } from '@/server/http';
import { listTasksAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    return await listTasksAction(request);
  } catch (error) {
    return errorResponse(error);
  }
}
