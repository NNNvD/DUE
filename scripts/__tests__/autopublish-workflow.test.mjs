import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

function readWorkflow(relativePath) {
  const source = fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
  const parsed = yaml.load(source);
  return parsed;
}

function workflowTriggers(workflow) {
  return workflow.on || workflow["on"] || workflow.true || {};
}

function runsMoreThanOnceDaily(cron) {
  if (typeof cron !== "string") return false;
  const [minute = "", hour = "", dayOfMonth = "", month = "", dayOfWeek = ""] = cron.trim().split(/\s+/);
  if (dayOfMonth !== "*" || month !== "*" || dayOfWeek !== "*") return false;
  const minuteVaries = minute.includes("*") || minute.includes("/") || minute.includes(",") || minute.includes("-");
  const hourVaries = hour.includes("*") || hour.includes("/") || hour.includes(",") || hour.includes("-");
  return minuteVaries || hourVaries;
}

describe("autopublish workflow", () => {
  it("runs more than once per day so deadline_at_time values are not stuck behind UTC midnight", () => {
    const workflow = readWorkflow(".github/workflows/autopublish.yml");
    const triggers = workflowTriggers(workflow);
    const crons = Array.isArray(triggers.schedule)
      ? triggers.schedule.map(entry => entry.cron)
      : [];

    expect(crons.length).toBeGreaterThan(0);
    expect(crons.some(runsMoreThanOnceDaily)).toBe(true);
  });
});

describe("pages deployment workflow", () => {
  it("can deploy after the autopublish workflow completes", () => {
    const workflow = readWorkflow(".github/workflows/pages.yml");
    const triggers = workflowTriggers(workflow);
    const workflowRun = triggers.workflow_run;

    expect(workflowRun).toBeTruthy();
    expect(workflowRun.workflows || []).toContain("Auto publish overdue drafts");
    expect(workflowRun.types || []).toContain("completed");
  });
});
