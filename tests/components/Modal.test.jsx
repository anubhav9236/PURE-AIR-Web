import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../../src/components/Modal.jsx';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal open={false} onClose={() => {}} title="Hidden" description="Nope">
        <p>Body</p>
      </Modal>
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exposes a modal dialog with an accessible name and description', () => {
    render(
      <Modal open onClose={() => {}} title="Configure AI" description="Add a session key.">
        <p>Body</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Configure AI');
    expect(dialog).toHaveAccessibleDescription('Add a session key.');
  });

  it('omits aria-describedby when no description is supplied', () => {
    render(
      <Modal open onClose={() => {}} title="No description">
        <p>Body</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });

  it('moves focus into the dialog on open', async () => {
    function Harness() {
      return (
        <>
          <button type="button">outside trigger</button>
          <Modal open onClose={() => {}} title="Focus test" description="d">
            <button type="button" data-autofocus>
              inside
            </button>
          </Modal>
        </>
      );
    }

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'inside' })).toHaveFocus();
    });
  });

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal open onClose={onClose} title="Escape test" description="d">
        <button type="button">inside</button>
      </Modal>
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the close button is activated', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal open onClose={onClose} title="Close button" description="d">
        <button type="button">inside</button>
      </Modal>
    );

    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses a custom close label when one is supplied', () => {
    render(
      <Modal open onClose={() => {}} title="t" description="d" closeLabel="Cancel">
        <p>Body</p>
      </Modal>
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('traps Tab inside the dialog', async () => {
    const user = userEvent.setup();

    render(
      <Modal open onClose={() => {}} title="Trap test" description="d">
        <button type="button">first</button>
        <button type="button">last</button>
      </Modal>
    );

    // The dialog's own close control is the first focusable element.
    const close = screen.getByRole('button', { name: 'Close dialog' });
    const last = screen.getByRole('button', { name: 'last' });

    last.focus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it('locks body scrolling while open and restores it after close', () => {
    const { rerender } = render(
      <Modal open onClose={() => {}} title="Scroll" description="d">
        <p>Body</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal open={false} onClose={() => {}} title="Scroll" description="d">
        <p>Body</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('');
  });
});
