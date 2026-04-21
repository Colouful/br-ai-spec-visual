import { errorResponse } from '@/server/http';
import { listMembersAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  try {
    return await listMembersAction();
  } catch (error) {
    return errorResponse(error);
  }
}
