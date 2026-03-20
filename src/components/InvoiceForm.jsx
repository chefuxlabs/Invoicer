import { useState } from "react";
import { C } from "../tokens.js";
import { saveBizInfo } from "../utils/storage.js";
import LineItemsTable from "./LineItemsTable.jsx";

/* ── Shared input styles ───────────────────────────────────── */
const inputSt = {
  width: "100%", border: `1px solid ${C.border}`, borderRadius: 8,
  padding: "9px 12px", background: C.inputBg, color: C.text,
  outline: "none", fontSize: 13, fontFamily: "DM Sans, sans-serif",
  boxSizing: "border-box", transition: "border-color 0.15s",
};
const selectSt = {
  ...inputSt, cursor: "pointer", appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 30,
};
const onFocus = (e) => (e.target.style.borderColor = C.coral);
const onBlur  = (e) => (e.target.style.borderColor = C.border);

/* ── Accordion Section ─────────────────────────────────────── */
function Section({ id, title, open, onToggle, filled, children }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      {/* Header — always visible, click to toggle */}
      <button
        onClick={() => onToggle(id)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          gap: 10, padding: "14px 20px",
          background: "transparent", border: "none", cursor: "pointer",
          textAlign: "left", transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {/* Filled dot indicator */}
        <div style={{
          width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
          background: filled ? C.coral : C.faint,
          boxShadow: filled ? `0 0 6px ${C.coral}` : "none",
          transition: "background 0.2s, box-shadow 0.2s",
        }} />
        <span style={{
          flex: 1, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: open ? C.coral : C.muted,
          transition: "color 0.15s",
        }}>
          {title}
        </span>
        {/* Chevron */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={open ? C.coral : C.faint} strokeWidth="2.5"
          style={{ transition: "transform 0.25s ease, stroke 0.15s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Animated content — CSS grid trick for smooth height transition */}
      <div style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 0.28s ease",
      }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ padding: "4px 20px 20px" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Field wrapper ─────────────────────────────────────────── */
function Field({ label, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: "0.04em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ label, fieldStyle, ...props }) {
  return (
    <Field label={label} style={fieldStyle}>
      <input style={inputSt} onFocus={onFocus} onBlur={onBlur} {...props} />
    </Field>
  );
}

function Textarea({ label, rows = 2, ...props }) {
  return (
    <Field label={label}>
      <textarea rows={rows} style={{ ...inputSt, resize: "vertical", lineHeight: 1.6 }}
        onFocus={onFocus} onBlur={onBlur} {...props} />
    </Field>
  );
}

function Select({ label, options, ...props }) {
  return (
    <Field label={label}>
      <select style={selectSt} onFocus={onFocus} onBlur={onBlur} {...props}>
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
    </Field>
  );
}

const R2 = ({ children, style }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, ...style }}>
    {children}
  </div>
);

/* ── Terms editor ──────────────────────────────────────────── */
function TermsEditor({ terms, onChange }) {
  const update = (i, f, v) => onChange(terms.map((t, idx) => idx === i ? { ...t, [f]: v } : t));
  const remove = (i) => onChange(terms.filter((_, idx) => idx !== i));
  const add    = () => onChange([...terms, { label: "", value: "" }]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {terms.map((term, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input style={{ ...inputSt, width: 110, flexShrink: 0, fontSize: 12 }}
            placeholder="Label" value={term.label}
            onChange={(e) => update(i, "label", e.target.value)}
            onFocus={onFocus} onBlur={onBlur} />
          <textarea rows={2}
            style={{ ...inputSt, flex: 1, resize: "none", lineHeight: 1.5, fontSize: 12 }}
            placeholder="Value…" value={term.value}
            onChange={(e) => update(i, "value", e.target.value)}
            onFocus={onFocus} onBlur={onBlur} />
          <button onClick={() => remove(i)} style={rmBtnSt}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,80,80,0.12)"; e.currentTarget.style.color = "#e05353"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}>
            ×
          </button>
        </div>
      ))}
      <DashBtn onClick={add} label="+ Add term" />
    </div>
  );
}

const rmBtnSt = {
  width: 30, height: 30, borderRadius: 6, border: "none",
  background: "transparent", cursor: "pointer", color: C.muted,
  fontSize: 18, flexShrink: 0, marginTop: 4,
  transition: "background 0.15s, color 0.15s",
  display: "flex", alignItems: "center", justifyContent: "center",
};

function DashBtn({ onClick, label }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 0", width: "100%",
      border: `1.5px dashed ${C.borderMid}`, borderRadius: 8,
      background: "transparent", cursor: "pointer",
      color: C.coral, fontWeight: 600, fontSize: 12,
      fontFamily: "DM Sans, sans-serif",
      transition: "border-color 0.15s, background 0.15s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.coral; e.currentTarget.style.background = C.coralDim; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.background = "transparent"; }}>
      {label}
    </button>
  );
}

/* ── Helpers to detect if a section has data ───────────────── */
const hasAny = (...vals) => vals.some((v) => v && String(v).trim() !== "" && String(v).trim() !== "—");

/* ── Main Form ─────────────────────────────────────────────── */
export default function InvoiceForm({ invoice, onChange, liveRate }) {
  const set    = (f) => (e) => onChange({ ...invoice, [f]: e.target.value });
  const setVal = (f) => (v) => onChange({ ...invoice, [f]: v });

  // Accordion open state — document + items open by default
  const [open, setOpen] = useState({
    document:  true,
    business:  true,
    client:    false,
    project:   false,
    notes:     false,
    items:     true,
    terms:     false,
    cta:       false,
  });

  const toggle = (id) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSaveBiz = () => {
    const { bizName, bizCompany, bizAddress, bizEmail, bizPhone, bizVat } = invoice;
    saveBizInfo({ bizName, bizCompany, bizAddress, bizEmail, bizPhone, bizVat });
    const btn = document.getElementById("save-biz-btn");
    if (btn) { btn.textContent = "Saved ✓"; setTimeout(() => (btn.textContent = "Save as default"), 1500); }
  };

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", maxWidth: 900, margin: "0 auto" }}>

      {/* ── Document ──────────────────────────────────────────── */}
      <Section id="document" title="Document" open={open.document} onToggle={toggle}
        filled={hasAny(invoice.refNumber, invoice.issueDate)}>
        <R2 style={{ marginBottom: 10 }}>
          <Select label="Type" value={invoice.docType} onChange={set("docType")}
            options={[["INVOICE","Invoice"],["PROPOSAL","Proposal"],["QUOTE","Quote"],["ESTIMATE","Estimate"]]} />
          <Input label="Ref / Invoice #" value={invoice.refNumber} onChange={set("refNumber")} />
        </R2>
        <R2 style={{ marginBottom: 10 }}>
          <Input label="Issue Date" type="date" value={invoice.issueDate} onChange={set("issueDate")} />
          <Input label="Due / Ready By" type="date" value={invoice.dueDate} onChange={set("dueDate")} />
        </R2>
        <Select label="Currency" value={invoice.currency} onChange={set("currency")}
          options={[
            ["USD","USD — US Dollar"],
            ["LKR","LKR — Sri Lankan Rupee"],
            ["EUR","EUR — Euro"],
            ["GBP","GBP — British Pound"],
            ["PLN","PLN — Polish Złoty"],
            ["AUD","AUD — Australian Dollar"],
            ["CAD","CAD — Canadian Dollar"],
          ]} />
        {/* Live exchange rate badge */}
        {invoice.currency !== "USD" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 11, color: C.muted }}>
            {liveRate?.loading ? (
              <span style={{ opacity: 0.6 }}>Fetching rate…</span>
            ) : liveRate?.error ? (
              <span style={{ color: "rgba(220,80,80,0.85)" }}>⚠ {liveRate.error}</span>
            ) : liveRate?.rate ? (
              <>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3DAA6D", flexShrink: 0, display: "inline-block" }} />
                <span>1 USD = {liveRate.rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {invoice.currency}</span>
                <span style={{ opacity: 0.45 }}>· live</span>
                {liveRate.updatedAt && <span style={{ opacity: 0.35 }}>({liveRate.updatedAt})</span>}
              </>
            ) : null}
          </div>
        )}
      </Section>

      {/* ── Your Business ─────────────────────────────────────── */}
      <Section id="business" title="Your Business" open={open.business} onToggle={toggle}
        filled={hasAny(invoice.bizName, invoice.bizEmail)}>
        <R2 style={{ marginBottom: 10 }}>
          <Input label="Your Name" placeholder="Jane Smith" value={invoice.bizName} onChange={set("bizName")} />
          <Input label="Company" placeholder="Studio Co." value={invoice.bizCompany} onChange={set("bizCompany")} />
        </R2>
        <div style={{ marginBottom: 10 }}>
          <Textarea label="Address" placeholder="123 Main St, City, State ZIP" value={invoice.bizAddress} onChange={set("bizAddress")} />
        </div>
        <R2 style={{ marginBottom: 10 }}>
          <Input label="Email" type="email" placeholder="you@email.com" value={invoice.bizEmail} onChange={set("bizEmail")} />
          <Input label="Phone" type="tel" placeholder="+1 555 0000" value={invoice.bizPhone} onChange={set("bizPhone")} />
        </R2>
        <div style={{ marginBottom: 10 }}>
          <Input label="VAT / Tax ID (optional)" placeholder="—" value={invoice.bizVat} onChange={set("bizVat")} />
        </div>
        <button id="save-biz-btn" onClick={handleSaveBiz} style={{
          padding: "6px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8,
          background: "transparent", cursor: "pointer", color: C.muted,
          fontWeight: 600, fontSize: 11, fontFamily: "DM Sans, sans-serif",
          transition: "border-color 0.15s, color 0.15s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.coral; e.currentTarget.style.color = C.coral; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
          Save as default
        </button>
      </Section>

      {/* ── Client ────────────────────────────────────────────── */}
      <Section id="client" title="Bill To (Client)" open={open.client} onToggle={toggle}
        filled={hasAny(invoice.clientName, invoice.clientEmail)}>
        <R2 style={{ marginBottom: 10 }}>
          <Input label="Client Name" placeholder="John Doe" value={invoice.clientName} onChange={set("clientName")} />
          <Input label="Company" placeholder="Client Corp." value={invoice.clientCompany} onChange={set("clientCompany")} />
        </R2>
        <div style={{ marginBottom: 10 }}>
          <Textarea label="Address" placeholder="456 Client Ave, City" value={invoice.clientAddress} onChange={set("clientAddress")} />
        </div>
        <R2>
          <Input label="Client Email" type="email" placeholder="client@email.com" value={invoice.clientEmail} onChange={set("clientEmail")} />
          <Input label="VAT / Tax ID (optional)" placeholder="—" value={invoice.clientVat} onChange={set("clientVat")} />
        </R2>
      </Section>

      {/* ── Project Details ───────────────────────────────────── */}
      <Section id="project" title="Project Details" open={open.project} onToggle={toggle}
        filled={hasAny(invoice.projectName, invoice.packageName, invoice.scope)}>
        <R2 style={{ marginBottom: 10 }}>
          <Input label="Project Name" placeholder="Website Redesign" value={invoice.projectName} onChange={set("projectName")} />
          <Input label="Package Name" placeholder="Rebuild, Scale, Starter…" value={invoice.packageName} onChange={set("packageName")} />
        </R2>
        <R2 style={{ marginBottom: 10 }}>
          <Input label="Scope" placeholder="Figma + React" value={invoice.scope} onChange={set("scope")} />
          <Input label="Timeline" placeholder="3–5 Weeks" value={invoice.timeline} onChange={set("timeline")} />
        </R2>
        <Input label="Rate / Ref" placeholder="$100/hr · March 2026" value={invoice.rate} onChange={set("rate")} />
      </Section>

      {/* ── Context / Notes ───────────────────────────────────── */}
      <Section id="notes" title="Context / Notes" open={open.notes} onToggle={toggle}
        filled={hasAny(invoice.notes)}>
        <Textarea label="Free text shown before line items" rows={4}
          placeholder="This proposal covers…"
          value={invoice.notes} onChange={set("notes")} />
      </Section>

      {/* ── Line Items ────────────────────────────────────────── */}
      <Section id="items" title="Line Items" open={open.items} onToggle={toggle}
        filled={invoice.items.some((r) => hasAny(r.name))}>
        <LineItemsTable items={invoice.items} onChange={setVal("items")} currency={invoice.currency} />
        <div style={{ marginTop: 14 }}>
          <Field label="Tax Rate (%)">
            <div style={{ position: "relative", maxWidth: 120 }}>
              <input type="number" min="0" max="100" step="0.1" placeholder="0"
                value={invoice.taxRate} onChange={set("taxRate")}
                style={{ ...inputSt, paddingRight: 28 }}
                onFocus={onFocus} onBlur={onBlur} />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13, pointerEvents: "none" }}>%</span>
            </div>
          </Field>
        </div>
      </Section>

      {/* ── Terms ─────────────────────────────────────────────── */}
      <Section id="terms" title="How We Work / Terms" open={open.terms} onToggle={toggle}
        filled={invoice.terms.some((t) => hasAny(t.value))}>
        <TermsEditor terms={invoice.terms} onChange={setVal("terms")} />
      </Section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <Section id="cta" title="Call to Action (Footer)" open={open.cta} onToggle={toggle}
        filled={hasAny(invoice.ctaTitle, invoice.ctaBody)}>
        <div style={{ marginBottom: 10 }}>
          <Input label="CTA Title" placeholder="Your sessions start 23 March."
            value={invoice.ctaTitle} onChange={set("ctaTitle")} />
        </div>
        <Textarea label="CTA Body" rows={3}
          placeholder="Reply by [date] and we kick off immediately…"
          value={invoice.ctaBody} onChange={set("ctaBody")} />
      </Section>

      <div style={{ height: 40 }} />
    </div>
  );
}
