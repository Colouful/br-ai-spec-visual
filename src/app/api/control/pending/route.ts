import { errorResponse } from '@/server/http';
import { pendingControlsAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    return await pendingControlsAction(request);
  } catch (error) {
    return errorResponse(error);
  }
}
