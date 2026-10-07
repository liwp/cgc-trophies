import {
  flightDetailsUrl,
  igcFileUrl,
  igcViewerUrl,
} from "../../src/lib/links";

describe("BGA Ladder links", () => {
  it("builds the flight details URL", () => {
    expect(flightDetailsUrl("116237")).toBe(
      "https://www.bgaladder.net/flightdetails/116237",
    );
  });

  it("builds the IGC file URL", () => {
    expect(igcFileUrl("116237")).toBe(
      "https://api.bgaladder.net/api/FlightIGC/116237",
    );
  });

  it("builds the IGC viewer URL for the flight's trace", () => {
    expect(igcViewerUrl("116237")).toBe(
      "https://igcviewer.bgaladder.net/?igc=https://api.bgaladder.net/api/FlightIGC/116237",
    );
  });
});
