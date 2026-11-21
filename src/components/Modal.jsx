import { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Decide whether an element can currently receive keyboard focus.
 *
 * `offsetParent` is the usual shortcut, but it is `null` for every
 * `position: fixed` descendant and it is not implemented at all in jsdom, so
 * the focus trap silently stopped working. The computed style check works in
 * both environments and still skips genuinely hidden controls.
 *
 * @param {HTMLElement} element
 * @returns {boolean}
 */
function isFocusable(element) {
  if (element === document.activeElement) return true;
  if (element.hasAttribute('hidden')) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;

  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

/**
 * Accessible modal dialog with focus trapping and focus restoration.
 *
 * Implements the WAI-ARIA dialog pattern: focus moves into the dialog on
 * open, Tab cycles inside it, Escape closes it, and focus returns to the
 * element that triggered it.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.title
 * @param {string} props.description
 * @param {React.ReactNode} props.children
 * @param {string} [props.closeLabel]
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  closeLabel = 'Close dialog'
}) {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  const focusableSelector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusables = [...dialogRef.current.querySelectorAll(focusableSelector)].filter((el) =>
        isFocusable(el)
      );

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;

    const dialog = dialogRef.current;
    if (dialog) {
      const target =
        dialog.querySelector('[data-autofocus]') || dialog.querySelector(focusableSelector);
      target?.focus();
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      const previous = previouslyFocused.current;
      if (previous && typeof previous.focus === 'function') {
        previous.focus();
      }
    };
  }, [open, focusableSelector]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-fade-in"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 id="modal-title" className="text-lg sm:text-xl font-extrabold text-slate-900">
              {title}
            </h2>
            {description && (
              <p
                id="modal-description"
                className="text-xs sm:text-sm text-slate-600 leading-relaxed"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="shrink-0 w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
