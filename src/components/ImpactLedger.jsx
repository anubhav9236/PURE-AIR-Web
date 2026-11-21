import { useMemo, useState } from 'react';
import { HeartPulse, Cigarette, Leaf, Shield, Award, Users, CheckCircle2 } from 'lucide-react';
import {
  calculateBerkeleyEarthCigarettes,
  calculateSustainableSavings
} from '../services/iaqCalculatorService';
import confetti from '../utils/confetti';
import Provenance from './Provenance';
import { useLanguage } from '../i18n/languageContext.js';

const INITIAL_PLEDGES = [
  {
    id: 1,
    title: 'Avoided outdoor morning cardio before 10 AM',
    completed: true,
    points: 15
  },
  {
    id: 2,
    title: 'Sealed bedroom window drafts with bubble wrap / foam tape',
    completed: true,
    points: 25
  },
  {
    id: 3,
    title: 'Ran Corsi-Rosenthal Box / HEPA in living zone throughout night',
    completed: true,
    points: 30
  },
  {
    id: 4,
    title: 'Switched from single-car commute to electric metro / vanpool',
    completed: false,
    points: 20
  },
  {
    id: 5,
    title: 'Chose covered steaming over hot oil shallow frying for dinner',
    completed: false,
    points: 15
  },
  {
    id: 6,
    title: 'Reported neighbourhood open leaf burning hotspot to city hotline',
    completed: false,
    points: 25
  }
];

/**
 * @param {object} props
 * @param {import('../types').CityRecord} props.hotspot
 * @param {(points?: number) => void} [props.onPledgeCompleted]
 */
export default function ImpactLedger({ hotspot, onPledgeCompleted }) {
  const { t } = useLanguage();

  const [commuteChoice, setCommuteChoice] = useState('metro');
  const [commuteKm, setCommuteKm] = useState(14);
  const [heatingChoice, setHeatingChoice] = useState('heatpump');
  const [outdoorHours, setOutdoorHours] = useState(1.5);
  const [pledges, setPledges] = useState(INITIAL_PLEDGES);

  const berkeleyStats = useMemo(
    () =>
      calculateBerkeleyEarthCigarettes({
        outdoorPM25: hotspot?.pm25 ?? 0,
        indoorPM25WithPureAir: 14,
        outdoorHoursSpent: outdoorHours,
        indoorHoursSpent: 24 - outdoorHours,
        respiratoryMultiplier: 1.3
      }),
    [hotspot?.pm25, outdoorHours]
  );

  const sustainableStats = useMemo(
    () =>
      calculateSustainableSavings({
        commuteShift: commuteChoice,
        commuteKm,
        heatingShift: heatingChoice
      }),
    [commuteChoice, commuteKm, heatingChoice]
  );

  const totalPoints = pledges.filter((p) => p.completed).reduce((sum, p) => sum + p.points, 0);

  /**
   * Toggle a pledge.
   *
   * The side effects (confetti, impact points) run outside the state updater
   * so React StrictMode's double-invoked updaters cannot award points twice.
   *
   * @param {number} id
   */
  const togglePledge = (id) => {
    const target = pledges.find((p) => p.id === id);
    if (!target) return;

    const nextState = !target.completed;
    setPledges((prev) => prev.map((p) => (p.id === id ? { ...p, completed: nextState } : p)));

    if (nextState) {
      confetti({ particleCount: 60, spread: 50 });
      if (onPledgeCompleted) onPledgeCompleted(target.points);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* ---- Header ---- */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-200 mb-2">
          <HeartPulse className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
          {t('impact.badge')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('impact.title')}</h1>
        <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-2xl leading-relaxed">
          {t('impact.subtitle')}
        </p>
      </div>

      {/* ---- Hero stat cards ---- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              {t('impact.berkeleyEquivalent')}
            </span>
            <div
              className="w-10 h-10 rounded-2xl bg-white text-emerald-800 flex items-center justify-center shadow-sm shrink-0"
              aria-hidden="true"
            >
              <Cigarette className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">
                {berkeleyStats.avoidedCigarettesPerDay}
              </span>
              <span className="text-sm font-bold text-emerald-800">{t('impact.cigPerDay')}</span>
            </div>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
              {t('impact.berkeleyExplainer')}
            </p>
          </div>
          <div className="pt-2 border-t border-emerald-200 text-xs text-emerald-900 font-bold">
            ~{berkeleyStats.avoidedCigarettesPerMonth} {t('impact.cigPerMonth')}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-teal-50/70 border border-teal-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
              {t('impact.alveolarDefense')}
            </span>
            <div
              className="w-10 h-10 rounded-2xl bg-white text-teal-800 flex items-center justify-center shadow-sm shrink-0"
              aria-hidden="true"
            >
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span
                data-testid="pm25-per-day"
                className="text-4xl sm:text-5xl font-black text-slate-900 font-mono"
              >
                {berkeleyStats.microgramsAvoided.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-teal-800">
                µg PM2.5 / {t('impact.perDay')}
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
              {t('impact.alveolarExplainer')} {hotspot?.name}
            </p>
          </div>
          <div className="pt-2 border-t border-teal-200 text-xs text-teal-900 font-bold">
            {t('impact.alveolarFooter')}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              {t('impact.communityCut')}
            </span>
            <div
              className="w-10 h-10 rounded-2xl bg-white text-amber-800 flex items-center justify-center shadow-sm shrink-0"
              aria-hidden="true"
            >
              <Leaf className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span
                data-testid="co2-per-day"
                className="text-4xl sm:text-5xl font-black text-slate-900 font-mono"
              >
                {sustainableStats.dailyCo2SavedKg}
              </span>
              <span className="text-sm font-bold text-amber-900">
                kg CO2 / {t('impact.perDay')}
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
              {t('impact.communityExplainer')}{' '}
              <strong>{sustainableStats.dailyPm25SavedGrams}g</strong>.
            </p>
          </div>
          <div className="pt-2 border-t border-amber-200 text-xs text-amber-900 font-bold">
            {t('impact.communityScore')} {sustainableStats.communitySmogScore}/100
          </div>
        </div>
      </div>

      {/* ---- Lifestyle controls that drive the figures above ---- */}
      <section
        className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-5 shadow-sm"
        aria-labelledby="impact-lifestyle-heading"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2
              id="impact-lifestyle-heading"
              className="text-lg sm:text-xl font-bold text-slate-900"
            >
              {t('impact.lifestyleTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 mt-0.5">
              {t('impact.lifestyleExplainer')}
            </p>
          </div>
          <Provenance variant="estimated" label={t('dash.estimated')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label htmlFor="impact-commute" className="text-xs font-bold text-slate-800 block">
              {t('impact.commuteChoice')}
            </label>
            <select
              id="impact-commute"
              value={commuteChoice}
              onChange={(e) => setCommuteChoice(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:border-teal-500 outline-none"
            >
              <option value="metro">{t('impact.commuteMetro')}</option>
              <option value="ev">{t('impact.commuteEv')}</option>
              <option value="carpool">{t('impact.commuteCarpool')}</option>
              <option value="wfh">{t('impact.commuteWfh')}</option>
              <option value="car">{t('impact.commuteCar')}</option>
            </select>

            <label
              htmlFor="impact-commute-km"
              className="text-xs font-semibold text-slate-700 block pt-2"
            >
              {t('impact.commuteKm')}
            </label>
            <input
              id="impact-commute-km"
              type="number"
              inputMode="numeric"
              min="0"
              max="100"
              value={commuteKm}
              onChange={(e) =>
                setCommuteKm(Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)))
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:border-teal-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="impact-heating" className="text-xs font-bold text-slate-800 block">
              {t('impact.heatingChoice')}
            </label>
            <select
              id="impact-heating"
              value={heatingChoice}
              onChange={(e) => setHeatingChoice(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:border-teal-500 outline-none"
            >
              <option value="heatpump">{t('impact.heatHeatpump')}</option>
              <option value="electric_radiator">{t('impact.heatElectric')}</option>
              <option value="insulation">{t('impact.heatInsulation')}</option>
              <option value="wood_coal">{t('impact.heatWoodCoal')}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="impact-outdoor" className="text-xs font-bold text-slate-800 block">
              {t('impact.outdoorHours')}
            </label>
            <input
              id="impact-outdoor"
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={outdoorHours}
              onChange={(e) => setOutdoorHours(parseFloat(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
              aria-describedby="impact-outdoor-value"
            />
            <p id="impact-outdoor-value" className="text-xs font-semibold text-teal-800">
              {outdoorHours} {t('impact.hoursPerDay')}
            </p>
          </div>
        </div>
      </section>

      {/* ---- Pledge checklist ---- */}
      <section
        className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm"
        aria-labelledby="impact-pledges-heading"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2
              id="impact-pledges-heading"
              className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2"
            >
              <Award className="w-5 h-5 text-teal-700" aria-hidden="true" />
              {t('impact.checklistTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 mt-0.5">
              {t('impact.checklistExplainer')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              data-testid="resilience-score"
              className="px-3.5 py-1.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold shadow-sm"
            >
              {t('impact.resilience')}: {totalPoints} Pts
            </span>
          </div>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-none p-0 m-0">
          {pledges.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={item.completed}
                aria-label={`${t('impact.togglePledge')}: ${item.title}`}
                onClick={() => togglePledge(item.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 hover:shadow-md flex items-start gap-3.5 ${
                  item.completed
                    ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-700'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition ${
                    item.completed ? 'bg-emerald-600 text-white' : 'border border-slate-400'
                  }`}
                  aria-hidden="true"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <span className="flex-1 text-xs sm:text-sm">
                  <span
                    className={`block ${item.completed ? 'font-bold text-slate-900' : 'font-medium'}`}
                  >
                    {item.title}
                  </span>
                  <span className="text-[11px] text-teal-800 block mt-1 font-bold">
                    +{item.points} {t('impact.resiliencePts')}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Community corridor initiative ---- */}
      <section
        className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-4 shadow-sm"
        aria-labelledby="impact-community-heading"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-teal-700" aria-hidden="true" />
            <h3
              id="impact-community-heading"
              className="text-base sm:text-lg font-bold text-slate-900"
            >
              {t('impact.communityTitle')}
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-900 border border-teal-200">
            {t('impact.neighbourhoodHub')}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl font-medium">
          {t('impact.communityBody')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-teal-900 block mb-1">{t('impact.corridorsTitle')}</span>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              {t('impact.corridorsBody')}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-emerald-900 block mb-1">
              {t('impact.biomassTitle')}
            </span>
            <p className="text-slate-700 text-[11px] leading-relaxed">{t('impact.biomassBody')}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-cyan-900 block mb-1">{t('impact.groupCrTitle')}</span>
            <p className="text-slate-700 text-[11px] leading-relaxed">{t('impact.groupCrBody')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
