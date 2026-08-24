import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "@/components/data/DataTable";
import type { Column } from "@/components/data/DataTable";

jest.mock("../../../lib/utils", () => ({
  ...jest.requireActual("../../../lib/utils"),
  exportToCsv: jest.fn(),
}));

const exportToCsvMock = require("../../../lib/utils").exportToCsv as jest.Mock;

interface Row {
  id: string;
  name: string;
  score: number;
}

const ROWS: Row[] = [
  { id: "r1", name: "delta", score: 10 },
  { id: "r2", name: "alpha", score: 2 },
  { id: "r3", name: "charlie", score: 33 },
  { id: "r4", name: "bravo", score: 17 },
  { id: "r5", name: "echo", score: 25 },
];

const columns: Array<Column<Row>> = [
  { key: "name", header: "Name" },
  { key: "score", header: "Score", align: "right" },
];

function bodyRows(container: HTMLElement): HTMLTableRowElement[] {
  return Array.from(container.querySelectorAll("tbody tr"));
}

function renderTable(overrides?: { data?: Row[]; pageSize?: number }) {
  return render(
    <DataTable
      columns={columns}
      data={overrides?.data ?? ROWS}
      rowKey={(row) => row.id}
      pageSize={overrides?.pageSize ?? 2}
      csvFilename="test-export.csv"
      caption="Test table"
    />,
  );
}

beforeEach(() => {
  exportToCsvMock.mockClear();
});

describe("DataTable pagination", () => {
  it("renders only the first page of rows with an accurate summary", () => {
    const { container } = renderTable();

    const names = bodyRows(container).map((r) => r.cells[0]?.textContent);
    expect(names).toEqual(["delta", "alpha"]);
    expect(screen.getByText(/Showing/i)).toHaveTextContent("1–2");
    expect(screen.getByText(/Showing/i)).toHaveTextContent("of 5 records");
  });

  it("navigates forward and backward through pages via page-number buttons", async () => {
    const user = userEvent.setup();
    const { container } = renderTable();

    await user.click(screen.getByRole("button", { name: "3" }));

    expect(bodyRows(container)).toHaveLength(1);
    expect(bodyRows(container)[0]?.cells[0]).toHaveTextContent("echo");
    expect(screen.getByRole("button", { name: "3" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(bodyRows(container)[0]?.cells[0]).toHaveTextContent("charlie");
  });

  it("disables Previous on the first page (boundary)", () => {
    renderTable();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  });

  it("disables Next on the last page (boundary)", async () => {
    const user = userEvent.setup();
    renderTable();

    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "3" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("clamps the active page when the dataset shrinks below the current page", async () => {
    const user = userEvent.setup();
    const { rerender } = renderTable();

    // Walk to page 3, then the upstream data shrinks to one page.
    await user.click(screen.getByRole("button", { name: "3" }));
    rerender(
      <DataTable
        columns={columns}
        data={ROWS.slice(0, 2)}
        rowKey={(row) => row.id}
        pageSize={2}
        csvFilename="test-export.csv"
        caption="Test table"
      />,
    );

    const summary = screen.getByText(/Showing/i);
    expect(summary).toHaveTextContent("1–2");
    expect(summary).toHaveTextContent("of 2 records");
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  });
});

describe("DataTable sorting", () => {
  it("sorts strings ascending on first click and restores original order on third click", async () => {
    const user = userEvent.setup();
    const { container } = renderTable();

    await user.click(screen.getByRole("button", { name: /^Name/ }));
    expect(bodyRows(container)[0]?.cells[0]).toHaveTextContent("alpha");

    // Cycle: asc → desc → unsorted.
    await user.click(screen.getByRole("button", { name: /^Name/ }));
    expect(bodyRows(container)[0]?.cells[0]).toHaveTextContent("echo");

    await user.click(screen.getByRole("button", { name: /^Name/ }));
    expect(bodyRows(container)[0]?.cells[0]).toHaveTextContent("delta");
  });

  it("sorts numeric columns numerically rather than lexicographically", async () => {
    const user = userEvent.setup();
    const { container } = renderTable();

    // Regression guard: raw numeric fields must not be compared as strings
    // (10 < 17 < 2 … was the lexicographic defect).
    await user.click(screen.getByRole("button", { name: /^Score/ }));
    expect(bodyRows(container)[0]?.cells[1]).toHaveTextContent("2");
    expect(bodyRows(container)[1]?.cells[1]).toHaveTextContent("10");
    await user.click(screen.getByRole("button", { name: /^Score/ }));
    expect(bodyRows(container)[0]?.cells[1]).toHaveTextContent("33");
  });

  it("exposes sort direction to assistive tech via aria-sort", async () => {
    const user = userEvent.setup();
    renderTable();

    const nameHeader = () =>
      within(screen.getByRole("table")).getByRole("columnheader", {
        name: /^Name/,
      });

    expect(nameHeader()).not.toHaveAttribute("aria-sort");
    await user.click(within(nameHeader()).getByRole("button"));
    expect(nameHeader()).toHaveAttribute("aria-sort", "ascending");
    await user.click(within(nameHeader()).getByRole("button"));
    expect(nameHeader()).toHaveAttribute("aria-sort", "descending");
    await user.click(within(nameHeader()).getByRole("button"));
    expect(nameHeader()).not.toHaveAttribute("aria-sort");
  });

  it("resets to page 1 when sorting changes", async () => {
    const user = userEvent.setup();
    const { container } = renderTable();

    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: /^Name/ }));

    expect(bodyRows(container)[0]?.cells[0]).toHaveTextContent("alpha");
  });
});

describe("DataTable CSV export", () => {
  it("exports every sorted row — not just the visible page — with matching headers", async () => {
    const user = userEvent.setup();
    // Value extractors give the sort a proper numeric basis.
    const numericColumns: Array<Column<Row>> = [
      { key: "name", header: "Name" },
      {
        key: "score",
        header: "Score",
        align: "right",
        value: (row: Row) => row.score,
      },
    ];
    render(
      <DataTable
        columns={numericColumns}
        data={ROWS}
        rowKey={(row) => row.id}
        pageSize={2}
        csvFilename="test-export.csv"
      />,
    );

    await user.click(screen.getByRole("button", { name: /^Score/ }));
    await user.click(screen.getByRole("button", { name: "Export CSV" }));

    expect(exportToCsvMock).toHaveBeenCalledTimes(1);
    const [filename, headers, rows] = exportToCsvMock.mock.calls[0] as [
      string,
      string[],
      Array<Array<string | number>>,
    ];
    expect(filename).toBe("test-export.csv");
    expect(headers).toEqual(["Name", "Score"]);
    expect(rows).toEqual([
      ["alpha", 2],
      ["delta", 10],
      ["bravo", 17],
      ["echo", 25],
      ["charlie", 33],
    ]);
  });

  it("uses the column value extractor for computed cells when provided", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={[
          {
            key: "score",
            header: "Score",
            value: (row: Row) => `PT-${row.score}`,
          },
        ]}
        data={[{ id: "r1", name: "delta", score: 10 }]}
        rowKey={(row) => row.id}
        csvFilename="computed.csv"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Export CSV" }));

    expect(exportToCsvMock.mock.calls[0]?.[2]).toEqual([["PT-10"]]);
  });
});

describe("DataTable edge cases", () => {
  it("shows a helpful empty state instead of an empty grid", () => {
    const { container } = renderTable({ data: [] });

    expect(
      screen.getByText(/No records match the current filters/i),
    ).toBeInTheDocument();
    const summary = container.querySelector("nav p");
    expect(summary?.textContent).toContain("of 0 records");
  });

  it("renders custom cell markup through the column renderer", () => {
    render(
      <DataTable
        columns={[
          {
            key: "name",
            header: "Name",
            render: (row: Row) => <em>{`${row.name}!`}</em>,
          },
        ]}
        data={[ROWS[0]!]}
        rowKey={(row) => row.id}
        csvFilename="render.csv"
      />,
    );

    expect(screen.getByText("delta!").tagName).toBe("EM");
  });
});
