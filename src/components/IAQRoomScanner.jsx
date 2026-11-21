import { useId, useRef, useState } from 'react';
import { Camera, Upload, Eye, AlertTriangle, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { analyzeRoomIAQ } from '../services/geminiService';
import Provenance from './Provenance';
import { useLanguage } from '../i18n/languageContext.js';

/** Maximum accepted upload size (also enforced server-side). */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Longest edge, in pixels, of the photo actually sent to the provider.
 *
 * The browser downscales before upload so the base64 payload stays small
 * enough for serverless request limits (Vercel rejects request bodies over
 * 4.5 MB with an opaque `FUNCTION_PAYLOAD_TOO_LARGE`).
 */
const MAX_UPLOAD_EDGE = 1280;

/** JPEG quality used for the re-encoded upload. */
const UPLOAD_QUALITY = 0.82;

/** Accepted upload MIME types. */
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Re-encode an uploaded photo as a smaller JPEG.
 *
 * Returns `null` when the environment cannot do the work (no
 * `createImageBitmap`, no canvas), in which case the caller keeps the
 * original file - the feature degrades, it never breaks.
 *
 * @param {File} file
 * @returns {Promise<string|null>} a data URL, or null when unavailable
 */
async function downscaleImage(file) {
  const createBitmap = globalThis.createImageBitmap;
  if (typeof createBitmap !== 'function') return null;

  let bitmap = null;
  try {
    bitmap = await createBitmap(file);
  } catch {
    return null;
  }

  try {
    const longestEdge = Math.max(bitmap.width || 0, bitmap.height || 0);
    if (!longestEdge) return null;

    const scale = Math.min(1, MAX_UPLOAD_EDGE / longestEdge);
    const width = Math.max(1, Math.round((bitmap.width || 1) * scale));
    const height = Math.max(1, Math.round((bitmap.height || 1) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', UPLOAD_QUALITY);
    return typeof dataUrl === 'string' && dataUrl.startsWith('data:image/jpeg') ? dataUrl : null;
  } catch {
    return null;
  } finally {
    bitmap.close?.();
  }
}

const SAMPLES = [
  {
    id: 'window_draft',
    title: 'Drafty Single-Pane Window',
    category: 'Thermal Leakage',
    desc: 'Old window frame with cold winter air infiltration and perimeter gaps',
    defaultRoom: 'Living Room Sliding Window',
    defaultNotes: 'Cold drafts entering at night; curtains move slightly when closed'
  },
  {
    id: 'gas_stove',
    title: 'Gas Stove & Kitchen Exhaust',
    category: 'Indoor Combustion',
    desc: 'High-heat cooking area without dedicated exterior range exhaust hood',
    defaultRoom: 'Kitchen Cooking Zone',
    defaultNotes: 'Cooking odors and oil haze linger for 2+ hours after frying'
  },
  {
    id: 'diy_filter',
    title: 'DIY Corsi-Rosenthal Fan Setup',
    category: 'Filtration Efficiency',
    desc: '20-inch box fan with taped MERV 13 furnace filters awaiting shroud optimization',
    defaultRoom: 'Home Nursery / Living Room',
    defaultNotes: 'Built a 4-filter cube; need advice on fan speed and shroud cutout'
  },
  {
    id: 'purifier_corner',
    title: 'Purifier Trapped Against Wall',
    category: 'Airflow Deadzone',
    desc: 'HEPA unit positioned flush against bedroom corner behind thick curtains',
    defaultRoom: 'Master Bedroom',
    defaultNotes: 'Purifier runs 24/7 but morning nose congestion still occurs'
  }
];

/**
 * @param {object} props
 * @param {import('../types').CityRecord} props.hotspot
 */
export default function IAQRoomScanner({ hotspot }) {
  const { t, lang } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSample, setSelectedSample] = useState(null);
  const [roomType, setRoomType] = useState('Living Room Window & Airflow Zone');
  const [userNotes, setUserNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const roomTypeId = useId();
  const notesId = useId();
  const fileInputId = useId();

  /**
   * Validate and read an uploaded image.
   * @param {import('react').ChangeEvent<HTMLInputElement>} event
   */
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    // Reset immediately so selecting the same file again re-triggers onChange.
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!file) return;

    setUploadError('');

    if (!ACCEPTED_TYPES.has(file.type)) {
      setUploadError(t('scanner.fileWrongType'));
      setSelectedImage(null);
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError(t('scanner.fileTooLarge'));
      setSelectedImage(null);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', async (loadEvent) => {
      const original = loadEvent.target?.result;
      // Downscale before uploading so the base64 payload stays within the
      // serverless request-body limit. Falls back to the original file.
      const scaled = await downscaleImage(file);
      setSelectedImage(
        scaled && original && scaled.length < String(original).length ? scaled : original
      );
      setSelectedSample(null);
      setAuditResult(null);
    });
    reader.addEventListener('error', () => {
      setUploadError(t('scanner.fileReadFailed'));
      setSelectedImage(null);
    });
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample) => {
    setSelectedSample(sample);
    setSelectedImage(null);
    setRoomType(sample.defaultRoom);
    setUserNotes(sample.defaultNotes);
    setUploadError('');
    setAuditResult(null);
  };

  const handleRunAudit = async () => {
    setLoading(true);
    try {
      const res = await analyzeRoomIAQ(selectedImage, roomType, userNotes, lang, hotspot);
      setAuditResult(res);
    } catch {
      setAuditResult(null);
    } finally {
      setLoading(false);
    }
  };

  const isLive = auditResult?.source === 'live';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* ---- Header ---- */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-900 border border-teal-200 mb-2">
              <Camera className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
              {t('scanner.engineBadge')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {t('scanner.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-2xl leading-relaxed">
              {t('scanner.subtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunAudit}
            disabled={loading}
            className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-teal-700 hover:bg-teal-800 text-white transition flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>{t('scanner.analyzing')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>{auditResult ? t('scanner.reaudit') : t('scanner.runAudit')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ---- Upload & context ---- */}
        <section className="lg:col-span-5 space-y-5" aria-labelledby="scanner-upload-heading">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
            <h2
              id="scanner-upload-heading"
              className="text-base font-bold text-slate-900 flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-teal-700" aria-hidden="true" />
              {t('scanner.uploadOrSample')}
            </h2>

            <label
              htmlFor={fileInputId}
              className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 cursor-pointer bg-slate-50 hover:bg-slate-100/60 transition group"
            >
              <div
                className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-3 group-hover:scale-110 transition"
                aria-hidden="true"
              >
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 text-center">
                {selectedImage ? t('scanner.photoAttached') : t('scanner.upload')}
              </span>
              <span className="text-[11px] text-slate-600 mt-1 text-center">
                {t('scanner.uploadHint')}
              </span>
              <span className="text-[11px] text-slate-600 mt-1 text-center">
                {t('scanner.uploadLimits')}
              </span>
              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>

            {uploadError && (
              <p
                role="alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900"
              >
                {uploadError}
              </p>
            )}

            {selectedImage && (
              <div className="relative rounded-2xl overflow-hidden border border-teal-500 max-h-48 shadow-sm">
                <img
                  src={selectedImage}
                  alt={t('scanner.previewAlt', 'Preview of the uploaded room photo')}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/90 text-teal-900 shadow-sm">
                  {t('scanner.uploadReady')}
                </span>
              </div>
            )}

            {/* Sample setups */}
            <fieldset className="space-y-2 pt-2">
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('scanner.sampleLegend')}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLES.map((s) => {
                  const isChosen = selectedSample?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={isChosen}
                      onClick={() => handleSelectSample(s)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        isChosen
                          ? 'border-teal-500 bg-teal-50 text-slate-900 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
                        {s.category}
                      </span>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">
                        {s.title}
                      </span>
                      <span className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                        {s.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Context inputs */}
            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label htmlFor={roomTypeId} className="text-slate-800 font-bold block mb-1">
                  {t('scanner.roomType')}
                </label>
                <input
                  id={roomTypeId}
                  type="text"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  placeholder={t('scanner.roomTypePlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label htmlFor={notesId} className="text-slate-800 font-bold block mb-1">
                  {t('scanner.notes')}
                </label>
                <input
                  id={notesId}
                  type="text"
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder={t('scanner.notesPlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ---- Results ---- */}
        <section className="lg:col-span-7 space-y-4" aria-label={t('scanner.report')}>
          {!auditResult ? (
            <div className="h-full min-h-[420px] flex flex-col items-center justify-center p-8 text-center rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div
                className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-4"
                aria-hidden="true"
              >
                <Eye className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t('scanner.emptyTitle')}</h3>
              <p className="text-xs sm:text-sm text-slate-700 mt-2 max-w-md leading-relaxed">
                {t('scanner.emptyBody')}
              </p>
              <button
                type="button"
                onClick={handleRunAudit}
                disabled={loading}
                className="mt-6 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white transition shadow-sm disabled:opacity-60"
              >
                {loading ? t('scanner.analyzing') : t('scanner.emptyCta')}
              </button>
            </div>
          ) : (
            <div className="space-y-4" aria-live="polite">
              <div className="p-6 rounded-3xl bg-white border border-teal-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                      {isLive ? t('scanner.reportTitleLive') : t('scanner.reportTitleLocal')}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {auditResult.roomDetected}
                    </h3>
                    <Provenance
                      className="mt-2"
                      variant={isLive ? 'live' : 'reference'}
                      label={isLive ? t('ai.responseLive') : t('ai.responseFallback')}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[11px] uppercase tracking-wider text-slate-700 block font-bold">
                        {t('scanner.leakageRisk')}
                      </span>
                      <span className="text-3xl font-black text-rose-700">
                        {auditResult.leakageRiskScore}%
                      </span>
                    </div>
                    <div
                      className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 font-bold"
                      aria-hidden="true"
                    >
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {auditResult.primaryVulnerabilities?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                      {t('scanner.vulnerabilities')}
                    </span>
                    <ul className="space-y-1.5 list-none p-0 m-0">
                      {auditResult.primaryVulnerabilities.map((vuln) => (
                        <li
                          key={vuln}
                          className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 font-medium"
                        >
                          <span className="text-rose-700 font-bold shrink-0" aria-hidden="true">
                            ✕
                          </span>
                          <span>{vuln}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                  {t('scanner.fixes')}
                </span>

                <ol className="space-y-3 list-none p-0 m-0">
                  {auditResult.stepByStepFixes.map((item) => (
                    <li
                      key={item.step}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 transition shadow-sm space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-900 text-xs font-bold flex items-center justify-center shrink-0">
                            {item.step}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            −{item.pmReductionPercent}% PM2.5
                          </span>
                          <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-800 border border-slate-300">
                            ~${item.estimatedCostUsd}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-8 font-medium">
                        {item.diyFix}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck
                    className="w-5 h-5 text-teal-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-teal-900">
                      {t('scanner.placement')}
                    </h4>
                    <p className="text-xs text-teal-900 mt-1 leading-relaxed font-medium">
                      {auditResult.airPurifierPlacementAdvice}
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-xs text-emerald-900 border-t border-teal-200 flex items-start gap-1.5 font-bold">
                  <Sparkles
                    className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    {t('scanner.expected')}: {auditResult.cleanAirDeliveryImpact}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
