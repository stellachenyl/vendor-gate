import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentVault } from "@/components/quality/DocumentVault";
import { ToastProvider } from "@/components/ui/Toast";
import { documents } from "@/lib/mock-data";

describe("DocumentVault", () => {
  function renderVault() {
    return render(
      <ToastProvider>
        <DocumentVault documents={documents} />
      </ToastProvider>,
    );
  }

  it("lists every controlled document with version and uploader", () => {
    renderVault();

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText(/PPAP Level 3 Submission/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Rev C|v4\.2|v2\.0|Final/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/uploaded \d{2} \w{3} \d{4} by/i).length).toBe(documents.length);
  });

  it("filters the list by approval status", async () => {
    const user = userEvent.setup();
    renderVault();

    await user.selectOptions(screen.getByLabelText(/Filter by approval status/i), [
      "Pending",
    ]);

    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.textContent).toMatch(/Pending/);
    }
    // Approved-only documents are hidden while filtered.
    expect(screen.queryByText(/IMDS Entry Confirmation/i)).not.toBeInTheDocument();
  });

  it("restores the full list when the filter is cleared (idempotent reset)", async () => {
    const user = userEvent.setup();
    renderVault();

    const filter = screen.getByLabelText(/Filter by approval status/i);
    await user.selectOptions(filter, ["Rejected"]);
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);

    await user.selectOptions(filter, ["all"]);
    expect(screen.getAllByRole("listitem")).toHaveLength(documents.length);
  });

  it("shows an empty state when no document matches the filter", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <DocumentVault documents={documents.filter((d) => d.fileType === "docx")} />
      </ToastProvider>,
    );

    await user.selectOptions(screen.getByLabelText(/Filter by approval status/i), [
      "Rejected",
    ]);

    expect(
      screen.getByText(/No documents with the selected approval status/i),
    ).toBeInTheDocument();
  });

  it("confirms downloads with visible feedback", async () => {
    const user = userEvent.setup();
    renderVault();

    const firstItem = screen.getAllByRole("listitem")[0]!;
    await user.click(within(firstItem).getByRole("button", { name: "Download" }));

    expect(await screen.findByRole("status")).toHaveTextContent(/Download started/i);
  });
});
