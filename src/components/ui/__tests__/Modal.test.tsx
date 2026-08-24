import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/FormControls";

const onClose = jest.fn();

function renderModal(open = true) {
  return render(
    <Modal
      open={open}
      onClose={onClose}
      title="Raise Nonconformance Report"
      description="D2 problem description is required."
      footer={<button type="button">Cancel</button>}
    >
      <p>Body content</p>
    </Modal>,
  );
}

beforeEach(() => {
  onClose.mockClear();
});

describe("Modal", () => {
  it("renders dialog semantics and content when open", () => {
    renderModal();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Raise Nonconformance Report");
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    const { container } = renderModal(false);
    expect(container).toBeEmptyDOMElement();
  });

  it("moves focus into the dialog on open for keyboard users", () => {
    renderModal();
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when clicking the backdrop but not the panel itself", () => {
    const { container } = renderModal();
    const overlay = container.firstElementChild as HTMLElement;

    fireEvent.click(overlay); // target === currentTarget (backdrop)
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    fireEvent.click(screen.getByText("Body content")); // inside panel
    expect(onClose).not.toHaveBeenCalled();
  });
});
