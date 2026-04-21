import { errorResponse } from '@/server/http';
import { approveAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    return await approveAction(request);
  } catch (error) {
    return errorResponse(error);
  }
}
