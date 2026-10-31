import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "../../src/components/Markdown";

const render = (markdown: string) =>
  renderToStaticMarkup(<Markdown>{markdown}</Markdown>);

describe("Markdown", () => {
  it("renders paragraphs and bold text", () => {
    const html = render("Fly **BNW – HUS**.\n\nEither way round.");
    expect(html).toContain('<strong class="font-semibold text-gray-700">');
    expect(html.match(/<p /g)).toHaveLength(2);
  });

  it("opens links in a new tab", () => {
    expect(render("[ladder](https://www.bgaladder.net)")).toContain(
      'href="https://www.bgaladder.net" class="text-cambridge hover:text-cambridge-dark underline" target="_blank" rel="noreferrer"',
    );
  });

  it("escapes raw HTML", () => {
    expect(render("<b>bold</b>")).not.toContain("<b>");
  });
});
