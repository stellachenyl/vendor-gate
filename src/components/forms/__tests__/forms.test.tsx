import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewNcrWizard } from "@/components/forms/NewNcrWizard";
import { NewSupplierModal } from "@/components/forms/NewSupplierModal";
import { ToastProvider } from "@/components/ui/Toast";

function openWizard(props?: Partial<Parameters<typeof NewNcrWizard>[0]>) {
  return render(
    <ToastProvider>
      <NewNcrWizard open onClose={() => {}} {...props} />
    </ToastProvider>,
  );
}

const VALID = {
  part: "TNX-3320-D",
  description: "Flange cracking found during incoming dimensional sampling.",
};

describe("NewNcrWizard step gating (validation)", () => {
  it("keeps Next disabled until supplier, part, description and severity are set", async () => {
    const user = userEvent.setup();
    openWizard();
    const dialog = screen.getByRole("dialog");
    const next = within(dialog).getByRole("button", { name: "Next" });
    expect(next).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/^Part Number$/i), VALID.part);
    expect(next).toBeDisabled(); // still missing the rest

    await user.selectOptions(within(dialog).getByLabelText(/^Supplier$/i), ["SUP-004"]);
    await user.type(within(dialog).getByLabelText(/Defect Description/i), VALID.description);
    await user.selectOptions(within(dialog).getByLabelText(/^Severity$/i), ["Major"]);
    expect(next).toBeEnabled();
  });

  it.each([
    ["enforces the 20-character D2 minimum at exactly 20 chars", "x".repeat(20), true],
    ["rejects a 19-character D2 description", "x".repeat(19), false],
  ])("%s", async (_name, text, valid) => {
    const user = userEvent.setup();
    openWizard();
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText(/Defect Description/i), text);
    const next = within(dialog).getByRole("button", { name: "Next" });
    if (valid) {
      // Fill remaining required fields; only length varies.
      await user.selectOptions(within(dialog).getByLabelText(/^Supplier$/i), ["SUP-004"]);
      await user.type(within(dialog).getByLabelText(/^Part Number$/i), VALID.part);
      await user.selectOptions(within(dialog).getByLabelText(/^Severity$/i), ["Minor"]);
      expect(next).toBeEnabled();
    } else {
      await user.selectOptions(within(dialog).getByLabelText(/^Supplier$/i), ["SUP-004"]);
      await user.type(within(dialog).getByLabelText(/^Part Number$/i), VALID.part);
      await user.selectOptions(within(dialog).getByLabelText(/^Severity$/i), ["Minor"]);
      expect(next).toBeDisabled();
    }
  });

  it("retains entered data when navigating Back from step 2", async () => {
    const user = userEvent.setup();
    openWizard();
    const dialog = screen.getByRole("dialog");

    await user.selectOptions(within(dialog).getByLabelText(/^Supplier$/i), ["SUP-008"]);
    await user.type(within(dialog).getByLabelText(/^Part Number$/i), VALID.part);
    await user.type(within(dialog).getByLabelText(/Defect Description/i), VALID.description);
    await user.selectOptions(within(dialog).getByLabelText(/^Severity$/i), ["Major"]);
    await user.click(within(dialog).getByRole("button", { name: "Next" }));

    await user.type(
      within(dialog).getByLabelText(/Interim Containment Action/i),
      "Quarantined lot.",
    );
    await user.click(within(dialog).getByRole("button", { name: "Back" }));

    // State must survive round-tripping between steps.
    expect((within(dialog).getByLabelText(/^Part Number$/i) as HTMLInputElement).value).toBe(
      VALID.part,
    );
  });

  it("retains the draft across a soft close/reopen (documented behavior)", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const { rerender } = render(
      <ToastProvider>
        <NewNcrWizard open onClose={onClose} />
      </ToastProvider>,
    );
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText(/^Part Number$/i), VALID.part);

    rerender(
      <ToastProvider>
        <NewNcrWizard open={false} onClose={onClose} />
      </ToastProvider>,
    );
    rerender(
      <ToastProvider>
        <NewNcrWizard open onClose={onClose} />
      </ToastProvider>,
    );

    // Draft persistence contract: only Cancel/Submit clears the form.
    const reopened = screen.getByRole("dialog");
    expect((within(reopened).getByLabelText(/^Part Number$/i) as HTMLInputElement).value).toBe(
      VALID.part,
    );
  });

  it("clears all fields when cancelled, so reopen starts fresh", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const { rerender } = render(
      <ToastProvider>
        <NewNcrWizard open onClose={onClose} />
      </ToastProvider>,
    );
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText(/^Part Number$/i), VALID.part);
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    rerender(
      <ToastProvider>
        <NewNcrWizard open onClose={onClose} />
      </ToastProvider>,
    );
    const reopened = screen.getByRole("dialog");
    expect((within(reopened).getByLabelText(/^Part Number$/i) as HTMLInputElement).value).toBe("");
  });

  it("accepts an initial supplier preselected via props (deep-link flow)", () => {
    openWizard({ initialSupplierId: "SUP-004" });
    const select = screen.getByRole("dialog").querySelector("select") as HTMLSelectElement;
    expect(select.value).toBe("SUP-004");
  });

  it("tracks attached photo placeholders in the review summary", async () => {
    const user = userEvent.setup();
    openWizard({ initialSupplierId: "SUP-004", initialPartNumber: VALID.part });
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: /Attach photo/i }));
    await user.click(within(dialog).getByRole("button", { name: /Attach photo/i }));
    expect(within(dialog).getByText("2 attached")).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/Defect Description/i), VALID.description);
    await user.selectOptions(within(dialog).getByLabelText(/^Severity$/i), ["Major"]);
    await user.click(within(dialog).getByRole("button", { name: "Next" }));
    await user.click(within(dialog).getByRole("button", { name: "Next" }));
    const photoCell = within(dialog).getAllByText(/IMG_100\d\.jpg/)[0]!.textContent!;
    expect(photoCell).toContain("IMG_1000.jpg");
    expect(photoCell).toContain("IMG_1001.jpg");
  });
});

describe("NewSupplierModal validation", () => {
  it("disables creation until name and code are provided", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <NewSupplierModal open onClose={() => {}} />
      </ToastProvider>,
    );
    const create = screen.getByRole("button", { name: /Create Supplier/i });
    expect(create).toBeDisabled();

    await user.type(screen.getByLabelText(/Supplier Name/i), "Meridian Tooling Sdn Bhd");
    expect(create).toBeDisabled(); // code still missing
    await user.type(screen.getByLabelText(/^Code$/i), "mts");
    expect(create).toBeEnabled();

    // Contract: code normalizes to uppercase for the AVL.
    expect(screen.getByLabelText(/^Code$/i)).toHaveValue("MTS");
  });
});
