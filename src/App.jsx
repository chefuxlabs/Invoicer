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

function DownloadButton({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "13px 24px", borderRadius: 10, border: "none",
        background: loading ? C.faint : C.coral, color: C.white,
        fontWeight: 700, fontSize: 13, fontFamily: "DM Sans, sans-serif",
        cursor: loading ? "not-allowed" : "pointer", width: "100%",
        transition: "background 0.2s",
        boxShadow: loading ? "none" : "0 4px 20px rgba(196,130,90,0.3)",
      }}
      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#b5724d"; }}
      onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = loading ? C.faint : C.coral; }}
    >
      {loading ? <>⏳ Generating PDF…</> : (
        <>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PDF
        </>
      )}
    </button>
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
