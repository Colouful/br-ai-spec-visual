import { errorResponse } from '@/server/http';
import {
  createWorkspaceAction,
  listWorkspacesAction,
} from '@/server/http-api';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  try {
    return await listWorkspacesAction(request);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    return await createWorkspaceAction(request);
  } catch (error) {
    return errorResponse(error);
  }
}
