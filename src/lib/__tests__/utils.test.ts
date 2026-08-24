import { cn, daysSince, exportToCsv, formatCurrency, formatDate } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names and drops falsy values", () => {
    expect(cn("a", false && "b", undefined, null, "c", false && "d")).toBe(
      "a c",
    );
  });

  it("returns an empty string when nothing is truthy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});

describe("formatDate", () => {
  it("formats ISO dates as dd MMM yyyy in UTC regardless of machine timezone", () => {
    expect(formatDate("2026-08-01")).toBe("01 Aug 2026");
    expect(formatDate("2026-12-31")).toBe("31 Dec 2026");
    expect(formatDate("2025-09-12")).toBe("12 Sep 2025");
  });

  it("zero-pads single-digit days (dd contract)", () => {
    expect(formatDate("2026-03-05")).toBe("05 Mar 2026");
  });

  it("keeps a date stable at UTC day boundaries (backwards compatibility with stored ISO dates)", () => {
    expect(formatDate("2026-01-01T23:30:00Z")).toBe("01 Jan 2026");
  });

  it("reports Invalid Date for malformed input rather than throwing", () => {
    expect(formatDate("not-a-date")).toBe("Invalid Date");
  });
});

describe("daysSince", () => {
  const now = new Date("2026-08-24T15:00:00Z"); // freeze explicitly via param

  it("counts whole days back to the raised date", () => {
    expect(daysSince("2026-08-12", now)).toBe(12);
    expect(daysSince("2026-08-01", now)).toBe(23);
  });

  it("returns 0 for today and for future dates (no negative open counters)", () => {
    expect(daysSince("2026-08-24T09:00:00Z", now)).toBe(0);
    expect(daysSince("2026-08-30", now)).toBe(0);
  });

  it("handles UTC day boundaries: yesterday 23:59 is one full day ago", () => {
    expect(daysSince("2026-08-23T23:59:59Z", now)).toBe(1);
  });

  it("returns 0 for invalid input instead of NaN", () => {
    expect(daysSince("garbage", now)).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("formats whole dollar amounts without cents", () => {
    expect(formatCurrency(18500)).toBe("$18,500");
  });

  it("rounds fractional amounts to whole dollars", () => {
    expect(formatCurrency(1234.6)).toBe("$1,235");
  });

  it("preserves negative cost impacts (credits)", () => {
    expect(formatCurrency(-500)).toBe("-$500");
  });
});

describe("exportToCsv", () => {
  let createdBlob: Blob | undefined;
  const clicked: Array<{ href: string; download: string }> = [];

  const readBlob = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });

  beforeEach(() => {
    createdBlob = undefined;
    clicked.length = 0;
    (URL as unknown as Record<string, unknown>).createObjectURL = jest.fn(
      (blob: Blob) => {
        createdBlob = blob;
        return "blob:mock";
      },
    );
    (URL as unknown as Record<string, unknown>).revokeObjectURL = jest.fn();
    jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicked.push({ href: this.href, download: this.download });
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("writes headers and rows in order and triggers a download of the given filename", async () => {
    exportToCsv(
      "lots.csv",
      ["Lot", "Qty"],
      [
        ["LOT-1", 400],
        ["LOT-2", 1200],
      ],
    );

    expect(clicked).toHaveLength(1);
    expect(clicked[0]?.download).toBe("lots.csv");
    expect(clicked[0]?.href).toBe("blob:mock");

    const text = await readBlob(createdBlob!);
    expect(text.split("\n")).toEqual(["Lot,Qty", "LOT-1,400", "LOT-2,1200"]);
  });

  it("escapes cells containing commas by quoting them", async () => {
    exportToCsv("notes.csv", ["Note"], [["Flash at parting line, exceeds limit"]]);

    const text = await readBlob(createdBlob!);
    expect(text).toBe('Note\n"Flash at parting line, exceeds limit"');
  });

  it("doubles embedded quotes per RFC 4180 so quoted data survives round-trip", async () => {
    exportToCsv("quotes.csv", ["Statement"], [['He said "reject the lot"']]);

    const text = await readBlob(createdBlob!);
    // Round-trip contract: a CSV parser reading this must recover the original value.
    expect(text).toContain('"He said ""reject the lot"""');
  });

  it("escapes embedded newlines inside a single cell", async () => {
    exportToCsv("multiline.csv", ["Cause"], [["line one\nline two"]]);

    const text = await readBlob(createdBlob!);
    expect(text).toBe('Cause\n"line one\nline two"');
  });

  it("leaves plain alphanumeric identifiers untouched", async () => {
    exportToCsv("parts.csv", ["Part"], [["TNX-3320-D"]]);

    const text = await readBlob(createdBlob!);
    expect(text).toBe("Part\nTNX-3320-D");
  });

  it("neutralizes spreadsheet formula injection from user-controlled fields", async () => {
    exportToCsv("injection.csv", ["Supplier Note"], [
      ['=HYPERLINK("http://evil.example","x")'],
    ]);

    const text = await readBlob(createdBlob!);
    // The cell is quote-prefixed (then RFC-quoted for its own commas/quotes),
    // so a spreadsheet renders it as text instead of executing the formula.
    expect(text).toContain('"\'=HYPERLINK');
  });

  it.each([
    ["+1 payload", "+1 payload"],
    ["@cmd", "@cmd"],
  ])("prefixes risky leading character in %j", async (input) => {
    exportToCsv("risky.csv", ["Note"], [[input]]);

    const text = await readBlob(createdBlob!);
    expect(text).toContain(`'${input}`);
  });

  it("leaves ordinary identifiers and non-leading hyphens untouched", async () => {
    exportToCsv("parts.csv", ["Part", "Note"], [["TNX-3320-D", "ok-part"]]);

    const text = await readBlob(createdBlob!);
    expect(text).toBe("Part,Note\nTNX-3320-D,ok-part");
  });
});
