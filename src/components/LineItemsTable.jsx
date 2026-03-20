import { C } from "../tokens.js";

const inputSt = {
  width: "100%", border: `1px solid ${C.border}`, borderRadius: 7,
  padding: "8px 10px", background: C.inputBg, color: C.text,
  outline: "none", fontSize: 12, fontFamily: "DM Sans, sans-serif",
  boxSizing: "border-box", transition: "border-color 0.15s",
};
const selectSt = {
  ...inputSt, cursor: "pointer", appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: 24,
};
const onFocus = (e) => (e.target.style.borderColor = C.coral);
const onBlur  = (e) => (e.target.style.borderColor = C.border);

const TAGS = ["", "included", "free", "complimentary", "optional"];

const fmt = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function LineItemsTable({ items, onChange }) {
  const update = (id, field, val) =>
    onChange(items.map((r) => r.id === id ? { ...r, [field]: val } : r));
  const remove = (id) => onChange(items.filter((r) => r.id !== id));
  const add    = () => onChange([...items, { id: Date.now(), category: "", name: "", description: "", qty: 1, unitPrice: 0, tag: "" }]);

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((row, idx) => {
          const isComped = ["included", "free", "complimentary"].includes((row.tag || "").toLowerCase());
          const amount   = isComped ? null : Number(row.qty || 1) * Number(row.unitPrice || 0);

          return (
            <div key={row.id} style={{
              background: C.pageBg, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "12px 12px 10px",
              position: "relative",
            }}>
              {/* Item number badge */}
              <div style={{
                position: "absolute", top: -10, left: 12,
                background: C.borderMid, borderRadius: 4,
                padding: "1px 7px", fontSize: 9, fontWeight: 700,
                color: C.muted, letterSpacing: "0.06em",
              }}>
                #{idx + 1}
              </div>

              {/* Row 1: Category + Tag */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={labelSt}>Category</label>
                  <input style={inputSt} placeholder="e.g. Design Phase"
                    value={row.category} onChange={(e) => update(row.id, "category", e.target.value)}
                    onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={labelSt}>Tag</label>
                  <select style={selectSt} value={row.tag}
                    onChange={(e) => update(row.id, "tag", e.target.value)}
                    onFocus={onFocus} onBlur={onBlur}>
                    {TAGS.map((t) => (
                      <option key={t} value={t}>{t ? t.charAt(0).toUpperCase() + t.slice(1) : "— No tag —"}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Name */}
              <div style={{ marginBottom: 8 }}>
                <label style={labelSt}>Item Name</label>
                <input style={{ ...inputSt, fontWeight: 600 }}
                  placeholder="e.g. High-Fidelity Visual Design"
                  value={row.name} onChange={(e) => update(row.id, "name", e.target.value)}
                  onFocus={onFocus} onBlur={onBlur} />
              </div>

              {/* Row 3: Description */}
              <div style={{ marginBottom: 8 }}>
                <label style={labelSt}>Description (optional)</label>
                <input style={{ ...inputSt, color: C.muted }}
                  placeholder="Brief detail about this item"
                  value={row.description} onChange={(e) => update(row.id, "description", e.target.value)}
                  onFocus={onFocus} onBlur={onBlur} />
              </div>

              {/* Row 4: Qty + Price + Amount + Delete */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: "0 0 70px" }}>
                  <label style={labelSt}>Qty</label>
                  <input type="number" min="0" style={{ ...inputSt, textAlign: "center" }}
                    value={row.qty} onChange={(e) => update(row.id, "qty", e.target.value)}
                    disabled={isComped} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelSt}>Unit Price</label>
                  <input type="number" min="0" step="0.01" placeholder="0"
                    style={{ ...inputSt, textAlign: "right", opacity: isComped ? 0.4 : 1 }}
                    value={row.unitPrice} onChange={(e) => update(row.id, "unitPrice", e.target.value)}
                    disabled={isComped} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelSt}>Amount</label>
                  <div style={{
                    padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.border}`,
                    background: "transparent", textAlign: "right",
                    fontWeight: 700, fontSize: 13,
                    color: isComped ? C.green : C.text,
                  }}>
                    {isComped ? "—" : `$${fmt(amount)}`}
                  </div>
                </div>
                <button onClick={() => remove(row.id)} title="Remove" style={{
                  marginTop: 18, width: 32, height: 32, borderRadius: 7,
                  border: `1px solid ${C.border}`, background: "transparent",
                  cursor: "pointer", color: C.muted, fontSize: 18,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "border-color 0.15s, background 0.15s, color 0.15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,80,80,0.1)"; e.currentTarget.style.color = "#e05353"; e.currentTarget.style.borderColor = "#e05353"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}>
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add row */}
      <button onClick={add} style={{
        marginTop: 10, padding: "9px 0", width: "100%",
        border: `1.5px dashed ${C.borderMid}`, borderRadius: 10,
        background: "transparent", cursor: "pointer",
        color: C.coral, fontWeight: 600, fontSize: 12,
        fontFamily: "DM Sans, sans-serif",
        transition: "border-color 0.15s, background 0.15s",
      }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.coral; e.currentTarget.style.background = C.coralDim; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.background = "transparent"; }}>
        + Add line item
      </button>
    </div>
  );
}

const labelSt = {
  display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.07em",
  textTransform: "uppercase", color: C.muted, marginBottom: 4,
};
