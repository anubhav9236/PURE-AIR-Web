import { Radio, Calculator, Info, FileText } from 'lucide-react';
import { useLanguage } from '../i18n/languageContext.js';
import { translatePhrase } from '../i18n/phrases.js';

/**
 * Visual labels for the four kinds of information PureAir Life presents.
 *
 * - `live`      : measured from a live monitoring source
 * - `estimated` : computed by a documented model from reference inputs
 * - `advisory`  : general guidance, not tied to a measurement
 * - `reference` : a static baseline value shipped with the app
 */
const VARIANTS = {
  live: {
    icon: Radio,
    label: 'Live data',
    className: 'bg-emerald-50 text-emerald-900 border-emerald-300'
  },
  estimated: {
    icon: Calculator,
    label: 'Estimated',
    className: 'bg-sky-50 text-sky-900 border-sky-300'
  },
  advisory: {
    icon: Info,
    label: 'Advisory',
    className: 'bg-violet-50 text-violet-900 border-violet-300'
  },
  reference: {
    icon: FileText,
    label: 'Reference baseline',
    className: 'bg-slate-100 text-slate-800 border-slate-300'
  }
};

/**
 * @param {object} props
 * @param {import('../types').ProvenanceKind} [props.variant]
 * @param {string} [props.label] Override the default label
 * @param {string} [props.title] Tooltip / accessible description
 * @param {string} [props.className]
 */
export default function Provenance({ variant = 'reference', label, title, className = '' }) {
  const { lang } = useLanguage();
  const config = VARIANTS[variant] || VARIANTS.reference;
  const Icon = config.icon;
  const text = label || translatePhrase(config.label, lang);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${config.className} ${className}`}
      title={title || text}
    >
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      {text}
    </span>
  );
}
