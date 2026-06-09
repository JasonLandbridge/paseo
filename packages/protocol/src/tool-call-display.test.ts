import { describe, expect, it } from "vitest";

import { buildToolCallDisplayModel } from "./tool-call-display.js";

describe("shared tool-call display mapping", () => {
  it("builds summary from canonical detail", () => {
    const display = buildToolCallDisplayModel({
      name: "read_file",
      status: "running",
      error: null,
      detail: {
        type: "read",
        filePath: "/tmp/repo/src/index.ts",
      },
      cwd: "/tmp/repo",
    });

    expect(display).toEqual({
      displayName: "Read",
      summary: "src/index.ts",
    });
  });

  it("does not infer summaries from unknown raw detail", () => {
    const display = buildToolCallDisplayModel({
      name: "exec_command",
      status: "running",
      error: null,
      detail: {
        type: "unknown",
        input: { command: "npm test" },
        output: null,
      },
    });

    expect(display).toEqual({
      displayName: "Exec Command",
    });
  });

  it("uses sub-agent detail for task label and description", () => {
    const display = buildToolCallDisplayModel({
      name: "task",
      status: "running",
      error: null,
      detail: {
        type: "sub_agent",
        subAgentType: "Explore",
        description: "Inspect repository structure",
        log: "[Read] README.md",
      },
    });

    expect(display).toEqual({
      displayName: "Explore",
      summary: "Inspect repository structure",
    });
  });

  it("builds display model for worktree setup detail", () => {
    const display = buildToolCallDisplayModel({
      name: "paseo_worktree_setup",
      status: "running",
      error: null,
      detail: {
        type: "worktree_setup",
        worktreePath: "/tmp/repo/.paseo/worktrees/repo/branch",
        branchName: "feature-branch",
        log: "==> [1/1] Running: npm install\n",
        commands: [
          {
            index: 1,
            command: "npm install",
            cwd: "/tmp/repo/.paseo/worktrees/repo/branch",
            log: "==> [1/1] Running: npm install\n",
            status: "running",
            exitCode: null,
          },
        ],
      },
    });

    expect(display).toEqual({
      displayName: "Worktree Setup",
      summary: "feature-branch",
    });
  });

  it("uses the proxied tool name from unknown detail input when available", () => {
    const display = buildToolCallDisplayModel({
      name: "mcpproxy_call_tool_read",
      status: "running",
      error: null,
      detail: {
        type: "unknown",
        input: {
          name: "github:search_code",
          args: { query: "repo:getpaseo/paseo ToolCall" },
        },
        output: null,
      },
    });

    expect(display.displayName).toBe("github:search_code");
  });

  it("keeps the wrapper display name when proxied tool name is absent", () => {
    const display = buildToolCallDisplayModel({
      name: "mcpproxy_call_tool_read",
      status: "running",
      error: null,
      detail: {
        type: "unknown",
        input: {
          args: { query: "repo:getpaseo/paseo ToolCall" },
        },
        output: null,
      },
    });

    expect(display.displayName).toBe("Mcpproxy Call Tool Read");
  });

  it("does not use input name for non-proxy unknown-detail tools", () => {
    const display = buildToolCallDisplayModel({
      name: "rename_file",
      status: "running",
      error: null,
      detail: {
        type: "unknown",
        input: { name: "new-name.ts" },
        output: null,
      },
    });

    expect(display.displayName).toBe("Rename File");
  });

  it("keeps explicit unknown-detail overrides ahead of proxied input names", () => {
    const taskDisplay = buildToolCallDisplayModel({
      name: "task",
      status: "running",
      error: null,
      detail: {
        type: "unknown",
        input: { name: "github:search_code" },
        output: null,
      },
    });
    const thinkingDisplay = buildToolCallDisplayModel({
      name: "thinking",
      status: "running",
      error: null,
      detail: {
        type: "unknown",
        input: { name: "github:search_code" },
        output: null,
      },
    });

    expect(taskDisplay.displayName).toBe("Task");
    expect(thinkingDisplay.displayName).toBe("Thinking");
  });

  it("keeps the wrapper display name when proxied tool name is blank or non-string", () => {
    const blankNameDisplay = buildToolCallDisplayModel({
      name: "mcpproxy_call_tool_read",
      status: "running",
      error: null,
      detail: {
        type: "unknown",
        input: { name: "   " },
        output: null,
      },
    });
    const nonStringNameDisplay = buildToolCallDisplayModel({
      name: "mcpproxy_call_tool_read",
      status: "running",
      error: null,
      detail: {
        type: "unknown",
        input: { name: 42 },
        output: null,
      },
    });

    expect(blankNameDisplay.displayName).toBe("Mcpproxy Call Tool Read");
    expect(nonStringNameDisplay.displayName).toBe("Mcpproxy Call Tool Read");
  });

  it("provides errorText for failed calls", () => {
    const display = buildToolCallDisplayModel({
      name: "shell",
      status: "failed",
      error: { message: "boom" },
      detail: {
        type: "unknown",
        input: null,
        output: null,
      },
    });

    expect(display.errorText).toBe('{\n  "message": "boom"\n}');
  });

  it("labels terminal interaction rows without a summary when no command is available", () => {
    const display = buildToolCallDisplayModel({
      name: "terminal",
      status: "completed",
      error: null,
      detail: {
        type: "plain_text",
        icon: "square_terminal",
      },
    });

    expect(display).toEqual({
      displayName: "Terminal",
    });
  });

  it("uses the command as terminal interaction summary when available", () => {
    const display = buildToolCallDisplayModel({
      name: "terminal",
      status: "completed",
      error: null,
      detail: {
        type: "plain_text",
        label: "npm run test",
        icon: "square_terminal",
      },
    });

    expect(display).toEqual({
      displayName: "Terminal",
      summary: "npm run test",
    });
  });

  it("humanizes Paseo MCP tool names (Claude Code format)", () => {
    const display = buildToolCallDisplayModel({
      name: "mcp__paseo__create_agent",
      status: "running",
      error: null,
      detail: { type: "unknown", input: null, output: null },
    });
    expect(display.displayName).toBe("Create Agent");
  });

  it("humanizes Paseo MCP tool names (Codex format)", () => {
    const display = buildToolCallDisplayModel({
      name: "paseo.create_agent",
      status: "running",
      error: null,
      detail: { type: "unknown", input: null, output: null },
    });
    expect(display.displayName).toBe("Create Agent");
  });

  it("humanizes list_agents Paseo tool", () => {
    const display = buildToolCallDisplayModel({
      name: "mcp__paseo__list_agents",
      status: "running",
      error: null,
      detail: { type: "unknown", input: null, output: null },
    });
    expect(display.displayName).toBe("List Agents");
  });

  it("does not override speak tool display name", () => {
    const display = buildToolCallDisplayModel({
      name: "speak",
      status: "running",
      error: null,
      detail: { type: "unknown", input: null, output: null },
    });
    expect(display.displayName).toBe("Speak");
  });

  it("labels plan detail rows as Plan", () => {
    const display = buildToolCallDisplayModel({
      name: "plan",
      status: "completed",
      error: null,
      detail: {
        type: "plan",
        text: "### Login Screen\n- Build layout",
      },
    });

    expect(display).toEqual({
      displayName: "Plan",
    });
  });
});
