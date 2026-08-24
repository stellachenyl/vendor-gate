import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "@/components/ui/Tabs";

const items = [
  { id: "a", label: "Details", content: <p>Alpha content</p> },
  { id: "b", label: "8D Progress", content: <p>Beta content</p> },
  { id: "c", label: "Attachments", content: <p>Gamma content</p> },
];

describe("Tabs", () => {
  it("activates the first tab by default and renders only its panel", () => {
    render(<Tabs items={items} />);

    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Alpha content")).toBeInTheDocument();
    expect(screen.queryByText("Beta content")).not.toBeInTheDocument();
  });

  it("switches panels on click and hides inactive ones", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);

    await user.click(screen.getByRole("tab", { name: "8D Progress" }));

    expect(screen.getByRole("tab", { name: "8D Progress" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Beta content")).toBeInTheDocument();
    expect(screen.queryByText("Alpha content")).not.toBeInTheDocument();
  });

  it("supports right-arrow keyboard navigation between tabs", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);

    await user.tab(); // focus lands on the active tab
    expect(document.activeElement).toHaveTextContent("Details");

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "8D Progress" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.keyboard("{ArrowRight}{ArrowRight}");
    // Wraps back to the first tab.
    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("wraps backwards from the first to the last tab with left arrow", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);

    await user.tab();
    await user.keyboard("{ArrowLeft}");

    expect(
      screen.getByRole("tab", { name: "Attachments" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Gamma content")).toBeInTheDocument();
  });

  it("wires tab/tabpanel ids for screen-reader association", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);

    const tab = screen.getByRole("tab", { name: "8D Progress" });
    const controlsId = tab.getAttribute("aria-controls");
    expect(controlsId).toBeTruthy();

    await user.click(tab);
    expect(document.getElementById(controlsId!)).toHaveTextContent(
      "Beta content",
    );
  });
});
