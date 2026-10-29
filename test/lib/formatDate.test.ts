import { formatDate } from "../../src/lib/formatDate";

describe("formatDate", () => {
  it("formats a flight date as dd/mm/yyyy", () => {
    expect(formatDate(new Date("2024-08-30"))).toBe("30/08/2024");
  });

  it("keeps the UTC day in a time zone west of UTC", () => {
    // Flight dates are UTC midnight, the previous evening in the Americas
    const tz = process.env.TZ;
    process.env.TZ = "America/New_York";
    try {
      expect(formatDate(new Date("2024-08-30"))).toBe("30/08/2024");
    } finally {
      process.env.TZ = tz;
    }
  });
});
