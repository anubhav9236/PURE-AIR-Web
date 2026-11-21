import { useMemo, useState } from 'react';
import { Wrench, Wind, Sparkles, Volume2, Zap } from 'lucide-react';
import {
  calculateCRBoxCADR,
  estimateIndoorPM25,
  INFILTRATION_ACH,
  WHO_24HR_PM25_LIMIT
} from '../services/iaqCalculatorService';
import Provenance from './Provenance';
import { useLanguage } from '../i18n/languageContext.js';

const HACKS_CATALOG = [
  {
    id: 'bubble-glazing',
    title: 'Emergency Thermal Window Bubble-Glazing',
    tag: 'Window Insulation & Seal',
    cost: '$3 - $5',
    time: '10 mins',
    pmReduction: '30%',
    desc: 'Spray fine water mist directly on the interior window glass pane and press packing bubble wrap (bubble side against the glass). Surface tension holds it for weeks without tape, creating a dead-air thermal barrier that stops cold drafts and PM2.5 suction.',
    materials: 'Water spray bottle, standard bubble wrap roll, scissors'
  },
  {
    id: 'door-sweep',
    title: 'The Damp Towel / Foam Door Sweep Hack',
    tag: 'Doorway Draft Seal',
    cost: '$0 - $4',
    time: '2 mins',
    pmReduction: '25%',
    desc: 'The gap under apartment entrance doors acts as a low-pressure chimney pulling hallway soot and ambient outdoor smog into bedrooms. Roll a damp bath towel along the threshold, or cut a pipe-insulation foam pool noodle lengthwise and slide it under the door.',
    materials: 'Bath towel or foam pipe sleeve'
  },
  {
    id: 'carbon-scrubber',
    title: 'Activated Carbon Charcoal Odour & VOC Scrubber',
    tag: 'NO2 & Winter VOC Defense',
    cost: '$12',
    time: '5 mins',
    pmReduction: 'Adsorbs 85% NO2',
    desc: 'Standard HEPA and MERV 13 filters capture particles but cannot stop toxic winter gases (combustion NO2, benzene from wood and coal fires). Sandwich an activated-carbon sheet behind your furnace filter to capture chemical gases.',
    materials: 'Activated carbon pre-filter pad, binder clips'
  },
  {
    id: 'shroud',
    title: 'The 15-Inch Cardboard Shroud Power Hack',
    tag: 'CADR Booster',
    cost: '$0 (cardboard box)',
    time: '8 mins',
    pmReduction: '+35% CADR',
    desc: 'Standard box fan square corners suffer from reverse blade vortex recirculation, where air recirculates backwards out of the front corners. Cutting a circular 14 to 15 inch hole in cardboard and taping it to the front face of the fan eliminates backflow and boosts clean air delivery by about 35%.',
    materials: 'Cardboard flap, utility knife, duct tape'
  }
];

/**
 * @param {object} props
 * @param {object} props.hotspot
 */
export default function IAQHackLab({ hotspot }) {
  const { t } = useLanguage();

  const [roomLength, setRoomLength] = useState(16);
  const [roomWidth, setRoomWidth] = useState(14);
  const [roomHeight, setRoomHeight] = useState(9);
  const [fanSpeed, setFanSpeed] = useState('medium');
  const [filterCount, setFilterCount] = useState(4);
  const [filterRating, setFilterRating] = useState('merv13');
  const [hasShroud, setHasShroud] = useState(true);
  const [sealLevel, setSealLevel] = useState('drafty');

  const crStats = useMemo(
    () =>
      calculateCRBoxCADR({
        fanSpeed,
        filterCount,
        filterRating,
        hasCardboardShroud: hasShroud,
        roomLengthFt: roomLength,
        roomWidthFt: roomWidth,
        roomHeightFt: roomHeight
      }),
    [fanSpeed, filterCount, filterRating, hasShroud, roomLength, roomWidth, roomHeight]
  );

  // Location-personalised indoor concentration estimate for the selected city.
  const indoorEstimate = useMemo(
    () =>
      estimateIndoorPM25({
        outdoorPM25: hotspot?.pm25 ?? 0,
        filterACH: crStats.ach,
        infiltrationACH: INFILTRATION_ACH[sealLevel]
      }),
    [hotspot?.pm25, crStats.ach, sealLevel]
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* ---- Header ---- */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-900 border border-teal-200 mb-2">
          <Wrench className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
          {t('hacklab.badge')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('hacklab.title')}</h1>
        <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-2xl leading-relaxed">
          {t('hacklab.subtitle')}
        </p>
      </div>

      {/* ---- Simulator ---- */}
      <section
        className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm"
        aria-labelledby="hacklab-sim-heading"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2
              id="hacklab-sim-heading"
              className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2"
            >
              <Wind className="w-5 h-5 text-teal-700" aria-hidden="true" />
              {t('hacklab.simTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{t('hacklab.simExplainer')}</p>
          </div>

          <Provenance variant="estimated" label={t('dash.estimated')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-6 space-y-5 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
            {/* Fan speed */}
            <fieldset className="space-y-2">
              <legend className="text-slate-800 font-bold flex items-center justify-between w-full">
                <span>{t('hacklab.fanSpeed')}</span>
                <span className="font-mono text-teal-800 uppercase">{fanSpeed}</span>
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    aria-pressed={fanSpeed === speed}
                    onClick={() => setFanSpeed(speed)}
                    className={`py-2 rounded-xl font-bold uppercase transition ${
                      fanSpeed === speed
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'bg-white text-slate-800 border border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {speed}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Filter architecture */}
            <fieldset className="space-y-2">
              <legend className="text-slate-800 font-bold flex items-center justify-between w-full">
                <span>{t('hacklab.filterArch')}</span>
                <span className="text-teal-800 font-semibold">
                  {filterCount === 4
                    ? t('hacklab.filter4')
                    : filterCount === 5
                      ? t('hacklab.filter5')
                      : t('hacklab.filter2')}
                </span>
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 4, label: t('hacklab.filter4') },
                  { count: 5, label: t('hacklab.filter5') },
                  { count: 2, label: t('hacklab.filter2') }
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    aria-pressed={filterCount === item.count}
                    onClick={() => setFilterCount(item.count)}
                    className={`py-2 px-1 text-center rounded-xl font-bold transition ${
                      filterCount === item.count
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'bg-white text-slate-800 border border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* MERV rating */}
            <fieldset className="space-y-2">
              <legend className="text-slate-800 font-bold flex items-center justify-between w-full">
                <span>{t('hacklab.merv')}</span>
                <span className="font-mono text-teal-800 uppercase">{filterRating}</span>
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'merv11', label: 'MERV 11', desc: '65% PM2.5' },
                  { id: 'merv13', label: 'MERV 13', desc: '85% PM2.5' },
                  { id: 'merv14', label: 'MERV 14', desc: '92% PM2.5' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={filterRating === item.id}
                    onClick={() => setFilterRating(item.id)}
                    className={`p-2 rounded-xl text-center font-bold transition ${
                      filterRating === item.id
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'bg-white text-slate-800 border border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span className="block">{item.label}</span>
                    <span className="text-[11px] font-normal opacity-80 block">{item.desc}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Shroud toggle */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">{t('hacklab.shroud')}</span>
                <span className="text-[11px] text-slate-600 block">
                  {t('hacklab.shroudDesc')}
                </span>
              </div>
              <button
                type="button"
                aria-pressed={hasShroud}
                onClick={() => setHasShroud((v) => !v)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition shrink-0 ${
                  hasShroud
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                {hasShroud ? t('hacklab.shroudOn') : t('hacklab.shroudOff')}
              </button>
            </div>

            {/* Room dimensions */}
            <fieldset className="space-y-2 pt-1 border-t border-slate-200">
              <legend className="text-slate-800 font-bold flex items-center justify-between w-full">
                <span>{t('hacklab.roomDims')}</span>
                <span className="font-mono text-teal-800">
                  {roomLength}' × {roomWidth}' × {roomHeight}' (
                  {crStats.roomVolumeCuFt.toLocaleString()} cu ft)
                </span>
              </legend>
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label
                    htmlFor="hacklab-length"
                    className="text-[11px] text-slate-700 font-medium block"
                  >
                    {t('hacklab.length')}: {roomLength} ft
                  </label>
                  <input
                    id="hacklab-length"
                    type="range"
                    min="10"
                    max="30"
                    value={roomLength}
                    onChange={(e) => setRoomLength(parseInt(e.target.value, 10))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>
                <div>
                  <label
                    htmlFor="hacklab-width"
                    className="text-[11px] text-slate-700 font-medium block"
                  >
                    {t('hacklab.width')}: {roomWidth} ft
                  </label>
                  <input
                    id="hacklab-width"
                    type="range"
                    min="10"
                    max="30"
                    value={roomWidth}
                    onChange={(e) => setRoomWidth(parseInt(e.target.value, 10))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>
                <div>
                  <label
                    htmlFor="hacklab-height"
                    className="text-[11px] text-slate-700 font-medium block"
                  >
                    {t('hacklab.height')}: {roomHeight} ft
                  </label>
                  <input
                    id="hacklab-height"
                    type="range"
                    min="7"
                    max="14"
                    value={roomHeight}
                    onChange={(e) => setRoomHeight(parseInt(e.target.value, 10))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>
              </div>
            </fieldset>
          </div>

          {/* Readout */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4 p-6 rounded-2xl bg-gradient-to-br from-teal-50/60 to-emerald-50/50 border border-teal-200 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-900 block mb-1">
                {t('hacklab.readout')}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">
                  {crStats.cadrCFM}
                </span>
                <span className="text-sm font-bold text-teal-800 uppercase">CFM CADR</span>
              </div>
              <p className="text-xs text-slate-700 mt-1 font-medium">
                {t('hacklab.achLine')} <strong>{crStats.ach} ACH</strong> {t('hacklab.inRoom')}{' '}
                {crStats.roomVolumeCuFt} cu ft.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[11px] uppercase font-bold text-slate-700 block">
                  {t('hacklab.clear90')}
                </span>
                <span className="text-xl font-black text-emerald-700 mt-0.5 block">
                  {crStats.minutesToClear90} {t('hacklab.mins')}
                </span>
                <span className="text-[11px] text-slate-600">{t('hacklab.clear90Note')}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[11px] uppercase font-bold text-slate-700 block">
                  {t('hacklab.clear99')}
                </span>
                <span className="text-xl font-black text-teal-700 mt-0.5 block">
                  {crStats.minutesToClear99} {t('hacklab.mins')}
                </span>
                <span className="text-[11px] text-slate-600">{t('hacklab.clear99Note')}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[11px] uppercase font-bold text-slate-700 block flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-cyan-700" aria-hidden="true" />
                  {t('hacklab.acoustic')}
                </span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">
                  {crStats.soundLevelDb} dBA
                </span>
                <span className="text-[11px] text-slate-600">{t('hacklab.acousticNote')}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[11px] uppercase font-bold text-slate-700 block flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-700" aria-hidden="true" />
                  {t('hacklab.powerCost')}
                </span>
                <span className="text-xl font-black text-amber-800 mt-0.5 block">
                  ~${crStats.annualEnergyCostUsd}/yr
                </span>
                <span className="text-[11px] text-slate-600">{t('hacklab.powerNote')}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-emerald-300 shadow-sm">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <span className="text-slate-700 block font-medium">{t('hacklab.diyCost')}</span>
                  <span className="text-xl font-extrabold text-emerald-800">${crStats.diyCost}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-600 block font-medium">
                    {t('hacklab.commercial')}
                  </span>
                  <span className="text-base font-bold text-slate-500 line-through">
                    ${crStats.commercialHepaEquivalentCost}
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
                <span>{t('hacklab.moneySaved')}</span>
                <span>+${crStats.savings} {t('hacklab.saved')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Location-personalised indoor estimate ---- */}
      <section
        className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm"
        aria-labelledby="hacklab-city-heading"
      >
        <div>
          <h2
            id="hacklab-city-heading"
            className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2 flex-wrap"
          >
            {t('hacklab.cityTitle')}
            <Provenance variant="estimated" label={t('dash.estimated')} />
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 mt-0.5">{t('hacklab.cityExplainer')}</p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {t('hacklab.sealLevel')}
          </legend>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'sealed', label: t('hacklab.sealSealed') },
              { id: 'weatherstripped', label: t('hacklab.sealStripped') },
              { id: 'drafty', label: t('hacklab.sealDrafty') },
              { id: 'unsealed', label: t('hacklab.sealUnsealed') }
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={sealLevel === option.id}
                onClick={() => setSealLevel(option.id)}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition ${
                  sealLevel === option.id
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-slate-800 border-slate-300 hover:border-teal-400 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] uppercase font-bold text-slate-700 block">
              {t('hacklab.outdoorBaseline')}
            </span>
            <span className="text-2xl font-black text-rose-700 mt-1 block">
              {indoorEstimate.outdoorPM25} <span className="text-sm">µg/m³</span>
            </span>
            <span className="text-[11px] text-slate-600">{hotspot?.name}</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
            <span className="text-[11px] uppercase font-bold text-rose-900 block">
              {t('hacklab.withoutFiltration')}
            </span>
            <span className="text-2xl font-black text-rose-800 mt-1 block">
              {indoorEstimate.unfilteredIndoorPM25} <span className="text-sm">µg/m³</span>
            </span>
            <span className="text-[11px] text-rose-900">
              {t('hacklab.infiltration')} {indoorEstimate.infiltrationACH} ACH
            </span>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              indoorEstimate.meetsWHO
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-amber-50 border-amber-300'
            }`}
          >
            <span
              className={`text-[11px] uppercase font-bold block ${
                indoorEstimate.meetsWHO ? 'text-emerald-900' : 'text-amber-900'
              }`}
            >
              {t('hacklab.withFiltration')}
            </span>
            <span
              className={`text-2xl font-black mt-1 block ${
                indoorEstimate.meetsWHO ? 'text-emerald-800' : 'text-amber-800'
              }`}
            >
              {indoorEstimate.filteredIndoorPM25} <span className="text-sm">µg/m³</span>
            </span>
            <span
              className={`text-[11px] font-semibold ${
                indoorEstimate.meetsWHO ? 'text-emerald-900' : 'text-amber-900'
              }`}
            >
              {indoorEstimate.meetsWHO
                ? `${t('hacklab.meetsWho')} (≤ ${WHO_24HR_PM25_LIMIT} µg/m³)`
                : t('hacklab.aboveWho')}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          {t('hacklab.methodNote')}
        </p>
      </section>

      {/* ---- Hacks catalogue ---- */}
      <section
        className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm"
        aria-labelledby="hacklab-catalog-heading"
      >
        <div>
          <h2
            id="hacklab-catalog-heading"
            className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-teal-700" aria-hidden="true" />
            {t('hacklab.catalogTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 mt-0.5">{t('hacklab.catalogExplainer')}</p>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
          {HACKS_CATALOG.map((hack) => (
            <li
              key={hack.id}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-400 hover:shadow-lg transition-all duration-300 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-200">
                  {hack.tag}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {hack.pmReduction}
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">{hack.title}</h3>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">{hack.desc}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <span>
                  {t('hacklab.materials')}: <strong className="text-slate-900">{hack.materials}</strong>
                </span>
                <span className="text-teal-800 font-bold">
                  {hack.cost} • {hack.time}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
