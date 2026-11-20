import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Sun,
  Clock,
  HeartPulse,
  Sparkles,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { generateDiurnalCurve, getAQICategory, VULNERABLE_PROFILES } from '../services/telemetryService';
import Provenance from './Provenance';
import { useLanguage } from '../i18n/languageContext.js';
import { translatePhrase } from '../i18n/phrases.js';

/**
 * @param {object} props
 * @param {object} props.hotspot
 * @param {() => void} props.onNavigateToPlanner
 * @param {() => void} props.onNavigateToHackLab
 */
export default function SmogShieldDashboard({
  hotspot,
  onNavigateToPlanner,
  onNavigateToHackLab
}) {
  const { t, lang } = useLanguage();
  const [selectedVulnerability, setSelectedVulnerability] = useState('toddler');

  // The curve only depends on the selected city, so avoid recomputing it on
  // every unrelated re-render.
  const diurnalData = useMemo(
    () => generateDiurnalCurve(hotspot.pm25, lang),
    [hotspot.pm25, lang]
  );
  const currentCategory = getAQICategory(hotspot.aqi, lang);
  const profileData = VULNERABLE_PROFILES[selectedVulnerability];

  // Resolved once on mount: reading the clock during render would make the
  // output unstable between renders.
  const [currentHour] = useState(() => new Date().getHours());
  const isCurrentlyInSafeWindow = currentHour >= 12 && currentHour <= 15;

  const chartSummary = t(
    'dash.chartSummary',
    `Modelled 24-hour PM2.5 curve for ${hotspot.name}. Peak concentrations occur between 06:00 and 09:30 and again after 18:00; the lowest modelled values fall in the 12:00 to 15:30 safe window.`
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* ---- Hero banner ---- */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-teal-100/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"
          aria-hidden="true"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Provenance
                variant="reference"
                label={t('dash.referenceBaseline')}
                title={t('dash.notLive')}
              />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                {t('dash.inversion')}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {hotspot.name}
              </h1>
              <p className="text-sm sm:text-base text-slate-700 mt-1 flex items-center gap-2">
                <span>{translatePhrase(hotspot.smogType, lang)}</span>
                <span className="text-slate-500" aria-hidden="true">
                  •
                </span>
                <span className="text-amber-800 font-semibold">
                  {translatePhrase(hotspot.inversionStrength, lang)}
                </span>
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border ${
                hotspot.aqi > 250
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    hotspot.aqi > 250 ? 'text-rose-600' : 'text-amber-600'
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <span className="font-bold text-sm sm:text-base">
                    {t('dash.status')} {translatePhrase(hotspot.status, lang)} (AQI {hotspot.aqi})
                  </span>
                  <p className="text-xs sm:text-sm mt-1 leading-relaxed font-medium">
                    {currentCategory.advice}
                  </p>
                </div>
              </div>
            </div>

            {/* ---- Metric tiles ---- */}
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <dt className="text-[11px] uppercase tracking-wider text-slate-600 font-bold block">
                  {t('dash.pm25')}
                </dt>
                <dd className="mt-1">
                  <span className="text-2xl font-black text-rose-700">{hotspot.pm25}</span>
                  <span className="text-[11px] text-slate-600"> µg/m³</span>
                  <span className="text-[11px] font-semibold text-rose-800 block">
                    {(hotspot.pm25 / 15).toFixed(1)}x {t('dash.whoLimit')}
                  </span>
                </dd>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <dt className="text-[11px] uppercase tracking-wider text-slate-600 font-bold block">
                  {t('dash.pm10')}
                </dt>
                <dd className="mt-1">
                  <span className="text-2xl font-black text-amber-700">{hotspot.pm10}</span>
                  <span className="text-[11px] text-slate-600"> µg/m³</span>
                  <span className="text-[11px] font-semibold text-amber-800 block">
                    {t('dash.dustTrap')}
                  </span>
                </dd>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <dt className="text-[11px] uppercase tracking-wider text-slate-600 font-bold block">
                  {t('dash.no2')}
                </dt>
                <dd className="mt-1">
                  <span className="text-2xl font-black text-cyan-800">{hotspot.no2}</span>
                  <span className="text-[11px] text-slate-600"> ppb</span>
                  <span className="text-[11px] font-semibold text-slate-700 block">
                    {t('dash.combustionGas')}
                  </span>
                </dd>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <dt className="text-[11px] uppercase tracking-wider text-slate-600 font-bold block">
                  {t('dash.tempHum')}
                </dt>
                <dd className="mt-1">
                  <span className="text-2xl font-black text-slate-900">{hotspot.temp}°C</span>
                  <span className="text-[11px] text-slate-600">/ {hotspot.humidity}%</span>
                  <span className="text-[11px] font-semibold text-teal-800 block">
                    {t('dash.coldInversion')}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* ---- Safe window + actions ---- */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-700" aria-hidden="true" />
                  {t('dash.safeWindow')}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isCurrentlyInSafeWindow
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {isCurrentlyInSafeWindow ? t('dash.windowOpen') : t('dash.windowNext')}
                </span>
              </div>

              <div className="mt-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="text-lg font-extrabold text-teal-800">{hotspot.safeWindow}</div>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                  {t('dash.safeWindowExplainer')}{' '}
                  <strong>{t('dash.safeWindowCta')}</strong>
                </p>
                <Provenance variant="advisory" className="mt-2.5" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-700 block">
                {t('dash.peakHours')}
              </span>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" aria-hidden="true" />
                <span className="font-medium">
                  {hotspot.peakSmogHours} — {t('dash.peakHoursAdvice')}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onNavigateToPlanner}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-teal-600 text-white hover:bg-teal-700 transition flex items-center justify-center gap-1.5 shadow-sm shadow-teal-600/20"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>{t('dash.generateRoutine')}</span>
              </button>
              <button
                type="button"
                onClick={onNavigateToHackLab}
                className="py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-white hover:bg-slate-100 text-slate-800 transition border border-slate-200 flex items-center justify-center gap-1 shadow-sm"
              >
                <span>{t('dash.diyHacks')}</span>
                <ChevronRight className="w-4 h-4 text-slate-600" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Diurnal curve ---- */}
      <section
        className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm"
        aria-labelledby="diurnal-heading"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2
              id="diurnal-heading"
              className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2"
            >
              <Sun className="w-5 h-5 text-amber-600" aria-hidden="true" />
              {t('dash.diurnal')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {t('dash.diurnalExplainer')}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-rose-800">
              <span className="w-3 h-3 rounded-md bg-rose-500" aria-hidden="true" />{' '}
              {t('dash.legendPeak')}
            </span>
            <span className="flex items-center gap-1.5 text-teal-800">
              <span className="w-3 h-3 rounded-md bg-teal-500" aria-hidden="true" />{' '}
              {t('dash.legendSafe')}
            </span>
            <Provenance variant="estimated" />
          </div>
        </div>

        <div className="relative w-full overflow-x-auto pb-2">
          <div className="min-w-[680px]">
            <div
              role="img"
              aria-label={chartSummary}
              className="h-44 w-full relative flex items-end justify-between gap-1 pt-6 px-2 bg-slate-50 rounded-2xl border border-slate-200"
            >
              {diurnalData.map((d, index) => {
                const maxPM = 500;
                const heightPercent = Math.min(100, Math.max(12, (d.pm25 / maxPM) * 100));
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  >
                    <div className="absolute -top-16 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-20 pointer-events-none p-2 rounded-xl bg-slate-900 text-white shadow-xl text-center whitespace-nowrap min-w-[130px]">
                      <span className="text-[11px] font-bold block">
                        {d.hour} • AQI {d.aqi}
                      </span>
                      <span className="text-[11px] text-teal-300 block">
                        PM2.5: {d.pm25} µg/m³
                      </span>
                      <span className="text-[10px] text-slate-200 block">{d.action}</span>
                    </div>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[22px] rounded-t-lg transition-all duration-300 group-hover:brightness-95 ${
                        d.isSafeWindow
                          ? 'bg-gradient-to-t from-teal-600 to-emerald-400 ring-1 ring-teal-400/50'
                          : d.isSeverePeak
                            ? 'bg-gradient-to-t from-rose-600 to-red-400'
                            : 'bg-gradient-to-t from-amber-500 to-amber-300'
                      }`}
                    ></div>

                    <span className="text-[10px] text-slate-600 mt-2 block font-mono font-medium">
                      {d.hourNum % 3 === 0 ? d.hour : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-center">
              {[
                {
                  range: '00:00 - 06:00',
                  title: t('dash.phaseNight'),
                  note: t('dash.phaseNightNote'),
                  tone: 'bg-slate-50 border-slate-200 text-slate-700'
                },
                {
                  range: '06:00 - 09:30',
                  title: t('dash.phaseMorning'),
                  note: t('dash.phaseMorningNote'),
                  tone: 'bg-rose-50 border-rose-200 text-rose-900'
                },
                {
                  range: '12:00 - 15:30',
                  title: t('dash.phaseSafe'),
                  note: t('dash.phaseSafeNote'),
                  tone: 'bg-emerald-50 border-emerald-200 text-emerald-900'
                },
                {
                  range: '18:00 - 22:00',
                  title: t('dash.phaseEvening'),
                  note: t('dash.phaseEveningNote'),
                  tone: 'bg-rose-50 border-rose-200 text-rose-900'
                }
              ].map((phase) => (
                <div key={phase.range} className={`p-2.5 rounded-xl border text-xs ${phase.tone}`}>
                  <span className="block text-[11px] font-medium opacity-80">{phase.range}</span>
                  <span className="font-bold block">{phase.title}</span>
                  <span className="text-[11px] font-semibold block opacity-90">{phase.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Vulnerable family member matrix ---- */}
      <section
        className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm"
        aria-labelledby="vulnerable-heading"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2
              id="vulnerable-heading"
              className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2"
            >
              <HeartPulse className="w-5 h-5 text-teal-700" aria-hidden="true" />
              {t('dash.vulnerableTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {t('dash.vulnerableExplainer')}
            </p>
          </div>

          <div
            role="tablist"
            aria-label={t('dash.vulnerableTabs')}
            className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar"
          >
            {Object.keys(VULNERABLE_PROFILES).map((key) => {
              const item = VULNERABLE_PROFILES[key];
              const isSelected = selectedVulnerability === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls="vulnerable-profile-panel"
                  onClick={() => setSelectedVulnerability(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/80'
                  }`}
                >
                  <span>{translatePhrase(item.name, lang)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          id="vulnerable-profile-panel"
          role="tabpanel"
          className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 rounded-2xl bg-slate-50 border border-slate-200"
        >
          <div className="md:col-span-4 space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200 inline-block">
              {t('dash.criticalThreshold')} {profileData.criticalAqiThreshold}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">
              {translatePhrase(profileData.name, lang)}
            </h3>
            <p className="text-xs sm:text-sm text-amber-900 font-semibold">
              {translatePhrase(profileData.lungVulnerability, lang)}
            </p>
            <div className="text-xs text-slate-700 pt-1">
              {t('dash.currentCityAqi')}{' '}
              <strong className="text-slate-900">{hotspot.aqi}</strong>{' '}
              <span
                className={`font-bold ${
                  hotspot.aqi > profileData.criticalAqiThreshold ? 'text-rose-700' : 'text-teal-800'
                }`}
              >
                {hotspot.aqi > profileData.criticalAqiThreshold
                  ? t('dash.dangerouslyAbove')
                  : t('dash.withinLimit')}
              </span>{' '}
              {t('dash.toleranceLimit')}
            </div>
          </div>

          <div className="md:col-span-8 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
              {t('dash.directives')}
            </span>
            <ul className="space-y-2.5 list-none p-0 m-0">
              {profileData.guidelines.map((guide, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 shadow-sm"
                >
                  <CheckCircle2
                    className="w-4 h-4 text-teal-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="font-medium">{translatePhrase(guide, lang)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
