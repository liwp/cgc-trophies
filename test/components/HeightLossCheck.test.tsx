import { renderToStaticMarkup } from "react-dom/server";
import HeightLossCheck from "../../src/components/HeightLossCheck";
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

// The test environment has no DOM, so read the tooltip text from the markup.
const tooltipText = (html: string) =>
  html.match(/<span[^>]*role="tooltip"[^>]*>([^<]*)<\/span>/)?.[1];

describe("HeightLossCheck", () => {
  afterEach(() => {
    vi.mocked(useHeightLoss).mockReset();
  });

  it("doesn't download the IGC file until asked", () => {
    vi.mocked(useHeightLoss).mockReturnValue({
      result: undefined,
      isLoading: false,
    });
    const html = renderToStaticMarkup(
      <HeightLossCheck flightId="1" reportedHeightLoss={1000} />,
    );

    expect(useHeightLoss).toHaveBeenCalledWith(undefined);
    expect(tooltipText(html)).toBe("Check height loss");
  });

  it("checks straight away with auto", () => {
    mockHeightLoss(1050);
    const html = renderToStaticMarkup(
      <HeightLossCheck flightId="1" reportedHeightLoss={1000} auto />,
    );

    expect(useHeightLoss).toHaveBeenCalledWith("1");
    expect(tooltipText(html)).toBe("Height loss OK: 1050m (reported: 1000m)");
  });

  it("warns when the computed loss exceeds the reported one", () => {
    mockHeightLoss(1234);
    const html = renderToStaticMarkup(
      <HeightLossCheck flightId="1" reportedHeightLoss={1000} auto />,
    );

    expect(tooltipText(html)).toBe(
      "Computed height loss: 1234m (reported: 1000m)",
    );
  });

  it("says when the IGC file is unavailable", () => {
    vi.mocked(useHeightLoss).mockReturnValue({
      result: null,
      isLoading: false,
    });
    const html = renderToStaticMarkup(
      <HeightLossCheck flightId="1" reportedHeightLoss={1000} auto />,
    );

    expect(tooltipText(html)).toBe("Height loss unknown: IGC file unavailable");
  });

  it("shows progress while checking", () => {
    vi.mocked(useHeightLoss).mockReturnValue({
      result: undefined,
      isLoading: true,
    });
    const html = renderToStaticMarkup(
      <HeightLossCheck flightId="1" reportedHeightLoss={1000} auto />,
    );

    expect(tooltipText(html)).toBe("Checking height loss…");
  });
});
