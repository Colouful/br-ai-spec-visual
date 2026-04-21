import { errorResponse } from '@/server/http';
import { logoutAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function POST(): Promise<Response> {
  try {
    return await logoutAction();
  } catch (error) {
    return errorResponse(error);
  }
}
