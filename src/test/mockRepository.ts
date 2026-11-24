import { createDemoHandlers } from "@/demo";
import { type MockCommandHandlers, mockCommands } from "@/ipc";

/**
 * Makes each command answer with the sample repository.
 *
 * `overrides` replaces the handlers of the commands that a test changes.
 */
export function mockRepository(
  overrides: Partial<MockCommandHandlers> = {},
): void {
  mockCommands({ ...createDemoHandlers(), ...overrides });
}
