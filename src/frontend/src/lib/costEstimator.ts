type ModelId = "claude-sonnet-5" | "claude-sonnet-4-6" | "gpt-4o-mini";

interface ModelPricing {
  inputPerMillion: number; // USD
  outputPerMillion: number; // USD
}

// Ceny standardowe (USD za 1M tokenów). Sonnet 5 ma promocję do 31.08.2026.
function getPricing(model: ModelId): ModelPricing {
  const sonnet5PromoEnds = new Date("2026-08-31T23:59:59Z");
  const now = new Date();

  if (model === "claude-sonnet-5") {
    return now < sonnet5PromoEnds
      ? { inputPerMillion: 2, outputPerMillion: 10 }
      : { inputPerMillion: 3, outputPerMillion: 15 };
  }
  if (model === "claude-sonnet-4-6") {
    return { inputPerMillion: 3, outputPerMillion: 15 };
  }
  return { inputPerMillion: 0.15, outputPerMillion: 0.6 }; // gpt-4o-mini
}

// Przybliżenie: ~4 znaki na token (szacunek, nie dokładna wartość z API)
function estimateTokens(charCount: number): number {
  return Math.ceil(charCount / 4);
}

let cachedUsdToPln: number | null = null;
let cacheTimestamp = 0;

async function getUsdToPlnRate(): Promise<number> {
  const now = Date.now();
  if (cachedUsdToPln !== null && now - cacheTimestamp < 60 * 60 * 1000) {
    return cachedUsdToPln;
  }
  try {
    const res = await fetch(
      "https://api.nbp.pl/api/exchangerates/rates/a/usd?format=json",
    );
    if (!res.ok) throw new Error("NBP API error");
    const data = await res.json();
    const rate = data.rates?.[0]?.mid;
    if (typeof rate === "number") {
      cachedUsdToPln = rate;
      cacheTimestamp = now;
      return rate;
    }
    throw new Error("Brak kursu w odpowiedzi");
  } catch {
    // Fallback: przybliżony stały kurs, gdyby NBP API było niedostępne
    return cachedUsdToPln ?? 4.0;
  }
}

export interface AnalysisCostEstimate {
  model: ModelId;
  inputTokens: number;
  outputTokens: number;
  usd: number;
  pln: number;
  usdToPlnRate: number;
  isEstimate: true;
}

export async function estimateAnalysisCost(
  inputCharCount: number,
  outputCharCount: number,
  model: ModelId,
): Promise<AnalysisCostEstimate> {
  const pricing = getPricing(model);
  const inputTokens = estimateTokens(inputCharCount);
  const outputTokens = estimateTokens(outputCharCount);
  const usd =
    (inputTokens / 1_000_000) * pricing.inputPerMillion +
    (outputTokens / 1_000_000) * pricing.outputPerMillion;
  const usdToPlnRate = await getUsdToPlnRate();
  return {
    model,
    inputTokens,
    outputTokens,
    usd,
    pln: usd * usdToPlnRate,
    usdToPlnRate,
    isEstimate: true,
  };
}
