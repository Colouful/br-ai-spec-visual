import { errorResponse } from '@/server/http';
import { listRunsAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  try {
    return await listRunsAction();
  } catch (error) {
    return errorResponse(error);
  }
}
