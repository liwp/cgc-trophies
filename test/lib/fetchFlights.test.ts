import { readFileSync } from "node:fs";
import config from "trophies-config";
import { fetchFlights } from "../../src/lib/fetchFlights";

const fixtureCsv = readFileSync(
  new URL("../../e2e/fixtures/2025.csv", import.meta.url),
  "utf8",
);

const okResponse = (body: string) =>
  ({ ok: true, text: () => Promise.resolve(body) }) as Response;

describe("fetchFlights", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches each year in the inclusive range from the BGA API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse("header\n"));
    vi.stubGlobal("fetch", fetchMock);

    await fetchFlights(2023, 2025);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const urls = fetchMock.mock.calls.map((c) => c[0]);
    expect(urls).toEqual([
      `https://api.bgaladder.net/api/getlogfilescsv/2023/${config.club.code}`,
      `https://api.bgaladder.net/api/getlogfilescsv/2024/${config.club.code}`,
      `https://api.bgaladder.net/api/getlogfilescsv/2025/${config.club.code}`,
    ]);
  });

  it("handles a single-year range", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse("header\n"));
    vi.stubGlobal("fetch", fetchMock);

    const flights = await fetchFlights(2025, 2025);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(flights).toEqual([]);
  });

  it("parses and concatenates real CSV across years", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(fixtureCsv));
    vi.stubGlobal("fetch", fetchMock);

    const oneYear = await fetchFlights(2025, 2025);
    expect(oneYear.length).toBeGreaterThan(0);
    const first = oneYear[0];
    expect(first).toMatchObject({
      clubName: expect.any(String),
      pilot: expect.any(String),
      task: expect.objectContaining({ taskDistanceKm: expect.any(Number) }),
    });

    const twoYears = await fetchFlights(2024, 2025);
    expect(twoYears.length).toBe(oneYear.length * 2);
  });

  it("rejects when a year's request is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchFlights(2025, 2025)).rejects.toThrow(
      "Failed to fetch flights for 2025: 503 Service Unavailable",
    );
  });
});
