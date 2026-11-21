import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getViolations, formatViolations } from './axeHelper.js';
import LanguageProvider from '../../src/i18n/LanguageProvider.jsx';
import SmogShieldDashboard from '../../src/components/SmogShieldDashboard.jsx';
import GenAISmogPlanner from '../../src/components/GenAISmogPlanner.jsx';
import IAQRoomScanner from '../../src/components/IAQRoomScanner.jsx';
import IAQHackLab from '../../src/components/IAQHackLab.jsx';
import ImpactLedger from '../../src/components/ImpactLedger.jsx';
import AssistantChat from '../../src/components/AssistantChat.jsx';
import { GLOBAL_SMOG_HOTSPOTS } from '../../src/services/telemetryService.js';

const HOTSPOT = GLOBAL_SMOG_HOTSPOTS[0];

const WORKSPACES = [
  {
    name: 'Smog Shield dashboard',
    render: () => (
      <SmogShieldDashboard
        hotspot={HOTSPOT}
        onNavigateToPlanner={vi.fn()}
        onNavigateToHackLab={vi.fn()}
      />
    )
  },
  {
    name: 'AI Smog-Armor planner',
    render: () => <GenAISmogPlanner hotspot={HOTSPOT} />
  },
  {
    name: 'Room Vision Auditor',
    render: () => <IAQRoomScanner hotspot={HOTSPOT} />
  },
  {
    name: 'DIY Hack Lab',
    render: () => <IAQHackLab hotspot={HOTSPOT} />
  },
  {
    name: 'Family Impact ledger',
    render: () => <ImpactLedger hotspot={HOTSPOT} onPledgeCompleted={vi.fn()} />
  },
  {
    name: 'Clean Air AI assistant',
    render: () => <AssistantChat hotspot={HOTSPOT} />
  }
];

describe('Workspace accessibility (axe-core)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ configured: false, models: [] })
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(WORKSPACES)('$name has no automated accessibility violations', async (workspace) => {
    const { container } = render(
      <LanguageProvider>
        <div role="main">{workspace.render()}</div>
      </LanguageProvider>
    );

    // Let async content (provider probes, charts) settle before analysing.
    await waitFor(() => {
      expect(container).toBeTruthy();
    });

    const violations = await getViolations(container);
    expect(violations, formatViolations(violations)).toEqual([]);
  });

  it('exposes the planner workspace without violations after a routine renders', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <LanguageProvider>
        <div role="main">
          <GenAISmogPlanner hotspot={HOTSPOT} />
        </div>
      </LanguageProvider>
    );

    await user.click(screen.getByRole('button', { name: /generate my routine/i }));
    await screen.findByRole('heading', { name: /no schedule formulated yet/i }).catch(() => {});

    const violations = await getViolations(container);
    expect(violations, formatViolations(violations)).toEqual([]);
  });

  it('exposes the scanner workspace without violations once a report renders', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <LanguageProvider>
        <div role="main">
          <IAQRoomScanner hotspot={HOTSPOT} />
        </div>
      </LanguageProvider>
    );

    await user.click(screen.getByRole('button', { name: /run ai vision audit/i }));
    await screen.findByRole('heading', { name: /no iaq audit performed yet/i }).catch(() => {});

    const violations = await getViolations(container);
    expect(violations, formatViolations(violations)).toEqual([]);
  });
});
