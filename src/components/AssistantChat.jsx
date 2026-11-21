import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Send, User, Volume2, VolumeX, RefreshCw, Trash2 } from 'lucide-react';
import { askSmogAssistant, getProviderStatus } from '../services/geminiService';
import Provenance from './Provenance';
import { useLanguage } from '../i18n/languageContext.js';
import { translatePhrase } from '../i18n/phrases.js';

/** Maximum characters accepted in a single chat message. */
const MAX_INPUT_CHARS = 1000;

/**
 * Render a message with simple `**bold**` emphasis.
 *
 * React escapes the text nodes, so this stays XSS-safe while removing the
 * literal asterisks the model emits.
 *
 * @param {string} text
 * @returns {React.ReactNode[]}
 */
function renderEmphasis(text) {
  // Keys are derived from the content itself (plus an occurrence counter) so
  // React can match nodes across re-renders without relying on array order.
  const occurrences = new Map();

  return String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((part) => part.length > 0)
    .map((part) => {
      const isBold = part.startsWith('**') && part.endsWith('**') && part.length > 4;
      const base = `${isBold ? 'bold' : 'plain'}:${part}`;
      const seen = occurrences.get(base) ?? 0;
      occurrences.set(base, seen + 1);
      const key = seen === 0 ? base : `${base}#${seen}`;

      return isBold ? (
        <strong key={key} className="font-extrabold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={key}>{part}</span>
      );
    });
}

/**
 * @param {object} props
 * @param {import('../types').CityRecord} props.hotspot
 */
export default function AssistantChat({ hotspot }) {
  const { t, lang } = useLanguage();

  const buildGreeting = () => ({
    id: 1,
    sender: 'bot',
    text:
      lang === 'hi'
        ? `नमस्ते! मैं आपका PureAir Life सहायक हूँ, जो Google Gemini Flash पर आधारित है।\n\n**${hotspot.name}** की संदर्भ स्थिति **${translatePhrase(hotspot.status, lang)} (AQI ${hotspot.aqi}, PM2.5: ${hotspot.pm25} µg/m³)** है, जिसका कारण ${translatePhrase(hotspot.smogType, lang)} है।\n\nआज सबसे सुरक्षित बाहरी समय **${hotspot.safeWindow}** है।\n\nसुरक्षित यात्रा, बच्चों के मास्क, DIY कॉर्सी-रोज़ेंथल फ़िल्टर, कम-प्रदूषण रसोई या कमरे की सील के बारे में पूछें!`
        : `Hello! I am your PureAir Life AI Assistant, powered by Google Gemini Flash.\n\nThe reference baseline for **${hotspot.name}** is **${hotspot.status} (AQI ${hotspot.aqi}, PM2.5: ${hotspot.pm25} µg/m³)**, driven by ${hotspot.smogType}.\n\nThe safest diurnal outdoor window today is **${hotspot.safeWindow}**.\n\nAsk me about safe transit times, paediatric mask guidelines, DIY Corsi-Rosenthal filter builds, low-emission cooking, or room sealing!`,
    source: 'reference',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  const [messages, setMessages] = useState(
    /** @type {import('../types').ChatMessage[]} */ ([buildGreeting()])
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);
  const [providerLive, setProviderLive] = useState(null);
  const [lastSource, setLastSource] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    getProviderStatus()
      .then((status) => {
        if (!cancelled) setProviderLive(status.configured === true);
        return status;
      })
      .catch(() => {
        // Probing is best-effort - the chat simply stays in reference mode.
        return null;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestedChips = useMemo(
    () =>
      lang === 'hi'
        ? [
            'क्या अभी कुत्ते को घुमाना सुरक्षित है?',
            '5 साल के बच्चे पर N95 मास्क कैसे पहनें?',
            'क्या पौधे एयर प्यूरीफायर की जगह ले सकते हैं?',
            'रात के खाने से indoor PM2.5 कैसे रोकें?',
            'आपात कॉर्सी-रोज़ेंथल बॉक्स कैसे बनाएँ?'
          ]
        : [
            'Is it safe to walk my dog right now?',
            'How do I fit an N95 mask on a 5-year-old?',
            'Can indoor plants substitute for an air purifier?',
            'What dinner cooking hacks prevent indoor PM2.5?',
            'How do I build an emergency Corsi-Rosenthal box?'
          ],
    [lang]
  );

  const handleSend = async (textToSend) => {
    const query = (textToSend ?? input).trim().slice(0, MAX_INPUT_CHARS);
    if (!query || loading) return;

    const userMsg = /** @type {import('../types').ChatMessage} */ ({
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Capture the history BEFORE appending, so the model receives prior turns.
    const history = messages
      .filter((m) => m.text)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await askSmogAssistant(query, history, hotspot, lang);
      const botMsg = /** @type {import('../types').ChatMessage} */ ({
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        source: response.source,
        model: response.model || '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setMessages((prev) => [...prev, botMsg]);
      setLastSource(response.source);
    } catch {
      setMessages((prev) => [
        ...prev,
        /** @type {import('../types').ChatMessage} */ ({
          id: `e-${Date.now()}`,
          sender: 'bot',
          text: t(
            'chat.errorMessage',
            'The assistant could not respond right now. Please try again in a moment.'
          ),
          source: 'fallback',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
      ]);
    } finally {
      setLoading(false);
    }
  };

  const speakMessage = (text) => {
    // Not every environment ships a usable Web Speech API, so check for the
    // methods we actually call instead of just for the property's presence.
    const speech = window.speechSynthesis;
    if (!speech || typeof speech.speak !== 'function') return;

    if (speechActive) {
      speech.cancel();
      setSpeechActive(false);
      return;
    }

    speech.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ''));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.addEventListener('end', () => setSpeechActive(false));
    utterance.addEventListener('error', () => setSpeechActive(false));
    setSpeechActive(true);
    speech.speak(utterance);
  };

  const clearConversation = () => {
    setMessages([/** @type {import('../types').ChatMessage} */ (buildGreeting())]);
    setInput('');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* ---- Header ---- */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-900 border border-teal-200 mb-2">
            <Bot className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
            {t('chat.engineBadge')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('chat.title')}</h1>
          <p className="text-xs sm:text-sm text-slate-700 mt-1">{t('chat.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-700 font-semibold">
              {t('chat.context')}:{' '}
              <strong className="text-slate-900">
                {hotspot.name} (AQI {hotspot.aqi})
              </strong>
            </span>
          </div>
          <Provenance
            variant={providerLive === true && lastSource !== 'fallback' ? 'live' : 'reference'}
            label={
              providerLive === null
                ? t('ai.checking', 'Checking AI access…')
                : providerLive === false || lastSource === 'fallback'
                  ? t('ai.localGuide')
                  : t('ai.live')
            }
          />
        </div>
      </div>

      {/* ---- Conversation ---- */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 flex flex-col h-[540px] shadow-sm">
        <div
          className="flex-1 overflow-y-auto space-y-4 pr-2"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label={t('chat.conversation', 'Conversation')}
        >
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold shadow-sm ${
                    isBot
                      ? 'bg-gradient-to-tr from-teal-500 to-emerald-400 text-white'
                      : 'bg-slate-700 text-white'
                  }`}
                  aria-hidden="true"
                >
                  {isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isBot
                      ? 'bg-slate-50 border border-slate-200 text-slate-800'
                      : 'bg-teal-700 text-white shadow-sm'
                  }`}
                >
                  <span className="sr-only">
                    {isBot ? t('chat.assistant') : t('chat.you')}:{' '}
                  </span>
                  <div className="whitespace-pre-line space-y-1 font-medium">
                    {renderEmphasis(msg.text)}
                  </div>

                  <div
                    className={`flex flex-wrap items-center justify-between gap-3 mt-2.5 pt-2 border-t text-[11px] ${
                      isBot ? 'border-slate-200 text-slate-600' : 'border-white/30 text-teal-50'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {isBot && (
                      <span className="flex items-center gap-3">
                        {msg.source && (
                          <Provenance
                            variant={msg.source === 'live' ? 'live' : 'reference'}
                            label={
                              msg.source === 'live' ? t('ai.responseLive') : t('ai.responseFallback')
                            }
                            title={
                              msg.source === 'live' && msg.model
                                ? `Model: ${msg.model}`
                                : undefined
                            }
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => speakMessage(msg.text)}
                          title={t('chat.speak')}
                          aria-label={t('chat.speak')}
                          className="hover:text-teal-800 flex items-center gap-1 transition font-bold"
                        >
                          {speechActive ? (
                            <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          <span>{speechActive ? t('chat.stop', 'Stop') : t('chat.listen', 'Listen')}</span>
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center"
                aria-hidden="true"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 animate-pulse font-medium"
                role="status"
              >
                {t('chat.thinking')}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        <div className="py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-100">
          <span className="text-[11px] uppercase font-bold text-slate-600 shrink-0">
            {t('chat.quickPrompts')}
          </span>
          {suggestedChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSend(chip)}
              className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 border border-slate-300 whitespace-nowrap transition"
            >
              {chip}
            </button>
          ))}
          <button
            type="button"
            onClick={clearConversation}
            aria-label={t('chat.clear')}
            title={t('chat.clear')}
            className="ml-auto shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 inline-flex items-center gap-1 transition"
          >
            <Trash2 className="w-3 h-3" aria-hidden="true" />
            {t('chat.clear')}
          </button>
        </div>

        {/* Input */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 pt-2 border-t border-slate-100"
        >
          <label htmlFor="chat-input" className="sr-only">
            {t('chat.inputLabel', 'Ask the clean air assistant')}
          </label>
          <input
            id="chat-input"
            type="text"
            value={input}
            maxLength={MAX_INPUT_CHARS}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat.placeholder')}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm outline-none focus:border-teal-500 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label={t('chat.send')}
            className="px-5 py-3 rounded-2xl font-bold bg-teal-700 hover:bg-teal-800 text-white transition flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('chat.send')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
