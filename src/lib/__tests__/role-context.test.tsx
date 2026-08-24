import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleProvider, useRole } from "@/lib/role-context";

// The portal's demo supplier account is scoped to Cascade Polymer Solutions.
const OWN_SUPPLIER_ID = "SUP-003";
const OTHER_SUPPLIER_ID = "SUP-001";

function RoleHarness() {
  const { role, setRole, canView } = useRole();
  return (
    <div>
      <span data-testid="role">{role}</span>
      <span data-testid="can-view-other">{String(canView(OTHER_SUPPLIER_ID))}</span>
      <span data-testid="can-view-own">{String(canView(OWN_SUPPLIER_ID))}</span>
      <button type="button" onClick={() => setRole("Supplier User")}>
        become-supplier
      </button>
      <button type="button" onClick={() => setRole("Quality Manager")}>
        become-manager
      </button>
    </div>
  );
}

describe("role-based record visibility (authorization)", () => {
  it("defaults to Quality Manager who may view every supplier's records", () => {
    render(
      <RoleProvider>
        <RoleHarness />
      </RoleProvider>,
    );

    expect(screen.getByTestId("role")).toHaveTextContent("Quality Manager");
    expect(screen.getByTestId("can-view-own")).toHaveTextContent("true");
    expect(screen.getByTestId("can-view-other")).toHaveTextContent("true");
  });

  it("scopes a Supplier User to their own supplier's records only", async () => {
    const user = userEvent.setup();
    render(
      <RoleProvider>
        <RoleHarness />
      </RoleProvider>,
    );

    await user.click(screen.getByText("become-supplier"));

    // Authorization boundary: cross-tenant access must be denied.
    expect(screen.getByTestId("role")).toHaveTextContent("Supplier User");
    expect(screen.getByTestId("can-view-own")).toHaveTextContent("true");
    expect(screen.getByTestId("can-view-other")).toHaveTextContent("false");
  });

  it("restores full visibility when switching back to Quality Manager", async () => {
    const user = userEvent.setup();
    render(
      <RoleProvider>
        <RoleHarness />
      </RoleProvider>,
    );

    await user.click(screen.getByText("become-supplier"));
    await user.click(screen.getByText("become-manager"));

    expect(screen.getByTestId("can-view-other")).toHaveTextContent("true");
  });

  it("throws a descriptive error when useRole is used outside the provider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<RoleHarness />)).toThrow(
      /useRole must be used within RoleProvider/,
    );
    consoleSpy.mockRestore();
  });
});
