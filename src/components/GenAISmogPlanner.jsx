import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Users,
  Car,
  Flame,
  Utensils,
  CheckCircle2,
  RefreshCw,
  HeartPulse,
  Leaf,
  AlertCircle
} from 'lucide-react';
import { generateSmogArmorRoutine } from '../services/geminiService';
import { VULNERABLE_PROFILES } from '../services/telemetryService';
import confetti from '../utils/confetti';
import Provenance from './Provenance';
import { useLanguage } from '../i18n/languageContext.js';
import { translatePhrase } from '../i18n/phrases.js';

/**
 * @param {object} props
 * @param {object} props.hotspot
 * @param {() => void} [props.onLogRoutineCompleted]
 */
export default function GenAISmogPlanner({ hotspot, onLogRoutineCompleted }) {
  const { t, lang } = useLanguage();

  const [profile, setProfile] = useState({
    adults: 2,
    children: 1,
    elderly: 1,
    vulnerabilities: ['Toddlers & Infants', 'Asthmatics & Respiratory'],
    commuteMode: 'car',
    commuteDistance: 12,
    heatingType: 'radiant_gas',
    cookingStyle: 'high_heat_frying'
  });

  const [loading, setLoading] = useState(false);
  const [routine, setRoutine] = useState(null);
  const [error, setError] = useState('');
  const [completedBlocks, setCompletedBlocks] = useState({});

  // Guards the completion celebration so React StrictMode's double-invoked
  // effects cannot award impact points twice.
  const celebratedRef = useRef(false);

  const vulnerabilityOptions = useMemo(
    () => Object.values(VULNERABLE_PROFILES).map((p) => translatePhrase(p.name, lang)),
    [lang]
  );

  useEffect(() => {
    const total = routine?.timeBlocks?.length || 0;
    const done = Object.values(completedBlocks).filter(Boolean).length;

    if (total > 0 && done === total && !celebratedRef.current) {
      celebratedRef.current = true;
      confetti({ particleCount: 70, spread: 60 });
      if (onLogRoutineCompleted) onLogRoutineCompleted();
    }
    if (done < total) {
      celebratedRef.current = false;
    }
  }, [completedBlocks, routine, onLogRoutineCompleted]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateSmogArmorRoutine(profile, hotspot, lang);
      setRoutine(result);
    } catch {
      setError(
        t(
          'planner.error',
          'The routine could not be generated right now. Please try again in a moment.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockComplete = (index) => {
    setCompletedBlocks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleVulnerability = (name) => {
    setProfile((prev) => {
      const has = prev.vulnerabilities.includes(name);
      return {
        ...prev,
        vulnerabilities: has
          ? prev.vulnerabilities.filter((v) => v !== name)
          : [...prev.vulnerabilities, name]
      };
    });
  };

  const isLive = routine?.source === 'live';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* ---- Header ---- */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-900 border border-teal-200 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
              {t('planner.engineBadge')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {t('planner.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-2xl leading-relaxed">
              {t('planner.subtitle')} {hotspot.name}
              {t('planner.subtitleCity')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white transition flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>{t('planner.generating')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>{routine ? t('planner.regenerate') : t('planner.generate')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-900 font-medium flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ---- Profile form ---- */}
        <section
          className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 space-y-5 shadow-sm"
          aria-labelledby="planner-profile-heading"
        >
          <h2
            id="planner-profile-heading"
            className="text-base font-bold text-slate-900 flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-teal-700" aria-hidden="true" />
            {t('planner.profileTitle')}
          </h2>

          <div className="space-y-4 text-xs sm:text-sm">
            {/* Household size */}
            <fieldset className="grid grid-cols-3 gap-3">
              <legend className="sr-only">{t('planner.householdSize')}</legend>
              {[
                { key: 'adults', label: t('planner.adults'), min: 1, max: 10 },
                { key: 'children', label: t('planner.children'), min: 0, max: 10 },
                { key: 'elderly', label: t('planner.elderly'), min: 0, max: 10 }
              ].map((field) => (
                <div
                  key={field.key}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center"
                >
                  <label
                    htmlFor={`planner-${field.key}`}
                    className="text-slate-700 text-[11px] font-bold block"
                  >
                    {field.label}
                  </label>
                  <input
                    id={`planner-${field.key}`}
                    type="number"
                    inputMode="numeric"
                    min={field.min}
                    max={field.max}
                    value={profile[field.key]}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        [field.key]: Math.min(
                          field.max,
                          Math.max(field.min, parseInt(e.target.value, 10) || field.min)
                        )
                      }))
                    }
                    className="w-full text-center bg-transparent text-lg font-bold text-slate-900 outline-none mt-1"
                  />
                </div>
              ))}
            </fieldset>

            {/* Vulnerabilities */}
            <fieldset className="space-y-1.5">
              <legend className="text-slate-800 font-bold flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                {t('planner.vulnerabilities')}
              </legend>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {vulnerabilityOptions.map((name) => {
                  const active = profile.vulnerabilities.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleVulnerability(name)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                        active
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-teal-400 hover:bg-slate-50'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Commute */}
            <div className="space-y-1.5">
              <label
                htmlFor="planner-commute"
                className="text-slate-800 font-bold flex items-center gap-1.5"
              >
                <Car className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                {t('planner.commute')}
              </label>
              <select
                id="planner-commute"
                value={profile.commuteMode}
                onChange={(e) => setProfile({ ...profile, commuteMode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:border-teal-500 outline-none"
              >
                <option value="car">{t('planner.commuteCar')}</option>
                <option value="two_wheeler">{t('planner.commuteTwoWheeler')}</option>
                <option value="metro">{t('planner.commuteMetro')}</option>
                <option value="carpool">{t('planner.commuteCarpool')}</option>
                <option value="wfh">{t('planner.commuteWfh')}</option>
              </select>

              <label
                htmlFor="planner-commute-distance"
                className="text-slate-700 font-semibold block pt-1"
              >
                {t('planner.commuteDistance')}
              </label>
              <input
                id="planner-commute-distance"
                type="number"
                inputMode="numeric"
                min="0"
                max="100"
                value={profile.commuteDistance}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    commuteDistance: Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0))
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:border-teal-500 outline-none"
              />
            </div>

            {/* Heating */}
            <div className="space-y-1.5">
              <label
                htmlFor="planner-heating"
                className="text-slate-800 font-bold flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                {t('planner.heating')}
              </label>
              <select
                id="planner-heating"
                value={profile.heatingType}
                onChange={(e) => setProfile({ ...profile, heatingType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:border-teal-500 outline-none"
              >
                <option value="heatpump">{t('planner.heatHeatpump')}</option>
                <option value="radiant_gas">{t('planner.heatGas')}</option>
                <option value="electric_heater">{t('planner.heatElectric')}</option>
                <option value="wood_coal">{t('planner.heatWoodCoal')}</option>
              </select>
            </div>

            {/* Cooking */}
            <div className="space-y-1.5">
              <label
                htmlFor="planner-cooking"
                className="text-slate-800 font-bold flex items-center gap-1.5"
              >
                <Utensils className="w-3.5 h-3.5 text-rose-700" aria-hidden="true" />
                {t('planner.cooking')}
              </label>
              <select
                id="planner-cooking"
                value={profile.cookingStyle}
                onChange={(e) => setProfile({ ...profile, cookingStyle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:border-teal-500 outline-none"
              >
                <option value="high_heat_frying">{t('planner.cookFrying')}</option>
                <option value="covered_steaming">{t('planner.cookSteaming')}</option>
                <option value="induction_clean">{t('planner.cookInduction')}</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 leading-relaxed font-medium">
            {t('planner.contextNote')} <strong>{hotspot.name}</strong>
          </div>
        </section>

        {/* ---- Output ---- */}
        <section className="lg:col-span-7 space-y-4" aria-label={t('planner.output')}>
          {!routine ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div
                className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-4"
                aria-hidden="true"
              >
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t('planner.emptyTitle')}</h3>
              <p className="text-xs sm:text-sm text-slate-700 mt-2 max-w-md leading-relaxed">
                {t('planner.emptyBody')}
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="mt-6 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white transition shadow-sm disabled:opacity-60"
              >
                {loading ? t('planner.generating') : t('planner.emptyCta')}
              </button>
            </div>
          ) : (
            <div className="space-y-4" aria-live="polite">
              {/* Routine header + honest source badge */}
              <div className="p-5 rounded-2xl bg-white border border-teal-300 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
                    <span>{routine.summaryTitle}</span>
                  </h3>
                  <Provenance
                    variant={isLive ? 'live' : 'reference'}
                    label={isLive ? t('ai.responseLive') : t('ai.responseFallback')}
                    title={isLive ? t('ai.responseLive') : t('ai.responseFallback')}
                  />
                </div>
                <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed font-medium">
                  {routine.threatAnalysis}
                </p>
              </div>

              {/* Time blocks */}
              <ol className="space-y-3 list-none p-0 m-0">
                {routine.timeBlocks.map((block, idx) => {
                  const isDone = Boolean(completedBlocks[idx]);
                  return (
                    <li
                      key={idx}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => toggleBlockComplete(idx)}
                            aria-pressed={isDone}
                            aria-label={
                              isDone
                                ? `${t('planner.markIncomplete')}: ${block.time} ${block.phase}`
                                : `${t('planner.markComplete')}: ${block.time} ${block.phase}`
                            }
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : 'border border-slate-400 hover:border-teal-600 text-transparent'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 text-current" aria-hidden="true" />
                          </button>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono font-bold text-teal-800">
                                {block.time}
                              </span>
                              <span className="text-xs font-bold text-slate-900">{block.phase}</span>
                            </div>
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-amber-900 border border-slate-300 inline-block mt-1">
                              {block.hazardLevel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 text-xs sm:text-sm pl-8">
                        <p className="text-slate-800 font-semibold">
                          <strong>{t('planner.routineAction')}</strong> {block.action}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                          <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 font-medium">
                            <span className="font-bold block text-[11px] uppercase text-teal-800">
                              {t('planner.iaqHack')}
                            </span>
                            {block.iaqHack}
                          </div>
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                            <span className="font-bold block text-[11px] uppercase text-emerald-800">
                              {t('planner.sustainableSwap')}
                            </span>
                            {block.sustainableSwap}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2 mt-2">
                          <HeartPulse
                            className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <div>
                            <span className="font-bold text-slate-900">
                              {t('planner.directImpact')}
                            </span>{' '}
                            {block.directImpact}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* Collective impact */}
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <Leaf className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">
                      {t('planner.collectiveImpact')}
                    </h4>
                    <p className="text-xs sm:text-sm text-emerald-900 mt-1 leading-relaxed font-medium">
                      {routine.directImpactStatement}
                    </p>
                  </div>
                </div>
              </div>

              {/* Emergency directive */}
              {routine.emergencyActionAlert && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 font-medium">
                  <AlertCircle
                    className="w-4 h-4 text-rose-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{t('planner.smogProtocol')}</strong> {routine.emergencyActionAlert}
                  </span>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
