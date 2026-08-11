#!/usr/bin/env node
// Local stdio MCP server for OnboardingBuddy. Claude Desktop spawns this
// process directly (same pattern as the ARL Scorecard connector) and talks
// to it over stdin/stdout. Every tool call is relayed over HTTPS to the
// OnboardingBuddy app's own /api/mcp endpoint — no database credentials are
// ever stored on this machine, only a bearer token scoped to reports.
import fs from "node:fs";
import path from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const here = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")));
const token = fs.readFileSync(path.join(here, ".token"), "utf8").trim();
const ENDPOINT = "https://onboardingbuddy.vercel.app/api/mcp";

const TOOLS = [
  {
    name: "onboarding_progress_report",
    description: "Every employee's onboarding task completion (done/total), optionally filtered by SBU.",
    inputSchema: { type: "object", properties: { sbu: { type: "string" } } },
  },
  {
    name: "employee_kpi_report",
    description: "Employee KPI submission status counts (pending/approved/rejected) for a month (YYYY-MM), default current month.",
    inputSchema: { type: "object", properties: { period_month: { type: "string" } } },
  },
  {
    name: "help_ticket_report",
    description: "Help ticket counts by status and assigned team, optionally filtered by status.",
    inputSchema: { type: "object", properties: { status: { type: "string" } } },
  },
];

async function callTool(name, args) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
  });
  if (!res.ok) throw new Error(`OnboardingBuddy server returned ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(body.error.message);
  return body.result;
}

const server = new Server({ name: "onboardingbuddy-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => callTool(req.params.name, req.params.arguments ?? {}));

await server.connect(new StdioServerTransport());
