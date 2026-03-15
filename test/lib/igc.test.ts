import { parseIgc, computeHeightLoss } from "../../src/lib/igc";

describe("parseIgc", () => {
  describe("B-record parsing", () => {
    it("parses lat, lon, and altitudes from a B-record", () => {
      const igc = [
        "HFDTE090925",
        "B1024555210976N00006627WA000750007500000",
      ].join("\n");

      const result = parseIgc(igc);
      expect(result.track).toHaveLength(1);

      const pt = result.track[0];
      expect(pt.time).toBe("102455");
      expect(pt.lat).toBeCloseTo(52.18293, 4);
      expect(pt.lon).toBeCloseTo(-0.11045, 4);
      expect(pt.baroAlt).toBe(75);
      expect(pt.gpsAlt).toBe(75);
    });

    it("parses east longitude as positive", () => {
      const igc = [
        "HFDTE090925",
        "B1024555210976N00006627EA000750007500000",
      ].join("\n");

      const result = parseIgc(igc);
      expect(result.track[0].lon).toBeCloseTo(0.11045, 4);
    });

    it("parses south latitude as negative", () => {
      const igc = [
        "HFDTE090925",
        "B1024555210976S00006627WA000750007500000",
      ].join("\n");

      const result = parseIgc(igc);
      expect(result.track[0].lat).toBeCloseTo(-52.18293, 4);
    });

    it("parses multiple B-records", () => {
      const igc = [
        "HFDTE090925",
        "B1024555210976N00006627WA000750007500000",
        "B1150015210354N00058982WA010050100500000",
      ].join("\n");

      const result = parseIgc(igc);
      expect(result.track).toHaveLength(2);
    });

    it("ignores non-B lines", () => {
      const igc = [
        "AXCSAAA",
        "HFDTE090925",
        "I023638FXA3940SIU",
        "B1024555210976N00006627WA000750007500000",
      ].join("\n");

      const result = parseIgc(igc);
      expect(result.track).toHaveLength(1);
    });

    it("ignores short B lines", () => {
      const igc = ["B1024", "B1024555210976N00006627WA000750007500000"].join(
        "\n",
      );

      const result = parseIgc(igc);
      expect(result.track).toHaveLength(1);
    });
  });

  describe("C-record parsing", () => {
    it("parses task waypoints from C-records", () => {
      const igc = [
        "C090925102455000000000003",
        "C0000000N00000000ETAKEOFF",
        "C5211179N00006674WGRANSDEN LODGE",
        "C5155471N00100693WCALVERT RAIL JUNCTION",
        "C5250727N00051285WEASTWELL",
        "C5211179N00006674WGRANSDEN LODGE",
        "C0000000N00000000ELANDING",
      ].join("\n");

      const result = parseIgc(igc);
      expect(result.task).toHaveLength(6);
      expect(result.task[0].name).toBe("TAKEOFF");
      expect(result.task[1].name).toBe("GRANSDEN LODGE");
      expect(result.task[1].lat).toBeCloseTo(52.18632, 4);
      expect(result.task[1].lon).toBeCloseTo(-0.11123, 4);
      expect(result.task[5].name).toBe("LANDING");
    });

    it("skips C-record date header line", () => {
      const igc = [
        "C090925102455000000000003",
        "C5211179N00006674WGRANSDEN LODGE",
      ].join("\n");

      const result = parseIgc(igc);
      expect(result.task).toHaveLength(1);
    });

    it("handles Windows-style line endings", () => {
      const igc =
        "C090925102455000000000003\r\nC5211179N00006674WGRANSDEN LODGE\r\n";

      const result = parseIgc(igc);
      expect(result.task).toHaveLength(1);
      expect(result.task[0].name).toBe("GRANSDEN LODGE");
    });
  });
});

describe("computeHeightLoss", () => {
  const grl = { lat: 52.183, lon: -0.111 };
  const tp = { lat: 52.0, lon: -0.5 };

  function makeIgcData(startAlt: number, finishAlt: number) {
    return {
      task: [
        { lat: 0, lon: 0, name: "TAKEOFF" },
        { lat: grl.lat, lon: grl.lon, name: "GRL" },
        { lat: tp.lat, lon: tp.lon, name: "TP1" },
        { lat: grl.lat, lon: grl.lon, name: "GRL" },
        { lat: 0, lon: 0, name: "LANDING" },
      ],
      track: [
        // Before start line (approaching from behind)
        {
          time: "100000",
          lat: 52.19,
          lon: -0.1,
          baroAlt: startAlt,
          gpsAlt: startAlt,
        },
        // Cross start line (past GRL heading toward TP1 = south-west)
        {
          time: "100100",
          lat: 52.175,
          lon: -0.12,
          baroAlt: startAlt,
          gpsAlt: startAlt,
        },
        // En route
        {
          time: "110000",
          lat: 52.05,
          lon: -0.45,
          baroAlt: 1500,
          gpsAlt: 1500,
        },
        // Near TP
        {
          time: "120000",
          lat: tp.lat,
          lon: tp.lon,
          baroAlt: 1200,
          gpsAlt: 1200,
        },
        // Returning
        {
          time: "130000",
          lat: 52.05,
          lon: -0.45,
          baroAlt: 800,
          gpsAlt: 800,
        },
        // Cross finish line (approaching GRL from south-west)
        {
          time: "140000",
          lat: 52.175,
          lon: -0.12,
          baroAlt: finishAlt,
          gpsAlt: finishAlt,
        },
        // Past finish
        {
          time: "140100",
          lat: 52.19,
          lon: -0.1,
          baroAlt: finishAlt,
          gpsAlt: finishAlt,
        },
      ],
    };
  }

  it("computes height loss from start to finish crossing", () => {
    const data = makeIgcData(500, 400);
    const result = computeHeightLoss(data);

    expect(result).not.toBeNull();
    expect(result!.heightLoss).toBeCloseTo(100, -1);
    expect(result!.startAltitude).toBeCloseTo(500, -1);
    expect(result!.finishAltitude).toBeCloseTo(400, -1);
  });

  it("returns negative height loss when finish is higher", () => {
    const data = makeIgcData(400, 600);
    const result = computeHeightLoss(data);

    expect(result).not.toBeNull();
    expect(result!.heightLoss).toBeLessThan(0);
  });

  it("returns null when task has no turnpoints", () => {
    const data = {
      task: [
        { lat: 0, lon: 0, name: "TAKEOFF" },
        { lat: 0, lon: 0, name: "LANDING" },
      ],
      track: [],
    };
    const result = computeHeightLoss(data);
    expect(result).toBeNull();
  });

  it("returns null when track is too short", () => {
    const data = {
      task: [
        { lat: 0, lon: 0, name: "TAKEOFF" },
        { lat: grl.lat, lon: grl.lon, name: "GRL" },
        { lat: tp.lat, lon: tp.lon, name: "TP1" },
        { lat: grl.lat, lon: grl.lon, name: "GRL" },
        { lat: 0, lon: 0, name: "LANDING" },
      ],
      track: [
        {
          time: "100000",
          lat: 52.19,
          lon: -0.1,
          baroAlt: 500,
          gpsAlt: 500,
        },
      ],
    };
    const result = computeHeightLoss(data);
    expect(result).toBeNull();
  });

  it("returns null when no start crossing found", () => {
    // Track that never crosses the start line
    const data = {
      task: [
        { lat: 0, lon: 0, name: "TAKEOFF" },
        { lat: grl.lat, lon: grl.lon, name: "GRL" },
        { lat: tp.lat, lon: tp.lon, name: "TP1" },
        { lat: grl.lat, lon: grl.lon, name: "GRL" },
        { lat: 0, lon: 0, name: "LANDING" },
      ],
      track: [
        { time: "100000", lat: 50.0, lon: -2.0, baroAlt: 500, gpsAlt: 500 },
        { time: "110000", lat: 50.1, lon: -2.1, baroAlt: 400, gpsAlt: 400 },
      ],
    };
    const result = computeHeightLoss(data);
    expect(result).toBeNull();
  });

  it("returns null when start and first TP are the same point", () => {
    const data = {
      task: [
        { lat: 0, lon: 0, name: "TAKEOFF" },
        { lat: grl.lat, lon: grl.lon, name: "GRL" },
        { lat: grl.lat, lon: grl.lon, name: "GRL" },
        { lat: grl.lat, lon: grl.lon, name: "GRL" },
        { lat: 0, lon: 0, name: "LANDING" },
      ],
      track: [
        { time: "100000", lat: 52.19, lon: -0.1, baroAlt: 500, gpsAlt: 500 },
        { time: "110000", lat: 52.17, lon: -0.12, baroAlt: 400, gpsAlt: 400 },
      ],
    };
    const result = computeHeightLoss(data);
    expect(result).toBeNull();
  });

  it("returns null when start crossing only in second half of track", () => {
    // Many points far from start, crossing only happens late
    const far = { time: "100000", lat: 51.0, lon: -1.0, baroAlt: 500, gpsAlt: 500 };
    const data = {
      task: [
        { lat: 0, lon: 0, name: "TAKEOFF" },
        { lat: grl.lat, lon: grl.lon, name: "GRL" },
        { lat: tp.lat, lon: tp.lon, name: "TP1" },
        { lat: grl.lat, lon: grl.lon, name: "GRL" },
        { lat: 0, lon: 0, name: "LANDING" },
      ],
      track: [
        // Many points far from start line in first half
        { ...far, time: "100000" },
        { ...far, time: "100100" },
        { ...far, time: "100200" },
        { ...far, time: "100300" },
        { ...far, time: "100400" },
        { ...far, time: "100500" },
        // Cross start line only well past midpoint
        { time: "120000", lat: 52.19, lon: -0.1, baroAlt: 500, gpsAlt: 500 },
        { time: "130000", lat: 52.175, lon: -0.12, baroAlt: 400, gpsAlt: 400 },
      ],
    };
    const result = computeHeightLoss(data);
    expect(result).toBeNull();
  });

  it("uses GPS altitude when baro is zero", () => {
    const data = makeIgcData(0, 0);
    data.track = data.track.map((pt, i) => ({
      ...pt,
      baroAlt: 0,
      gpsAlt: i <= 1 ? 500 : i >= 5 ? 400 : 1000,
    }));

    const result = computeHeightLoss(data);
    expect(result).not.toBeNull();
    expect(result!.heightLoss).toBeCloseTo(100, -1);
  });
});
