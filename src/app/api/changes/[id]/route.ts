import { errorResponse } from '@/server/http';
import { getChangeAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;
    return await getChangeAction(id);
  } catch (error) {
    return errorResponse(error);
  }
}
