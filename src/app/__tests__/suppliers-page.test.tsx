import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SuppliersPage from "@/app/suppliers/page";
import { RoleProvider } from "@/lib/role-context";
import { ToastProvider } from "@/components/ui/Toast";

const mockSearchParams: Record<string, string> = {};

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mockSearchParams),
  useRouter: () => ({ push: jest.fn() }),
}));

function renderPage() {
  return render(
    <ToastProvider>
      <RoleProvider>
        <SuppliersPage />
      </RoleProvider>
    </ToastProvider>,
  );
}

beforeEach(() => {
  for (const key of Object.keys(mockSearchParams)) {
    delete mockSearchParams[key];
  }
});

describe("Suppliers page search integration", () => {
  // Regression guard: the navbar routes /suppliers?q=… and this page must
  // consume it — previously the query param was silently ignored.
  it("seeds the supplier filter from the ?q= navbar search param", () => {
    mockSearchParams["q"] = "ironbridge";
    renderPage();

    const table = screen.getByRole("table");
    expect(within(table).getAllByText(/Ironbridge Stampings/).length).toBeGreaterThan(0);
    expect(within(table).queryByText(/Meridian Precision Castings/)).not.toBeInTheDocument();
  });

  it("matches partial part-category searches case-insensitively via ?q=", () => {
    mockSearchParams["q"] = "stampings";
    const { container } = renderPage();

    expect(within(container).getAllByText(/Ironbridge Stampings/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Halvorsen Fastener Group/i)).not.toBeInTheDocument();
  });

  it("shows the full approved vendor list when no query is present", () => {
    renderPage();

    expect(screen.getByText(/15 of 15 suppliers/)).toBeInTheDocument();
  });

  it("keeps the search input editable after being seeded from the URL", async () => {
    const user = userEvent.setup();
    mockSearchParams["q"] = "ironbridge";
    renderPage();

    const input = screen.getByLabelText(/Search by supplier name or code/i);
    await user.clear(input);
    await user.type(input, "quantum");

    expect(await screen.findByText(/Quantum Springs Inc\./i)).toBeInTheDocument();
    expect(screen.queryByText(/Ironbridge Stampings/i)).not.toBeInTheDocument();
  });
});
