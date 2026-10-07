import { renderToStaticMarkup } from "react-dom/server";
import HeightLossWarning from "../../src/components/HeightLossWarning";
import { useHeightLoss } from "../../src/lib/useHeightLoss";

vi.mock("../../src/lib/useHeightLoss", () => ({ useHeightLoss: vi.fn() }));

const mockHeightLoss = (heightLoss: number) =>
  vi.mocked(useHeightLoss).mockReturnValue({
    result: {
      startAltitude: 2000,
      finishAltitude: 2000 - heightLoss,
      heightLoss,
    },
    isLoading: false,
  });

describe("HeightLossWarning", () => {
  it("renders nothing when the computed loss is within the margin", () => {
    mockHeightLoss(1050);
    expect(
      renderToStaticMarkup(
        <HeightLossWarning flightId="1" reportedHeightLoss={1000} />,
      ),
    ).toBe("");
  });

  it("is a button named by its tooltip text, so keyboard users can reveal it", () => {
    mockHeightLoss(1234);
    const html = renderToStaticMarkup(
      <HeightLossWarning flightId="1" reportedHeightLoss={1000} />,
    );
    // The test environment has no DOM, so inspect the markup directly.
    const warning = html.match(/<button[^>]*>/)?.[0] ?? "";
    expect(warning).toContain('type="button"');
    const labelId = warning.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(labelId).toBeTruthy();

    const tooltip = html.match(
      new RegExp(`<span[^>]*id="${labelId}"[^>]*>([^<]*)</span>`),
    );
    expect(tooltip?.[0]).toContain('role="tooltip"');
    expect(tooltip?.[1]).toBe("Computed height loss: 1234m (reported: 1000m)");
  });
});
