import { useState, useRef, useEffect } from "react";
import { C } from "./tokens.js";
import InvoiceForm from "./components/InvoiceForm.jsx";
import InvoicePreview from "./components/InvoicePreview.jsx";
import ChefUXLogo from "./components/ChefUXLogo.jsx";
import { loadBizInfo, nextInvoiceNumber } from "./utils/storage.js";
import { downloadInvoice } from "./utils/pdf.js";
import { fetchRate } from "./utils/exchangeRate.js";

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

const HBG_CSS = `
  @property --hbg-a {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes hbg-rotate {
    to { --hbg-a: 360deg; }
  }
  @keyframes hbg-ring-spin {
    to { transform: rotate(360deg); }
  }

  /* Outer wrapper — the visible 1px "border" is the gradient showing through */
  .hbg-wrap {
    position: relative;
    border-radius: 50px;
    padding: 1px;
    overflow: hidden;
    width: 100%;
    background: #0B0B14;
  }

  /* Rotating conic-gradient layer */
  .hbg-spin {
    position: absolute;
    inset: 0;
    background: conic-gradient(
      from var(--hbg-a) at 50% 50%,
      transparent        0deg,
      rgba(200,215,255,0.06) 35deg,
      rgba(255,255,255,0.55) 65deg,
      rgba(75,107,220,0.60)  88deg,
      rgba(200,215,255,0.06) 118deg,
      transparent        175deg
    );
    animation: hbg-rotate 2.5s linear infinite;
    filter: blur(1px);
  }
  .hbg-wrap.is-hovered .hbg-spin {
    animation-play-state: paused;
  }

  /* Blue radial glow — fades in on hover */
  .hbg-glow {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(75% 181% at 50% 50%, rgba(75,107,220,0.60) 0%, transparent 100%);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }
  .hbg-wrap.is-hovered .hbg-glow { opacity: 1; }

  /* Inner button — dark bg fills, leaving just the 1px gradient "border" */
  .hbg-btn {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 46px;
    padding: 0 24px;
    border-radius: 48px;
    border: none;
    background: #11111E;
    color: #fff;
    font-family: DM Sans, sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .hbg-wrap.is-hovered .hbg-btn { background: #13132e; }
  .hbg-btn:active                { background: #0d0d22; }
  .hbg-btn:disabled              { opacity: 0.45; cursor: not-allowed; }

  /* Sparkle icon */
  .hbg-icon {
    flex-shrink: 0;
    fill: rgba(200,215,255,0.85);
    filter: drop-shadow(0 0 3px rgba(140,165,255,0.4));
    transition: fill 0.3s, filter 0.3s;
  }
  .hbg-wrap.is-hovered .hbg-icon {
    fill: #fff;
    filter: drop-shadow(0 0 5px rgba(160,185,255,0.65));
  }

  /* Label swap — idle ↔ loading */
  .hbg-label {
    position: relative;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    min-width: 7.8em;
    height: 1.2em;
  }
  .hbg-lbl-idle,
  .hbg-lbl-busy {
    position: absolute;
    left: 0;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .hbg-lbl-idle { opacity: 1; transform: translateY(0); }
  .hbg-lbl-busy { opacity: 0; transform: translateY(6px); }
  .hbg-btn.is-loading .hbg-lbl-idle { opacity: 0; transform: translateY(-6px); }
  .hbg-btn.is-loading .hbg-lbl-busy { opacity: 1; transform: translateY(0); }

  /* Spinner ring */
  .hbg-spinner {
    width: 13px; height: 13px;
    border: 2px solid rgba(200,215,255,0.2);
    border-top-color: rgba(200,215,255,0.9);
    border-radius: 50%;
    animation: hbg-ring-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
`;

function DownloadButton({ onClick, loading }) {
  const [hovered, setHovered] = useState(false);
  return (
    <>
      <style>{HBG_CSS}</style>
      <div
        className={`hbg-wrap${hovered ? " is-hovered" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="hbg-spin" />
        <div className="hbg-glow" />
        <button
          onClick={onClick}
          disabled={loading}
          className={`hbg-btn${loading ? " is-loading" : ""}`}
          aria-label={loading ? "Generating PDF…" : "Download PDF"}
        >
          {/* Sparkle icon */}
          <svg className="hbg-icon" width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/>
          </svg>
          {/* Label swap */}
          <div className="hbg-label">
            <span className="hbg-lbl-idle">Download PDF</span>
            <span className="hbg-lbl-busy">
              <span className="hbg-spinner" />
              Generating…
            </span>
          </div>
        </button>
      </div>
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
  const [liveRate, setLiveRate]   = useState({ rate: 1, loading: false, error: null, currency: "USD", updatedAt: null });
  const previewRef = useRef(null);

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 860);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Fetch live exchange rate whenever currency changes
  useEffect(() => {
    if (invoice.currency === "USD") {
      setLiveRate({ rate: 1, loading: false, error: null, currency: "USD", updatedAt: null });
      return;
    }
    setLiveRate((r) => ({ ...r, loading: true, error: null }));
    fetchRate(invoice.currency)
      .then(({ rate, updatedAt }) =>
        setLiveRate({ rate, loading: false, error: null, currency: invoice.currency, updatedAt })
      )
      .catch(() =>
        setLiveRate((r) => ({ ...r, loading: false, error: "Rate unavailable" }))
      );
  }, [invoice.currency]);

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
            <InvoiceForm invoice={invoice} onChange={setInvoice} liveRate={liveRate} />
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
                <InvoicePreview ref={previewRef} invoice={invoice} liveRate={liveRate} />
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
              <InvoiceForm invoice={invoice} onChange={setInvoice} liveRate={liveRate} />
            </div>
          ) : (
            <div style={{ padding: 12 }}>
              <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: C.shadow }}>
                <PreviewScaler>
                  <InvoicePreview ref={previewRef} invoice={invoice} liveRate={liveRate} />
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
