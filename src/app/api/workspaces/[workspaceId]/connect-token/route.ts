import { errorResponse } from '@/server/http';
import { createConnectTokenAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> },
): Promise<Response> {
  try {
    const { workspaceId } = await context.params;
    return await createConnectTokenAction(request, workspaceId);
  } catch (error) {
    return errorResponse(error);
  }
}
