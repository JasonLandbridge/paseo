import { describe, expect, test } from "vitest";

import { resolveDraftWorkingDirectory, validateDraftSubmission } from "./workspace-tab-core";

const baseComposerState = {
  providerDefinitions: [{ id: "codewhale" }],
  selectedProvider: "codewhale",
  isModelLoading: false,
  effectiveModelId: "",
  availableModels: [],
};

function validate(overrides = {}) {
  return validateDraftSubmission({
    text: "hello",
    allowsEmptyAutoSubmit: false,
    composerState: baseComposerState,
    autoSubmitConfig: null,
    workspaceDirectory: "/tmp/project",
    hasClient: true,
    ...overrides,
  });
}

describe("workspace draft working directory resolution", () => {
  test("prefers the active workspace directory over a stale draft setup cwd", () => {
    expect(
      resolveDraftWorkingDirectory({
        workspaceDirectory: "/tmp/project",
        initialSetup: { cwd: "/tmp/older-project" },
      }),
    ).toBe("/tmp/project");
  });

  test("falls back to the draft setup cwd when no workspace directory is available", () => {
    expect(
      resolveDraftWorkingDirectory({
        workspaceDirectory: null,
        initialSetup: { cwd: "/tmp/project" },
      }),
    ).toBe("/tmp/project");
  });
});

describe("workspace draft agent model validation", () => {
  test("allows a ready provider with no models to submit without a selected model", () => {
    expect(validate({})).toBeNull();
  });

  test("keeps waiting while model defaults are loading", () => {
    expect(
      validate({
        composerState: {
          ...baseComposerState,
          isModelLoading: true,
        },
      }),
    ).toBe("Model defaults are still loading");
  });

  test("still requires a selected model when the provider exposes models", () => {
    expect(
      validate({
        composerState: {
          ...baseComposerState,
          availableModels: [{ id: "deepseek/deepseek-v4-pro" }],
        },
      }),
    ).toBe("No model is available for the selected provider");
  });
});
