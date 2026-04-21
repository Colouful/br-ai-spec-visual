import { errorResponse } from '@/server/http';
import { loginAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    return await loginAction(request);
  } catch (error) {
    return errorResponse(error);
  }
}
