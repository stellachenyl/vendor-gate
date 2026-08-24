import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "@/components/layout/Navbar";
import { RoleProvider } from "@/lib/role-context";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/",
}));

function renderNavbar() {
  return render(
    <RoleProvider>
      <Navbar />
    </RoleProvider>,
  );
}

beforeEach(() => {
  mockPush.mockClear();
});

describe("Navbar primary navigation", () => {
  it("renders the brand and every required section link", () => {
    renderNavbar();

    expect(screen.getByText(/Totalonics/)).toBeInTheDocument();
    for (const label of [
      "Dashboard",
      "Suppliers",
      "Inspections",
      "NCRs",
      "Documents",
      "Audits",
      "Reports",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the active route with aria-current", () => {
    renderNavbar();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Suppliers" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

describe("Navbar global search", () => {
  it("routes supplier/part searches to the suppliers page as an encoded query", async () => {
    const user = userEvent.setup();
    renderNavbar();

    const input = screen.getByLabelText(/Search supplier name or part number/i);
    await user.type(input, "ironbridge & sons{Enter}");

    // Encoding contract: reserved characters must not break the URL.
    expect(mockPush).toHaveBeenCalledWith("/suppliers?q=ironbridge%20%26%20sons");
  });

  it("submits an empty search without crashing", async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.type(screen.getByRole("searchbox"), "{Enter}");
    expect(mockPush).toHaveBeenCalledWith("/suppliers?q=");
  });

  it("opens the New NCR intake form from the primary action", async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole("button", { name: /New NCR/i }));
    expect(mockPush).toHaveBeenCalledWith("/ncrs/new");
  });
});

describe("Navbar role switcher", () => {
  it("exposes the role switcher menu with both roles", async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole("button", { name: /Quality Manager/i }));

    const menu = screen.getByRole("menu", { name: /Switch role/i });
    expect(menu).toHaveTextContent("Quality Manager");
    expect(menu).toHaveTextContent("Supplier User");
  });

  it("switches identity to the Supplier User account on selection", async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole("button", { name: /Quality Manager/i }));
    await user.click(screen.getByRole("menuitemradio", { name: "Supplier User" }));

    // Header now shows the supplier identity; reopening shows the checked state.
    expect(screen.getByText("Cascade Polymer")).toBeInTheDocument();
    expect(screen.getByText("Supplier User")).toBeInTheDocument();
  });

  it("closes the role menu on Escape", async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole("button", { name: /Quality Manager/i }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
