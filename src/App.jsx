import { useState, useRef, useEffect } from "react";
import { C } from "./tokens.js";
import InvoiceForm from "./components/InvoiceForm.jsx";
import InvoicePreview from "./components/InvoicePreview.jsx";
import ChefUXLogo from "./components/ChefUXLogo.jsx";
import { loadBizInfo, nextInvoiceNumber } from "./utils/storage.js";
import { downloadInvoice } from "./utils/pdf.js";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function initInvoice() {
  const biz = loadBizInfo();
  return {
    docType: "INVOICE",
    refNumber: nextInvoiceNumber(),
    issueDate: todayISO(),
    dueDate: "",
    currency: "USD",
    bizName:    biz.bizName    || "",
    bizCompany: biz.bizCompany || "",
    bizAddress: biz.bizAddress || "",
    bizEmail:   biz.bizEmail   || "",
    bizPhone:   biz.bizPhone   || "",
    bizVat:     biz.bizVat     || "",
    clientName:    "",
    clientCompany: "",
    clientAddress: "",
    clientEmail:   "",
    clientVat:     "",
    projectName: "",
    packageName: "",
    scope:       "",
    timeline:    "",
    rate:        "",
    notes: "",
    items: [
      { id: Date.now(), category: "", name: "", description: "", qty: 1, unitPrice: 0, tag: "" },
    ],
    taxRate: 0,
    terms: [
      { label: "Payment",   value: "" },
      { label: "Revisions", value: "" },
      { label: "Timeline",  value: "" },
      { label: "Ownership", value: "" },
    ],
    ctaTitle: "",
    ctaBody:  "",
  };
}

const DOWNLOAD_BTN_CSS = `
  .ui-anim-btn {
    --highlight-hue: 26deg;
    --highlight: hsl(var(--highlight-hue), 70%, 62%);
    --highlight-80: hsla(var(--highlight-hue), 70%, 62%, 0.8);
    --highlight-50: hsla(var(--highlight-hue), 70%, 62%, 0.5);
    --highlight-30: hsla(var(--highlight-hue), 70%, 62%, 0.3);
    --highlight-20: hsla(var(--highlight-hue), 70%, 62%, 0.2);
    --padding: 4px;
    --radius: 12px;
    --transition: 0.4s;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 13px 24px;
    border-radius: var(--radius);
    border: 1px solid rgba(196,130,90,0.25);
    background: #18182A;
    color: #fff;
    font-family: DM Sans, sans-serif;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow:
      inset 0px 1px 1px rgba(255,255,255,0.15),
      inset 0px 4px 8px rgba(255,255,255,0.06),
      0 4px 20px rgba(196,130,90,0.2);
    transition: box-shadow var(--transition), border-color var(--transition), background-color var(--transition);
    overflow: hidden;
  }
  .ui-anim-btn::before {
    content: "";
    position: absolute;
    top: calc(0px - var(--padding));
    left: calc(0px - var(--padding));
    width: calc(100% + var(--padding) * 2);
    height: calc(100% + var(--padding) * 2);
    border-radius: calc(var(--radius) + var(--padding));
    pointer-events: none;
    background-image: linear-gradient(0deg, #0004, #000a);
    z-index: 0;
    transition: box-shadow var(--transition);
    box-shadow:
      0 -8px 8px -6px #0000 inset,
      1px 1px 1px #fff2,
      -1px -1px 1px #0002;
  }
  .ui-anim-btn::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background-image: linear-gradient(0deg, var(--highlight), var(--highlight-50) 30%, transparent);
    opacity: 0;
    transition: opacity var(--transition);
    z-index: 0;
    -webkit-mask-image: linear-gradient(0deg, #fff, transparent);
    mask-image: linear-gradient(0deg, #fff, transparent);
  }
  .ui-anim-btn:hover {
    border-color: hsla(26deg, 70%, 62%, 0.5);
  }
  .ui-anim-btn:hover::before {
    box-shadow:
      0 -8px 10px -6px #fff9 inset,
      0 -16px 16px -8px var(--highlight-30) inset,
      1px 1px 1px #fff2,
      -1px -1px 1px #0002;
  }
  .ui-anim-btn:hover::after { opacity: 1; }
  .ui-anim-btn:hover .ui-anim-btn-svg {
    fill: #fff;
    filter: drop-shadow(0 0 4px var(--highlight)) drop-shadow(0 -4px 6px #0009);
    animation: none;
  }
  .ui-anim-btn:active {
    border-color: hsla(26deg, 70%, 62%, 0.8);
    background-color: hsla(26deg, 40%, 18%, 0.6);
  }
  .ui-anim-btn:active::after { opacity: 1; filter: brightness(180%); }
  .ui-anim-btn:active .ui-anim-letter {
    text-shadow: 0 0 2px hsla(26deg,100%,85%,0.9);
    animation: none;
  }
  .ui-anim-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .ui-anim-btn-svg {
    fill: rgba(255,220,190,0.85);
    flex-shrink: 0;
    margin-right: 8px;
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 0 2px rgba(255,200,150,0.6));
    animation: ui-flicker 2s linear infinite;
    animation-delay: 0.5s;
    transition: fill 0.4s, filter 0.4s;
  }
  @keyframes ui-flicker {
    50% { opacity: 0.35; }
  }

  .ui-anim-txt-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-width: 7.5em;
    height: 1.2em;
    z-index: 1;
  }
  .ui-anim-txt-1, .ui-anim-txt-2 {
    position: absolute;
    left: 0;
    white-space: nowrap;
    display: flex;
    transition: opacity 0.3s ease;
  }
  .ui-anim-txt-1 { opacity: 1; }
  .ui-anim-txt-2 { opacity: 0; }
  .ui-anim-btn.is-loading .ui-anim-txt-1 { opacity: 0; }
  .ui-anim-btn.is-loading .ui-anim-txt-2 { opacity: 1; }

  .ui-anim-letter {
    display: inline-block;
    color: rgba(255,255,255,0.75);
    animation: ui-letter-anim 2s ease-in-out infinite;
    transition: color 0.4s, text-shadow 0.4s;
  }
  @keyframes ui-letter-anim {
    50% { text-shadow: 0 0 4px rgba(255,200,150,0.7); color: #fff; }
  }
  .ui-anim-txt-1 .ui-anim-letter:nth-child(1)  { animation-delay: 0s; }
  .ui-anim-txt-1 .ui-anim-letter:nth-child(2)  { animation-delay: 0.08s; }
  .ui-anim-txt-1 .ui-anim-letter:nth-child(3)  { animation-delay: 0.16s; }
  .ui-anim-txt-1 .ui-anim-letter:nth-child(4)  { animation-delay: 0.24s; }
  .ui-anim-txt-1 .ui-anim-letter:nth-child(5)  { animation-delay: 0.32s; }
  .ui-anim-txt-1 .ui-anim-letter:nth-child(6)  { animation-delay: 0.40s; }
  .ui-anim-txt-1 .ui-anim-letter:nth-child(7)  { animation-delay: 0.48s; }
  .ui-anim-txt-1 .ui-anim-letter:nth-child(8)  { animation-delay: 0.56s; }
  .ui-anim-txt-1 .ui-anim-letter:nth-child(9)  { animation-delay: 0.64s; }
  .ui-anim-txt-1 .ui-anim-letter:nth-child(10) { animation-delay: 0.72s; }
  .ui-anim-txt-1 .ui-anim-letter:nth-child(11) { animation-delay: 0.80s; }
  .ui-anim-txt-2 .ui-anim-letter:nth-child(1)  { animation-delay: 0s; }
  .ui-anim-txt-2 .ui-anim-letter:nth-child(2)  { animation-delay: 0.08s; }
  .ui-anim-txt-2 .ui-anim-letter:nth-child(3)  { animation-delay: 0.16s; }
  .ui-anim-txt-2 .ui-anim-letter:nth-child(4)  { animation-delay: 0.24s; }
  .ui-anim-txt-2 .ui-anim-letter:nth-child(5)  { animation-delay: 0.32s; }
  .ui-anim-txt-2 .ui-anim-letter:nth-child(6)  { animation-delay: 0.40s; }
  .ui-anim-txt-2 .ui-anim-letter:nth-child(7)  { animation-delay: 0.48s; }
  .ui-anim-txt-2 .ui-anim-letter:nth-child(8)  { animation-delay: 0.56s; }
  .ui-anim-txt-2 .ui-anim-letter:nth-child(9)  { animation-delay: 0.64s; }
  .ui-anim-txt-2 .ui-anim-letter:nth-child(10) { animation-delay: 0.72s; }
  .ui-anim-txt-2 .ui-anim-letter:nth-child(11) { animation-delay: 0.80s; }
  .ui-anim-txt-2 .ui-anim-letter:nth-child(12) { animation-delay: 0.88s; }
  .ui-anim-txt-2 .ui-anim-letter:nth-child(13) { animation-delay: 0.96s; }
`;

function DownloadButton({ onClick, loading }) {
  return (
    <>
      <style>{DOWNLOAD_BTN_CSS}</style>
      <button
        onClick={onClick}
        disabled={loading}
        className={`ui-anim-btn${loading ? " is-loading" : ""}`}
        aria-label={loading ? "Generating PDF…" : "Download PDF"}
      >
        {/* Sparkle / download icon */}
        {loading ? (
          <svg className="ui-anim-btn-svg" width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"/>
          </svg>
        ) : (
          <svg className="ui-anim-btn-svg" width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/>
          </svg>
        )}
        {/* Label layers */}
        <div className="ui-anim-txt-wrapper">
          <div className="ui-anim-txt-1">
            {"Download PDF".split("").map((ch, i) => (
              <span key={i} className="ui-anim-letter">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </div>
          <div className="ui-anim-txt-2">
            {"Generating PDF…".split("").map((ch, i) => (
              <span key={i} className="ui-anim-letter">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </div>
        </div>
      </button>
    </>
  );
}

// Scales an 820px-wide preview to fit its container,
// and corrects the container height so scaled content isn't clipped.
function PreviewScaler({ children }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [innerH, setInnerH] = useState(0);

  useEffect(() => {
    const recalc = () => {
      if (!outerRef.current || !innerRef.current) return;
      const w = outerRef.current.offsetWidth;
      const s = Math.min(1, w / 820);
      setScale(s);
      setInnerH(innerRef.current.scrollHeight);
    };

    recalc();

    const ro = new ResizeObserver(recalc);
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, []);

  const containerH = innerH > 0 ? innerH * scale : "auto";

  return (
    <div ref={outerRef} style={{ width: "100%", overflow: "hidden", height: containerH }}>
      <div
        ref={innerRef}
        style={{ transformOrigin: "top left", transform: `scale(${scale})`, width: 820 }}
      >
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [invoice, setInvoice]     = useState(initInvoice);
  const [loading, setLoading]     = useState(false);
  const [mobileTab, setMobileTab] = useState("edit");
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 860);
  const [previewOpen, setPreviewOpen] = useState(true);
  const previewRef = useRef(null);

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 860);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const handleDownload = async () => {
    setLoading(true);
    try { await downloadInvoice(previewRef, invoice.refNumber); }
    finally { setLoading(false); }
  };

  const HEADER_H = 54;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: C.pageBg, fontFamily: "DM Sans, sans-serif", overflow: "hidden" }}>

      {/* ── Header ─────────────────────────────────── */}
      <header style={{
        flexShrink: 0,
        height: HEADER_H,
        background: C.cardBg,
        borderBottom: `1px solid ${C.border}`,
        padding: "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 1px 16px rgba(0,0,0,0.35)",
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <ChefUXLogo height={32} />
          <div style={{ width: 1, height: 18, background: C.border }} />
          <span style={{ fontWeight: 600, fontSize: 11, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Invoice Creator
          </span>
        </div>

        {/* Desktop preview toggle */}
        {isDesktop && (
          <button
            id="preview-toggle"
            onClick={() => setPreviewOpen((o) => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "6px 14px", borderRadius: 8,
              border: `1px solid ${previewOpen ? C.coral : C.border}`,
              background: previewOpen ? C.coralDim : "transparent",
              color: previewOpen ? C.coral : C.muted,
              cursor: "pointer", fontWeight: 600, fontSize: 12,
              fontFamily: "DM Sans, sans-serif",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!previewOpen) { e.currentTarget.style.borderColor = C.coral; e.currentTarget.style.color = C.coral; }
            }}
            onMouseLeave={(e) => {
              if (!previewOpen) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }
            }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            {previewOpen ? "Hide Preview" : "Show Preview"}
          </button>
        )}

        {/* Mobile tab toggle — only shown below desktop */}
        {!isDesktop && (
          <div style={{ display: "flex", gap: 2, background: C.pkgBg, borderRadius: 8, padding: 3 }}>
            {["edit", "preview"].map((tab) => (
              <button key={tab} onClick={() => setMobileTab(tab)} style={{
                padding: "5px 16px", borderRadius: 6, border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 12, fontFamily: "DM Sans, sans-serif",
                background: mobileTab === tab ? C.cardBg : "transparent",
                color: mobileTab === tab ? C.white : C.muted,
                transition: "all 0.15s", textTransform: "capitalize",
              }}>
                {tab}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Body ───────────────────────────────────── */}
      {isDesktop ? (
        /* Desktop: two independent scrolling panels */
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0, position: "relative" }}>

          {/* Left — Form panel */}
          <div style={{
            width: previewOpen ? 460 : "100%",
            flexShrink: 0,
            overflowY: "auto",
            borderRight: `1px solid ${C.border}`,
            background: C.cardBg,
            transition: "width 0.25s ease",
          }}>
            <InvoiceForm invoice={invoice} onChange={setInvoice} />
          </div>

          {/* Right — Preview panel (collapsible) */}
          <div style={{
            flex: 1,
            overflowY: previewOpen ? "auto" : "hidden",
            overflowX: "hidden",
            maxWidth: previewOpen ? "100%" : 0,
            opacity: previewOpen ? 1 : 0,
            padding: previewOpen ? "20px 24px" : 0,
            minWidth: 0,
            transition: "max-width 0.25s ease, opacity 0.2s ease, padding 0.25s ease",
          }}>
            <div style={{ marginBottom: 16 }}>
              <DownloadButton onClick={handleDownload} loading={loading} />
            </div>

            <div style={{
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
              boxShadow: C.shadow,
            }}>
              <PreviewScaler>
                <InvoicePreview ref={previewRef} invoice={invoice} />
              </PreviewScaler>
            </div>

            <div style={{ height: 24 }} />
          </div>
        </div>
      ) : (
        /* Mobile: tabbed, with sticky download footer */
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 68 }}>
          {mobileTab === "edit" ? (
            <div style={{ background: C.cardBg, minHeight: "100%" }}>
              <InvoiceForm invoice={invoice} onChange={setInvoice} />
            </div>
          ) : (
            <div style={{ padding: 12 }}>
              <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: C.shadow }}>
                <PreviewScaler>
                  <InvoicePreview ref={previewRef} invoice={invoice} />
                </PreviewScaler>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile sticky footer */}
      {!isDesktop && (
        <div style={{
          flexShrink: 0,
          padding: "10px 16px",
          background: C.cardBg,
          borderTop: `1px solid ${C.border}`,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
        }}>
          <DownloadButton onClick={handleDownload} loading={loading} />
        </div>
      )}
    </div>
  );
}
