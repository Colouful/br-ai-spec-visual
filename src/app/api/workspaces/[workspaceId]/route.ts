import { errorResponse } from '@/server/http';
import { getWorkspaceAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceId: string }> },
): Promise<Response> {
  try {
    const { workspaceId } = await context.params;
    return await getWorkspaceAction(workspaceId);
  } catch (error) {
    return errorResponse(error);
  }
}
