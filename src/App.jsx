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

const SHINY_BTN_CSS = `
  .shiny-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 48px;
    padding: 0 24px;
    border-radius: 8px;
    border: none;
    background: linear-gradient(325deg, #0c0e28 0%, #2a3a9e 45%, #4B6BDC 55%, #0c0e28 90%);
    background-size: 280% auto;
    background-position: left center;
    color: #fff;
    font-family: DM Sans, sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    box-shadow:
      0px 0px 18px rgba(75,107,220,0.30),
      0px 5px 5px -1px rgba(75,107,220,0.18),
      inset 4px 4px 8px rgba(160,185,255,0.18),
      inset -4px -4px 8px rgba(12,14,40,0.45);
    transition: background-position 700ms ease, box-shadow 300ms ease, opacity 200ms ease;
    overflow: hidden;
  }
  .shiny-btn:hover {
    background-position: right center;
    box-shadow:
      0px 0px 26px rgba(75,107,220,0.45),
      0px 5px 8px -1px rgba(75,107,220,0.28),
      inset 4px 4px 8px rgba(175,200,255,0.28),
      inset -4px -4px 8px rgba(12,14,40,0.5);
  }
  .shiny-btn:active {
    background-position: right center;
    box-shadow:
      0px 0px 12px rgba(75,107,220,0.35),
      inset 2px 2px 6px rgba(140,165,255,0.15),
      inset -2px -2px 6px rgba(8,10,32,0.5);
  }
  .shiny-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    background-position: left center;
  }
  .shiny-btn-icon {
    flex-shrink: 0;
    fill: rgba(200,215,255,0.9);
    filter: drop-shadow(0 0 3px rgba(140,165,255,0.5));
    transition: fill 0.3s, filter 0.3s;
  }
  .shiny-btn:hover .shiny-btn-icon {
    fill: #fff;
    filter: drop-shadow(0 0 5px rgba(150,180,255,0.7));
  }
  .shiny-btn-label {
    position: relative;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    min-width: 7.8em;
    height: 1.2em;
  }
  .shiny-lbl-idle,
  .shiny-lbl-busy {
    position: absolute;
    left: 0;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .shiny-lbl-idle  { opacity: 1;  transform: translateY(0); }
  .shiny-lbl-busy  { opacity: 0;  transform: translateY(6px); }
  .shiny-btn.is-loading .shiny-lbl-idle { opacity: 0; transform: translateY(-6px); }
  .shiny-btn.is-loading .shiny-lbl-busy { opacity: 1; transform: translateY(0); }

  @keyframes shiny-spin {
    to { transform: rotate(360deg); }
  }
  .shiny-spinner {
    width: 13px; height: 13px;
    border: 2px solid rgba(200,215,255,0.25);
    border-top-color: rgba(200,215,255,0.9);
    border-radius: 50%;
    animation: shiny-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
`;

function DownloadButton({ onClick, loading }) {
  return (
    <>
      <style>{SHINY_BTN_CSS}</style>
      <button
        onClick={onClick}
        disabled={loading}
        className={`shiny-btn${loading ? " is-loading" : ""}`}
        aria-label={loading ? "Generating PDF…" : "Download PDF"}
      >
        {/* Sparkle icon */}
        <svg className="shiny-btn-icon" width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/>
        </svg>
        {/* Label swap */}
        <div className="shiny-btn-label">
          <span className="shiny-lbl-idle">Download PDF</span>
          <span className="shiny-lbl-busy">
            <span className="shiny-spinner" />
            Generating…
          </span>
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
