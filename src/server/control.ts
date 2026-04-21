import { ZodError } from 'zod';

import {
  controlCommandSchema,
  type ControlCommand,
} from '../lib/contracts/control.ts';

function inferCommandName(input: unknown): string {
  if (
    input &&
    typeof input === 'object' &&
    'command' in input &&
    typeof input.command === 'string'
  ) {
    return input.command;
  }

  return 'control';
}

export function parseControlCommand(input: unknown): ControlCommand {
  try {
    return controlCommandSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid ${inferCommandName(input)} control command: ${error.message}`);
    }

    throw error;
  }
}
