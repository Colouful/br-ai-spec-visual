import { errorResponse } from '@/server/http';
import { getWorkspaceAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;
    return await getWorkspaceAction(id);
  } catch (error) {
    return errorResponse(error);
  }
}
