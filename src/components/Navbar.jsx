import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Wind, MapPin, Lock, HeartPulse, Search, X, Languages, ShieldCheck, Settings } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../i18n/languageContext.js';
import {
  clearClientSuppliedKey,
  getProviderStatus,
  setClientSuppliedKey
} from '../services/geminiService.js';

/**
 * @param {object} props
 * @param {object} props.selectedHotspot
 * @param {(city: object) => void} props.onSelectHotspot
 * @param {Array<object>} props.hotspots
 * @param {string} props.activeTab
 * @param {(tab: string) => void} props.setActiveTab
 * @param {number} [props.avoidedCigarettesTotal]
 * @param {number} [props.savedCo2Total]
 * @param {number} [props.resiliencePoints]
 */
export default function Navbar({
  selectedHotspot,
  onSelectHotspot,
  hotspots,
  activeTab,
  setActiveTab,
  avoidedCigarettesTotal = 14.8,
  savedCo2Total = 38.2,
  resiliencePoints = 70
}) {
  const { t, lang, toggleLang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [providerStatus, setProviderStatus] = useState({ configured: null, transport: 'none' });
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [draftKey, setDraftKey] = useState('');
  const [keyMessage, setKeyMessage] = useState('');
  const dropdownRef = useRef(null);
  const tabRefs = useRef({});
  const searchId = useId();
  const keyInputId = useId();

  // Close the city dropdown on outside click or Escape.
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isCityDropdownOpen) {
        setIsCityDropdownOpen(false);
      }
    }
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsCityDropdownOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCityDropdownOpen]);

  // Probe the AI provider once on mount.
  useEffect(() => {
    let cancelled = false;
    getProviderStatus().then((status) => {
      if (!cancelled) setProviderStatus(status);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCities = hotspots.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.state && h.state.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (h.region && h.region.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const navItems = useMemo(
    () => [
      { id: 'dashboard', label: t('nav.dashboard') },
      { id: 'planner', label: t('nav.planner'), badge: 'AI' },
      { id: 'scanner', label: t('nav.scanner'), badge: 'Vision' },
      { id: 'hacklab', label: t('nav.hacklab') },
      { id: 'impact', label: t('nav.impact') },
      { id: 'chat', label: t('nav.chat') }
    ],
    [t]
  );

  /**
   * Roving-tabindex keyboard support for the tablist (WAI-ARIA APG).
   * @param {KeyboardEvent} event
   */
  const handleTabKeyDown = useCallback(
    (event) => {
      const index = navItems.findIndex((item) => item.id === activeTab);
      if (index === -1) return;

      let nextIndex = null;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % navItems.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + navItems.length) % navItems.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = navItems.length - 1;

      if (nextIndex === null) return;

      event.preventDefault();
      const nextId = navItems[nextIndex].id;
      setActiveTab(nextId);
      tabRefs.current[nextId]?.focus();
    },
    [activeTab, navItems, setActiveTab]
  );

  const handleSaveKey = () => {
    const ok = setClientSuppliedKey(draftKey);
    if (!ok) {
      setKeyMessage(t('ai.keyInvalid'));
      return;
    }
    setKeyMessage(t('ai.keySaved'));
    setDraftKey('');
    setProviderStatus({ configured: true, transport: 'direct', models: [] });
    window.setTimeout(() => setIsProviderDialogOpen(false), 900);
  };

  const handleRemoveKey = () => {
    clearClientSuppliedKey();
    setDraftKey('');
    setKeyMessage('');
    setProviderStatus({ configured: false, transport: 'none', models: [] });
  };

  const providerConfigured = providerStatus.configured === true;
  const providerChecked = providerStatus.configured !== null;

  return (
    <header
      role="banner"
      aria-label={t('app.brand')}
      className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-16 sm:h-20">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            aria-label={t('nav.home')}
            className="flex items-center gap-3 group text-left cursor-pointer border-0 bg-transparent p-0 shrink-0"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shadow-md shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-all">
              <Wind className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
                  PureAir <span className="text-teal-600">Life</span>
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 rounded-full">
                  {t('app.allIndiaCities')} ({hotspots.length})
                </span>
              </div>
              <p className="text-xs text-slate-600 hidden lg:block">{t('app.tagline')}</p>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* ---- Searchable city selector ---- */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsCityDropdownOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={isCityDropdownOpen}
                aria-controls={`${searchId}-listbox`}
                aria-label={`${t('nav.selectCity')}. ${t('nav.currentlySelected')}: ${selectedHotspot.name}, AQI ${selectedHotspot.aqi}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 hover:border-teal-400 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer text-left"
              >
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" aria-hidden="true" />
                <div className="leading-tight">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                    {selectedHotspot.name}
                  </span>
                  <span className="text-[11px] text-teal-800 font-semibold block">
                    AQI {selectedHotspot.aqi} • {selectedHotspot.state || 'India'}
                  </span>
                </div>
              </button>

              {isCityDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-3 flex flex-col">
                  <div className="relative mb-2">
                    <label htmlFor={searchId} className="sr-only">
                      {t('nav.filterCities')}
                    </label>
                    <Search
                      className="w-4 h-4 text-slate-500 absolute left-3 top-3"
                      aria-hidden="true"
                    />
                    <input
                      id={searchId}
                      type="text"
                      placeholder={t('nav.searchCity')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:border-teal-500"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label={t('nav.clearSearch')}
                        className="absolute right-2.5 top-2.5 text-slate-600 hover:text-slate-900 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <span
                    id={`${searchId}-label`}
                    className="text-[11px] font-bold uppercase tracking-wider text-slate-600 px-2 py-1 block"
                  >
                    {t('nav.availableCities')} ({filteredCities.length})
                  </span>

                  <ul
                    id={`${searchId}-listbox`}
                    role="listbox"
                    aria-labelledby={`${searchId}-label`}
                    className="overflow-y-auto max-h-64 space-y-1 pr-1 list-none p-0 m-0"
                  >
                    {filteredCities.map((c) => {
                      const isSelected = selectedHotspot.id === c.id;
                      return (
                        <li key={c.id} role="none">
                          <button
                            role="option"
                            aria-selected={isSelected}
                            type="button"
                            onClick={() => {
                              onSelectHotspot(c);
                              setIsCityDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <span className="flex flex-col">
                              <span className="block font-medium">{c.name}</span>
                              <span className="text-[11px] text-slate-600">
                                {c.state} • {c.region}
                              </span>
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                c.aqi > 250
                                  ? 'bg-rose-100 text-rose-900'
                                  : c.aqi > 150
                                    ? 'bg-orange-100 text-orange-900'
                                    : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              AQI {c.aqi}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* ---- Language switch ---- */}
            <button
              type="button"
              onClick={toggleLang}
              data-testid="language-toggle"
              aria-label={t('nav.switchToHindi')}
              aria-pressed={lang === 'hi'}
              title={t('nav.switchToHindi')}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold text-slate-800 transition"
            >
              <Languages className="w-4 h-4 text-teal-600" aria-hidden="true" />
              <span aria-hidden="true">{lang === 'hi' ? 'EN' : 'हिं'}</span>
            </button>

            {/* ---- Cumulative family impact ---- */}
            <div className="hidden lg:flex flex-col items-end leading-tight px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                {t('nav.avoided')}: <strong>{avoidedCigarettesTotal}</strong> {t('nav.cigEquivalent')}
              </span>
              <span className="text-[11px] font-medium text-emerald-800">
                {savedCo2Total} kg CO2 • {t('impact.resiliencePoints')} {resiliencePoints}
              </span>
            </div>

            {/* ---- AI provider status (honest, reflects real reachability) ---- */}
            <button
              type="button"
              onClick={() => setIsProviderDialogOpen(true)}
              data-testid="ai-status"
              aria-label={
                providerConfigured
                  ? `${t('ai.live')}. ${t('ai.configure')}`
                  : `${t('ai.offline')}. ${t('ai.configure')}`
              }
              title={providerConfigured ? t('ai.live') : t('ai.offline')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold border select-none shadow-sm transition ${
                providerConfigured
                  ? 'text-teal-900 bg-teal-50 border-teal-200 hover:bg-teal-100/70'
                  : 'text-amber-900 bg-amber-50 border-amber-300 hover:bg-amber-100/70'
              }`}
            >
              {providerConfigured ? (
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {providerChecked ? (providerConfigured ? t('ai.live') : t('ai.offline')) : '…'}
              </span>
            </button>
          </div>
        </div>

        {/* ---- Navigation tabs ---- */}
        <nav aria-label={t('nav.mainTabs')}>
          <div
            role="tablist"
            aria-label={t('nav.mainTabs')}
            onKeyDown={handleTabKeyDown}
            className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar border-t border-slate-100"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabRefs.current[item.id] = el;
                  }}
                  role="tab"
                  id={`tab-${item.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${item.id}`}
                  tabIndex={isActive ? 0 : -1}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.2 text-[10px] font-bold uppercase rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-900'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <Modal
        open={isProviderDialogOpen}
        onClose={() => {
          setIsProviderDialogOpen(false);
          setKeyMessage('');
        }}
        title={t('ai.configureTitle')}
        description={t('ai.configureIntro')}
        closeLabel={t('ai.cancel')}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                providerConfigured ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
              }`}
              aria-hidden="true"
            >
              {providerConfigured ? (
                <ShieldCheck className="w-4.5 h-4.5" />
              ) : (
                <Settings className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">
                {providerConfigured ? t('ai.live') : t('ai.offline')}
              </p>
              <p className="text-[11px] text-slate-600">
                {providerConfigured
                  ? providerStatus.transport === 'proxy'
                    ? 'Server-side key (secure proxy).'
                    : 'Session key (this browser tab only).'
                  : `${t('ai.localGuide')} — ${t('ai.offline')}`}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={keyInputId} className="block text-xs font-bold text-slate-800">
              {t('ai.keyLabel')}
            </label>
            <input
              id={keyInputId}
              data-autofocus
              type="password"
              autoComplete="off"
              spellCheck="false"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              placeholder="AIza..."
              aria-describedby={`${keyInputId}-hint`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-mono outline-none focus:border-teal-500"
            />
            <p id={`${keyInputId}-hint`} className="text-[11px] text-slate-600">
              {t('ai.keyHint')}
            </p>
          </div>

          {keyMessage && (
            <p
              role="status"
              aria-live="polite"
              className={`text-xs font-semibold ${
                keyMessage === t('ai.keyInvalid') ? 'text-rose-700' : 'text-teal-800'
              }`}
            >
              {keyMessage}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveKey}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition"
            >
              {t('ai.saveKey')}
            </button>
            <button
              type="button"
              onClick={handleRemoveKey}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition"
            >
              {t('ai.clearKey')}
            </button>
            <button
              type="button"
              onClick={() => setIsProviderDialogOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
            >
              {t('ai.cancel')}
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
