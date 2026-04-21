import { errorResponse } from '@/server/http';
import { meAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  try {
    return await meAction();
  } catch (error) {
    return errorResponse(error);
  }
}
