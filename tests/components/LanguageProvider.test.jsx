import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageProvider from '../../src/i18n/LanguageProvider.jsx';
import { useLanguage } from '../../src/i18n/languageContext.js';

const STORAGE_KEY = 'pureair.language';

/**
 * Minimal consumer that exercises the language context directly.
 */
function Probe() {
  const { lang, t, toggleLang, setLang } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="label">{t('nav.dashboard')}</span>
      <button type="button" onClick={toggleLang}>
        toggle
      </button>
      <button type="button" onClick={() => setLang('hi')}>
        set hindi
      </button>
      <button type="button" onClick={() => setLang('fr')}>
        set unsupported
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <LanguageProvider>
      <Probe />
    </LanguageProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = 'en';
});

describe('Language provider', () => {
  it('starts in English by default', () => {
    renderProbe();
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(screen.getByTestId('label')).toHaveTextContent('Smog Shield');
  });

  it('switches the whole tree to Hindi', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(screen.getByTestId('lang')).toHaveTextContent('hi');
    expect(screen.getByTestId('label')).toHaveTextContent('स्मॉग शील्ड');
    expect(document.documentElement.lang).toBe('hi');
  });

  it('persists the chosen language', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(localStorage.getItem(STORAGE_KEY)).toBe('hi');
  });

  it('restores the persisted language on the next mount', async () => {
    localStorage.setItem(STORAGE_KEY, 'hi');

    renderProbe();

    expect(screen.getByTestId('lang')).toHaveTextContent('hi');
    expect(screen.getByTestId('label')).toHaveTextContent('स्मॉग शील्ड');
  });

  it('applies exactly one toggle per click', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('lang')).toHaveTextContent('hi');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('hi');

    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });

  it('does not double-toggle when unrelated state changes force a re-render', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('lang')).toHaveTextContent('hi');

    // Force a remount of the consumer while the provider stays mounted. A
    // toggle implemented inside a state updater would be replayed here and
    // would silently flip the language back.
    await act(async () => {
      screen.getByTestId('lang').dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(screen.getByTestId('lang')).toHaveTextContent('hi');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('hi');
  });

  it('ignores an unsupported stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'fr');
    renderProbe();
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
  });

  it('survives storage being unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => renderProbe()).not.toThrow();
    expect(screen.getByTestId('lang')).toHaveTextContent('en');

    spy.mockRestore();
    setSpy.mockRestore();
  });

  it('sets an explicit language and persists it', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: 'set hindi' }));

    expect(screen.getByTestId('lang')).toHaveTextContent('hi');
    expect(screen.getByTestId('label')).toHaveTextContent('स्मॉग शील्ड');
    expect(document.documentElement.lang).toBe('hi');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('hi');
  });

  it('falls back to the default language for an unsupported value', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: 'set unsupported' }));

    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });
});
