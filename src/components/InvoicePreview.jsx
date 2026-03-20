import { forwardRef } from "react";
import { C } from "../tokens.js";
import ChefUXLogo from "./ChefUXLogo.jsx";

const fmt = (n, currency = "USD") => {
  const num = Number(n || 0);
  const formatted = num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (currency === "EUR") return `€${formatted}`;
  if (currency === "GBP") return `£${formatted}`;
  if (currency === "PLN") return `${formatted} zł`;
  if (currency === "LKR") return `Rs ${formatted}`;
  return `$${formatted}`; // USD, AUD, CAD, default
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
};

// Group items by category
function groupItems(items) {
  const groups = [];
  const seen = new Map();
  for (const item of items) {
    const cat = (item.category || "").trim() || "General";
    if (!seen.has(cat)) {
      seen.set(cat, []);
      groups.push({ category: cat, items: [] });
    }
    groups.find((g) => g.category === cat).items.push(item);
  }
  return groups;
}

const TAG_STYLES = {
  included:      { bg: C.blueDim,  color: C.blue,  label: "Included" },
  free:          { bg: C.greenDim, color: C.green,  label: "Free" },
  complimentary: { bg: C.greenDim, color: C.green,  label: "Complimentary" },
  optional:      { bg: "rgba(107,114,128,0.15)", color: C.muted, label: "Optional" },
};

function Tag({ type }) {
  if (!type) return null;
  const style = TAG_STYLES[type.toLowerCase()] || TAG_STYLES.optional;
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      padding: "2px 7px", borderRadius: 4,
      background: style.bg, color: style.color,
      fontFamily: "DM Sans, sans-serif",
    }}>
      {style.label}
    </span>
  );
}

function MetaLabel({ children }) {
  return (
    <div style={{
      fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
      color: C.muted, marginBottom: 4, fontFamily: "DM Sans, sans-serif",
    }}>
      {children}
    </div>
  );
}

const InvoicePreview = forwardRef(function InvoicePreview({ invoice, liveRate }, ref) {
  const {
    docType = "INVOICE",
    refNumber = "INV-0001",
    issueDate, dueDate, currency = "USD",
    bizName, bizCompany, bizAddress, bizEmail, bizPhone, bizVat,
    clientName, clientCompany, clientAddress, clientEmail, clientVat,
    projectName, scope, timeline, rate,
    packageName, notes,
    items = [], taxRate = 0,
    terms = [],
    ctaTitle, ctaBody,
  } = invoice;

  const subtotal = items.reduce((s, r) => {
    if (r.tag && ["free", "complimentary"].includes(r.tag.toLowerCase())) return s;
    return s + Number(r.qty || 1) * Number(r.unitPrice || 0);
  }, 0);
  const tax = subtotal * (Number(taxRate) / 100);
  const total = subtotal + tax;

  const groups = groupItems(items);

  return (
    <div
      ref={ref}
      id="invoice-preview"
      style={{
        width: 820,
        background: C.pageBg,
        fontFamily: "DM Sans, sans-serif",
        color: C.text,
        fontSize: 12,
        lineHeight: 1.6,
        boxSizing: "border-box",
      }}
    >
      {/* ── TOP HEADER ──────────────────────────────────────── */}
      <div style={{ padding: "36px 48px 28px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {/* Logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ChefUXLogo height={44} />
          {(bizName || bizCompany) && (
            <div style={{ borderLeft: `1px solid ${C.borderMid}`, paddingLeft: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.white }}>{bizName}</div>
              {bizCompany && <div style={{ fontSize: 10, color: C.muted }}>{bizCompany}</div>}
            </div>
          )}
        </div>

        {/* Right: badge + meta */}
        <div style={{ textAlign: "right" }}>
          <div style={{
            display: "inline-block", padding: "4px 12px", borderRadius: 20,
            background: C.coralDim, color: C.coral,
            fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
            marginBottom: 10,
          }}>
            {docType}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
            {[
              ["Ref.", refNumber],
              ["Date", fmtDate(issueDate)],
              dueDate && ["Due", fmtDate(dueDate)],
              rate && ["Rate", rate],
              currency !== "USD" && ["Currency", currency],
            ].filter(Boolean).map(([label, val]) => (
              <div key={label} style={{ display: "flex", gap: 10, fontSize: 10 }}>
                <span style={{ color: C.muted }}>{label}</span>
                <span style={{ color: C.text, fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PREPARED BY / FOR ───────────────────────────────── */}
      <div style={{ padding: "24px 48px", display: "flex", gap: 40, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ flex: 1 }}>
          <MetaLabel>Prepared by</MetaLabel>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.white, marginBottom: 4 }}>{bizName || "Your Name"}</div>
          {bizCompany && <div style={{ fontSize: 11, color: C.muted }}>{bizCompany}</div>}
          {bizVat && <div style={{ fontSize: 10, color: C.muted }}>VAT/Tax: {bizVat}</div>}
          {bizAddress && <div style={{ fontSize: 10, color: C.muted, whiteSpace: "pre-line" }}>{bizAddress}</div>}
          {bizEmail && <div style={{ fontSize: 10, color: C.muted }}>{bizEmail}</div>}
          {bizPhone && <div style={{ fontSize: 10, color: C.muted }}>{bizPhone}</div>}
        </div>
        <div style={{ flex: 1 }}>
          <MetaLabel>Prepared for</MetaLabel>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.white, marginBottom: 4 }}>{clientName || "Client Name"}</div>
          {clientCompany && <div style={{ fontSize: 11, color: C.muted }}>{clientCompany}</div>}
          {clientVat && <div style={{ fontSize: 10, color: C.muted }}>VAT/Tax: {clientVat}</div>}
          {clientAddress && <div style={{ fontSize: 10, color: C.muted, whiteSpace: "pre-line" }}>{clientAddress}</div>}
          {clientEmail && <div style={{ fontSize: 10, color: C.muted }}>{clientEmail}</div>}
        </div>
      </div>

      {/* ── PROJECT DETAILS ROW ─────────────────────────────── */}
      {(projectName || scope || timeline || rate) && (
        <div style={{
          padding: "16px 48px", display: "flex", gap: 0,
          borderBottom: `1px solid ${C.border}`,
        }}>
          {[
            projectName && ["Project", projectName],
            scope && ["Scope", scope],
            timeline && ["Timeline", timeline],
            rate && ["Rate / Ref", rate],
          ].filter(Boolean).map(([label, val], i) => (
            <div key={label} style={{
              flex: 1,
              paddingLeft: i > 0 ? 24 : 0,
              borderLeft: i > 0 ? `1px solid ${C.border}` : "none",
              marginLeft: i > 0 ? 0 : 0,
            }}>
              <MetaLabel>{label}</MetaLabel>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── NOTES / CONTEXT ─────────────────────────────────── */}
      {notes && (
        <div style={{ padding: "28px 48px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.8, whiteSpace: "pre-line" }}>{notes}</div>
        </div>
      )}

      {/* ── PACKAGE / LINE ITEMS ────────────────────────────── */}
      <div style={{ padding: "36px 48px" }}>
        <div style={{
          background: C.cardBg, borderRadius: 12,
          border: `1px solid ${C.border}`, overflow: "hidden",
        }}>
          {/* Package header */}
          <div style={{
            padding: "24px 32px", display: "flex", justifyContent: "space-between",
            alignItems: "flex-end", borderBottom: `1px solid ${C.border}`,
          }}>
            <div>
              <div style={{
                fontSize: 38, fontWeight: 800, fontStyle: "italic",
                color: C.white, lineHeight: 1, letterSpacing: "-0.02em",
              }}>
                {packageName || docType}
              </div>
              {(projectName || scope) && (
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                  {[projectName, scope].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Total</div>
              <div style={{
                fontSize: 32, fontWeight: 800, color: C.coral, lineHeight: 1,
                letterSpacing: "-0.02em",
              }}>
                {fmt(total, currency)}
              </div>
              {Number(taxRate) > 0 && (
                <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
                  incl. {taxRate}% tax ({fmt(tax, currency)})
                </div>
              )}
            </div>
          </div>

          {/* Line item groups */}
          {groups.map((group, gi) => (
            <div key={group.category}>
              {/* Category header */}
              {(groups.length > 1 || group.category !== "General") && (
                <div style={{
                  padding: "12px 32px 8px",
                  borderBottom: `1px solid ${C.border}`,
                  borderTop: gi > 0 ? `1px solid ${C.border}` : "none",
                }}>
                  <div style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: C.muted,
                  }}>
                    {group.category}
                  </div>
                </div>
              )}

              {/* Items */}
              {group.items.map((item, ii) => {
                const isComped = item.tag && ["free", "complimentary"].includes(item.tag.toLowerCase());
                const amount = isComped ? null : Number(item.qty || 1) * Number(item.unitPrice || 0);
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: "14px 32px",
                      background: ii % 2 === 1 ? C.rowAlt : "transparent",
                      borderBottom: `1px solid ${C.border}`,
                      display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: item.description ? 2 : 0 }}>
                        <span style={{ fontWeight: 600, fontSize: 12, color: C.white }}>{item.name || "—"}</span>
                        <Tag type={item.tag} />
                      </div>
                      {item.description && (
                        <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>{item.description}</div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {isComped ? (
                        <span style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>—</span>
                      ) : (
                        <>
                          <div style={{ fontWeight: 700, fontSize: 12, color: C.text }}>{fmt(amount, currency)}</div>
                          {Number(item.qty) > 1 && (
                            <div style={{ fontSize: 9, color: C.muted }}>{item.qty} × {fmt(item.unitPrice, currency)}</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Totals footer inside card */}
          <div style={{ padding: "16px 32px", background: C.pkgBg }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: C.muted }}>Subtotal</span>
              <span style={{ fontWeight: 600, minWidth: 90, textAlign: "right" }}>{fmt(subtotal, currency)}</span>
            </div>
            {Number(taxRate) > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, alignItems: "center", marginTop: 4 }}>
                <span style={{ fontSize: 10, color: C.muted }}>Tax ({taxRate}%)</span>
                <span style={{ fontWeight: 600, minWidth: 90, textAlign: "right" }}>{fmt(tax, currency)}</span>
              </div>
            )}
            <div style={{
              display: "flex", justifyContent: "flex-end", gap: 24, alignItems: "center",
              marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.borderMid}`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.white }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: C.coral, minWidth: 90, textAlign: "right" }}>{fmt(total, currency)}</span>
            </div>
            {/* Live rate reference footnote */}
            {currency !== "USD" && liveRate?.rate && !liveRate?.loading && (
              <div style={{
                marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.faint}`,
                display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 5,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3DAA6D", flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: C.muted }}>
                  Ref rate: 1 USD = {liveRate.rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {currency}
                  {liveRate.updatedAt ? ` · ${liveRate.updatedAt}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TERMS ───────────────────────────────────────────── */}
      {terms.filter((t) => t.label && t.value).length > 0 && (
        <div style={{ padding: "0 48px 36px" }}>
          <div style={{
            fontSize: 20, fontWeight: 800, color: C.white, marginBottom: 20,
            paddingBottom: 12, borderBottom: `1px solid ${C.border}`,
          }}>
            How We Work
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {terms.filter((t) => t.label && t.value).map((term, i) => (
              <div key={i} style={{
                display: "flex", gap: 32, padding: "12px 0",
                borderBottom: `1px solid ${C.border}`,
                alignItems: "flex-start",
              }}>
                <div style={{
                  width: 100, flexShrink: 0,
                  fontSize: 8, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: C.muted, paddingTop: 2,
                }}>
                  {term.label}
                </div>
                <div style={{ fontSize: 11, color: C.text, lineHeight: 1.7, flex: 1 }}>{term.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA FOOTER ──────────────────────────────────────── */}
      {(ctaTitle || ctaBody) && (
        <div style={{
          margin: "0 48px 0",
          background: C.pkgBg, borderRadius: 12,
          border: `1px solid ${C.border}`,
          padding: "36px 40px",
        }}>
          {ctaTitle && (
            <div style={{
              fontSize: 32, fontWeight: 800, color: C.white,
              lineHeight: 1.2, marginBottom: ctaBody ? 12 : 0,
              letterSpacing: "-0.02em",
            }}>
              {ctaTitle}
            </div>
          )}
          {ctaBody && (
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.8, whiteSpace: "pre-line" }}>{ctaBody}</div>
          )}
          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            {bizEmail && <div style={{ fontSize: 10, color: C.muted }}>{bizEmail}</div>}
            {bizPhone && <div style={{ fontSize: 10, color: C.muted }}>{bizPhone}</div>}
          </div>
        </div>
      )}
      {/* Bottom padding */}
      <div style={{ height: 48 }} />
    </div>
  );
});

export default InvoicePreview;
