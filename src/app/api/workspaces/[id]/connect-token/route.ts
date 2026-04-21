import { errorResponse } from '@/server/http';
import { createConnectTokenAction } from '@/server/http-api';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;
    return await createConnectTokenAction(request, id);
  } catch (error) {
    return errorResponse(error);
  }
}
