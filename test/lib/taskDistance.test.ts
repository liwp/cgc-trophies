import { TASK_SPEC } from "../../src/lib/flightCsvSpec";

// Simulate what parseCsv does for an object spec with xform
function applySpec(spec: any, fields: Record<string, string>) {
  // Build the raw object from src keys
  const raw: Record<string, any> = {};
  for (const [key, subspec] of Object.entries(spec.src) as [string, any][]) {
    if (subspec.type === "number") {
      raw[key] =
        subspec.src in fields ? parseFloat(fields[subspec.src]) || 0 : 0;
    } else if (subspec.type === "boolean") {
      const val = fields[subspec.src] || "";
      raw[key] = val.toLowerCase() === "true" || val === "1";
    } else if (subspec.type === "string") {
      raw[key] = fields[subspec.src] || "";
    } else if (subspec.type === "array") {
      raw[key] = (subspec.src as any[]).map((s: any) => fields[s.src] || "");
      if (subspec.xform) raw[key] = subspec.xform(raw[key]);
    }
  }
  return spec.xform ? spec.xform(raw) : raw;
}

describe("TASK_SPEC taskDistanceKm derivation", () => {
  it("equals scoringDistanceKm for completed flights", () => {
    const task = applySpec(TASK_SPEC, {
      "Claim Type": "C",
      "Completed?": "True",
      "Declared?": "True",
      "Cross Country Points": "500",
      "Scoring Distance (km)": "305.5",
      "Handicapped Distance (km)": "320.0",
      "Handicapped Speed (kph)": "80.0",
      "Launch Site": "Gransden Lodge",
      "Start Point": "GRL",
      "Finish Point": "GRL",
      "TP 1": "BUG",
      "TP 2": "MEN",
      "TP 3": "",
      "TP 4": "",
      "Task Achievement": "Declared/Completed",
    });
    expect(task.taskDistanceKm).toBeCloseTo(305.5);
  });

  it("derives task distance from percentage for incomplete flights", () => {
    const task = applySpec(TASK_SPEC, {
      "Claim Type": "C",
      "Completed?": "False",
      "Declared?": "True",
      "Cross Country Points": "300",
      "Scoring Distance (km)": "312.475",
      "Handicapped Distance (km)": "330.0",
      "Handicapped Speed (kph)": "0",
      "Launch Site": "Gransden Lodge",
      "Start Point": "GRL",
      "Finish Point": "GRL",
      "TP 1": "BUG",
      "TP 2": "MEN",
      "TP 3": "",
      "TP 4": "",
      "Task Achievement": "Declared/76.7% Completed",
    });
    // 312.475 / 0.767 ≈ 407.4
    expect(task.taskDistanceKm).toBeCloseTo(407.4, 0);
  });

  it("falls back to scoringDistanceKm when no percentage in taskAchievement", () => {
    const task = applySpec(TASK_SPEC, {
      "Claim Type": "C",
      "Completed?": "False",
      "Declared?": "False",
      "Cross Country Points": "200",
      "Scoring Distance (km)": "180.0",
      "Handicapped Distance (km)": "190.0",
      "Handicapped Speed (kph)": "0",
      "Launch Site": "Gransden Lodge",
      "Start Point": "GRL",
      "Finish Point": "GRL",
      "TP 1": "SHP",
      "TP 2": "",
      "TP 3": "",
      "TP 4": "",
      "Task Achievement": "Undeclared/Completed",
    });
    expect(task.taskDistanceKm).toBeCloseTo(180.0);
  });
});
