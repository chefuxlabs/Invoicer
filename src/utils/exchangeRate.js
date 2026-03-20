// Fetches live exchange rate from frankfurter.app (free, no API key needed)
// Base: USD → target currency
export async function fetchRate(targetCurrency) {
  if (targetCurrency === "USD") {
    return { rate: 1, updatedAt: null };
  }
  const res = await fetch(
    `https://api.frankfurter.app/latest?from=USD&to=${targetCurrency}`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const rate = data.rates?.[targetCurrency];
  if (!rate) throw new Error("Rate not found");
  return { rate, updatedAt: data.date };
}
