import { Suspense, lazy, useCallback, useState } from 'react';
import Navbar from './components/Navbar';
import SmogShieldDashboard from './components/SmogShieldDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import LanguageProvider from './i18n/LanguageProvider';
import { useLanguage } from './i18n/languageContext.js';
import { GLOBAL_SMOG_HOTSPOTS } from './services/telemetryService';
import { Wind } from 'lucide-react';

// The dashboard is the landing view, so it ships in the initial bundle.
// Every other workspace is split out to keep the first paint light.
const GenAISmogPlanner = lazy(() => import('./components/GenAISmogPlanner'));
const IAQRoomScanner = lazy(() => import('./components/IAQRoomScanner'));
const IAQHackLab = lazy(() => import('./components/IAQHackLab'));
const ImpactLedger = lazy(() => import('./components/ImpactLedger'));
const AssistantChat = lazy(() => import('./components/AssistantChat'));

/**
 * Placeholder shown while a lazily-loaded workspace chunk is fetched.
 */
function WorkspaceFallback() {
  const { t } = useLanguage();
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-20 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="w-10 h-10 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
      <p className="text-sm font-semibold text-slate-600">{t('app.loading', 'Loading workspace…')}</p>
    </div>
  );
}

/**
 * The application shell. Rendered inside {@link LanguageProvider}.
 */
function AppContent() {
  const [selectedHotspot, setSelectedHotspot] = useState(GLOBAL_SMOG_HOTSPOTS[0]);
  const [activeTab, setActiveTabState] = useState('dashboard');
  // Visited workspaces stay mounted so switching tabs preserves the user's
  // work (a generated routine, an uploaded photo, ledger selections).
  const [visitedTabs, setVisitedTabs] = useState(() => ['dashboard']);
  const [avoidedCigarettes, setAvoidedCigarettes] = useState(14.8);
  const [savedCo2, setSavedCo2] = useState(38.2);
  const [resiliencePoints, setResiliencePoints] = useState(70);

  const { t } = useLanguage();

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    setVisitedTabs((prev) => (prev.includes(tab) ? prev : [...prev, tab]));
  }, []);

  const handlePledgeCompleted = useCallback((pts = 20) => {
    setAvoidedCigarettes((prev) => Number((prev + 1.2).toFixed(1)));
    setSavedCo2((prev) => Number((prev + 3.4).toFixed(1)));
    setResiliencePoints((prev) => prev + pts);
  }, []);

  const handleRoutineCompleted = useCallback(() => {
    setAvoidedCigarettes((prev) => Number((prev + 2.5).toFixed(1)));
    setSavedCo2((prev) => Number((prev + 6.8).toFixed(1)));
    setResiliencePoints((prev) => prev + 50);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      <a href="#main-content" className="skip-link">
        {t('app.skipToContent')}
      </a>

      {/* Ambient top glow (decorative) */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-teal-100/40 blur-[100px] pointer-events-none -z-10"
        aria-hidden="true"
      />

      <Navbar
        selectedHotspot={selectedHotspot}
        onSelectHotspot={setSelectedHotspot}
        hotspots={GLOBAL_SMOG_HOTSPOTS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        avoidedCigarettesTotal={avoidedCigarettes}
        savedCo2Total={savedCo2}
        resiliencePoints={resiliencePoints}
      />

      <main
        id="main-content"
        aria-label={t('app.mainContent', 'PureAir Life application content')}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 focus:outline-none"
        tabIndex={-1}
      >
        {visitedTabs.map((tab) => (
          <div
            key={tab}
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            tabIndex={0}
            hidden={tab !== activeTab}
            className="focus:outline-none"
          >
            <Suspense fallback={<WorkspaceFallback />}>
              {tab === 'dashboard' && (
                <SmogShieldDashboard
                  hotspot={selectedHotspot}
                  onNavigateToPlanner={() => setActiveTab('planner')}
                  onNavigateToHackLab={() => setActiveTab('hacklab')}
                />
              )}

              {tab === 'planner' && (
                <GenAISmogPlanner
                  hotspot={selectedHotspot}
                  onLogRoutineCompleted={handleRoutineCompleted}
                />
              )}

              {tab === 'scanner' && <IAQRoomScanner hotspot={selectedHotspot} />}

              {tab === 'hacklab' && <IAQHackLab hotspot={selectedHotspot} />}

              {tab === 'impact' && (
                <ImpactLedger hotspot={selectedHotspot} onPledgeCompleted={handlePledgeCompleted} />
              )}

              {tab === 'chat' && <AssistantChat hotspot={selectedHotspot} />}
            </Suspense>
          </div>
        ))}
      </main>

      <footer
        aria-label={t('app.footerLabel', 'Scientific disclosures and credits')}
        className="border-t border-slate-200 bg-white py-6 sm:py-8 text-xs text-slate-600 mt-12 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-4 text-center lg:text-left">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-100 text-teal-700">
              <Wind className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <span className="font-bold text-slate-900">{t('app.brand')}</span>
            <span>{t('app.footerNote')}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-medium">
            <span>US EPA AQI • WHO 2021 • UC Berkeley Earth Model • UC Davis CR Box</span>
            <span className="text-slate-500" aria-hidden="true">
              •
            </span>
            <span className="text-teal-800 font-bold">Google Gemini Flash</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
          {t('app.disclaimer')}
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ErrorBoundary>
  );
}
