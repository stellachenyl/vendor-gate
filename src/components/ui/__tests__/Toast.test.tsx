import { act, fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "@/components/ui/Toast";

function ToastHarness() {
  const { showToast } = useToast();
  return (
    <div>
      <button type="button" onClick={() => showToast("NCR saved", "success")}>
        success
      </button>
      <button type="button" onClick={() => showToast("Upload failed", "error")}>
        error
      </button>
      <button type="button" onClick={() => showToast("Queued for review")}>
        info
      </button>
    </div>
  );
}

function renderHarness() {
  return render(
    <ToastProvider>
      <ToastHarness />
    </ToastProvider>,
  );
}

describe("Toast notifications", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  function showToast(buttonName: RegExp) {
    renderHarness();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: buttonName }));
    });
  }

  it("renders the message in a live region so screen readers announce it", () => {
    showToast(/success/);

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("NCR saved");
  });

  it("applies the variant styling for each toast kind", () => {
    showToast(/error/);
    expect(screen.getByText("Upload failed").className).toContain("bg-red-50");
  });

  it("auto-dismisses after four seconds (idempotent expiry)", async () => {
    showToast(/info/);
    expect(screen.getByText("Queued for review")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(screen.queryByText("Queued for review")).not.toBeInTheDocument();

    // Advancing further must not throw or resurrect anything.
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(screen.queryByText("Queued for review")).not.toBeInTheDocument();
  });

  it("keeps later toasts visible while an earlier one expires", () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: /success/ }));
    act(() => {
      jest.advanceTimersByTime(2500);
    });
    fireEvent.click(screen.getByRole("button", { name: /error/ }));

    act(() => {
      jest.advanceTimersByTime(1500); // first toast expires at t=4000
    });
    expect(screen.queryByText("NCR saved")).not.toBeInTheDocument();
    expect(screen.getByText("Upload failed")).toBeInTheDocument();
  });
});
