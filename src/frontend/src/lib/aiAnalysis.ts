import { useRef } from "react";

export interface BookContext {
  title?: string;
  ageCategory?: string;
  authorSummary?: string;
  keyContext?: string;
  themes?: string;
  writingStyle?: string;
}

export interface Annotation {
  id: bigint;
  text: string;
  color: "yellow" | "red" | "blue" | "orange" | "purple";
  explanation: string;
  proposal: string;
  alternativeProposal?: string;
  approved: boolean;
}

function buildBookContextPrompt(bookContext?: BookContext): string {
  if (!bookContext) return "";
  const parts: string[] = [];
  if (bookContext.title) parts.push(`- Tytuł: ${bookContext.title}`);
  if (bookContext.ageCategory)
    parts.push(`- Kategoria wiekowa: ${bookContext.ageCategory}`);
  if (bookContext.authorSummary)
    parts.push(`- Streszczenie autorskie: ${bookContext.authorSummary}`);
  if (bookContext.keyContext)
    parts.push(`- Kluczowe informacje: ${bookContext.keyContext}`);
  if (bookContext.themes) parts.push(`- Motywy: ${bookContext.themes}`);
  if (bookContext.writingStyle)
    parts.push(`- Styl pisarski: ${bookContext.writingStyle}`);
  if (parts.length === 0) return "";
  return `Kontekst książki:\n${parts.join("\n")}\n\n`;
}

function buildGrammarPrompt(text: string, bookContext?: BookContext): string {
  const customPrompt = localStorage.getItem("ws_system_prompt");
  let system = `${buildBookContextPrompt(bookContext)}Przeanalizuj poniższy tekst pod kątem błędów gramatycznych, stylistycznych oraz propozycji poprawy. Zwróć listę adnotacji w formacie tekstowym. Każda adnotacja na osobnej linii, pola oddzielone sekwencją |||:
COLOR|||TEKST ORYGINALNY|||WYJAŚNIENIE|||PROPOZYCJA
Możliwe wartości COLOR: red, yellow, blue, orange, purple
Przykład:
red|||mając nadzieję że|||Brak przecinka przed że|||mając nadzieję, że
yellow|||był bardzo zły|||Emocja nazwana wprost|||Zacisnął pięści tak mocno, że zbielały mu knykcie
Nie używaj JSON. Nie używaj cudzysłowów jako separatorów. Zwróć TYLKO linie z adnotacjami, bez żadnego dodatkowego tekstu.`;
  if (customPrompt) {
    system += `\n\nDodatkowe instrukcje autora:\n${customPrompt}`;
  }
  return `${system}\n\nTekst do analizy:\n"""\n${text}\n"""`;
}

function buildContextPrompt(
  text: string,
  previousSummaries: string[],
  bookContext?: BookContext,
): string {
  const summariesBlock =
    previousSummaries.length > 0
      ? previousSummaries
          .map((s, i) => `Streszczenie rozdziału ${i + 1}:\n${s}`)
          .join("\n\n")
      : "Brak wcześniejszych rozdziałów.";

  const customPrompt = localStorage.getItem("ws_system_prompt");
  let system = `${buildBookContextPrompt(bookContext)}Jesteś redaktorem powieści. Poniżej znajdują się streszczenia wcześniejszych rozdziałów, które stanowią kontekst dla bieżącego rozdziału. Przeanalizuj bieżący rozdział pod kątem spójności z wcześniejszymi wydarzeniami, błędów gramatycznych, stylistycznych oraz propozycji poprawy. Zwróć listę adnotacji w formacie tekstowym. Każda adnotacja na osobnej linii, pola oddzielone sekwencją |||:
COLOR|||TEKST ORYGINALNY|||WYJAŚNIENIE|||PROPOZYCJA
Możliwe wartości COLOR: red, yellow, blue, orange, purple
Przykład:
red|||mając nadzieję że|||Brak przecinka przed że|||mając nadzieję, że
yellow|||był bardzo zły|||Emocja nazwana wprost|||Zacisnął pięści tak mocno, że zbielały mu knykcie
Nie używaj JSON. Nie używaj cudzysłowów jako separatorów. Zwróć TYLKO linie z adnotacjami, bez żadnego dodatkowego tekstu.`;
  if (customPrompt) {
    system += `\n\nDodatkowe instrukcje autora:\n${customPrompt}`;
  }
  return `${system}\n\nKONTEKST POPRZEDNICH ROZDZIAŁÓW:\n${summariesBlock}\n\nBIĄŻĄCY ROZDZIAŁ DO ANALIZY:\n"""\n${text}\n"""`;
}

function buildDialoguePrompt(text: string, bookContext?: BookContext): string {
  const customPrompt = localStorage.getItem("ws_system_prompt");
  let system = `${buildBookContextPrompt(bookContext)}Przeanalizuj poniższy tekst pod kątem jakości dialogów. Oceń: naturalność wypowiedzi, charakterystykę postaci przez dialog (czy każda postać ma swój unikalny sposób mówienia), użycie tagów dialogowych ("powiedział", "zawołał" itp.) — czy nie są nadmiarowe lub monotonne, czy dialogi napędzają akcję i emocje. Nawet jeśli dialogi są dobrze napisane, zawsze zaproponuj przynajmniej 2-3 drobne sugestie ulepszeń stylistycznych lub alternatywne sformułowania, które mogłyby wzbogacić tekst. Zwróć listę adnotacji w formacie tekstowym. Każda adnotacja na osobnej linii, pola oddzielone sekwencją |||:
COLOR|||TEKST ORYGINALNY|||WYJAŚNIENIE|||PROPOZYCJA
Możliwe wartości COLOR: red, yellow, blue, orange, purple
Przykład:
red|||mając nadzieję że|||Brak przecinka przed że|||mając nadzieję, że
yellow|||był bardzo zły|||Emocja nazwana wprost|||Zacisnął pięści tak mocno, że zbielały mu knykcie
Nie używaj JSON. Nie używaj cudzysłowów jako separatorów. Zwróć TYLKO linie z adnotacjami, bez żadnego dodatkowego tekstu.`;
  if (customPrompt) {
    system += `\n\nDodatkowe instrukcje autora:\n${customPrompt}`;
  }
  return `${system}\n\nTekst do analizy:\n"""\n${text}\n"""`;
}

function buildSceneExpansionPrompt(
  text: string,
  bookContext?: BookContext,
): string {
  const customPrompt = localStorage.getItem("ws_system_prompt");
  let system = `${buildBookContextPrompt(bookContext)}Przeanalizuj poniższy tekst i znajdź miejsca, które można rozbudować o więcej szczegółów sensorycznych (wzrok, dźwięk, dotyk, zapach), opis otoczenia, tempo sceny lub nastrój. Dla każdego fragmentu, który warto rozbudować, zaproponuj rozszerzoną wersję jako propozycję poprawy. Zwróć listę adnotacji w formacie tekstowym. Każda adnotacja na osobnej linii, pola oddzielone sekwencją |||:
COLOR|||TEKST ORYGINALNY|||WYJAŚNIENIE|||PROPOZYCJA
Możliwe wartości COLOR: red, yellow, blue, orange, purple
Przykład:
red|||mając nadzieję że|||Brak przecinka przed że|||mając nadzieję, że
yellow|||był bardzo zły|||Emocja nazwana wprost|||Zacisnął pięści tak mocno, że zbielały mu knykcie
Nie używaj JSON. Nie używaj cudzysłowów jako separatorów. Zwróć TYLKO linie z adnotacjami, bez żadnego dodatkowego tekstu.`;
  if (customPrompt) {
    system += `\n\nDodatkowe instrukcje autora:\n${customPrompt}`;
  }
  return `${system}\n\nTekst do analizy:\n"""\n${text}\n"""`;
}

function buildEmotionPrompt(text: string, bookContext?: BookContext): string {
  const customPrompt = localStorage.getItem("ws_system_prompt");
  let system = `${buildBookContextPrompt(bookContext)}Przeanalizuj poniższy tekst pod kątem zasady "show, don't tell" w odniesieniu do emocji. Znajdź miejsca, gdzie emocja jest nazwana wprost zamiast pokazana przez działanie, mowę ciała, szczegóły lub reakcję postaci (np. "był zły", "czuła smutek", "był przestraszony"). Dla każdego takiego miejsca zaproponuj przepisaną wersję, która pokazuje emocję przez czyny, gesty, mimikę, ton głosu lub szczegóły otoczenia. WSZYSTKIE adnotacje z tej analizy MUSZĄ używać koloru "purple". Zwróć listę adnotacji w formacie tekstowym. Każda adnotacja na osobnej linii, pola oddzielone sekwencją |||:
COLOR|||TEKST ORYGINALNY|||WYJAŚNIENIE|||PROPOZYCJA
Możliwe wartości COLOR: red, yellow, blue, orange, purple
Przykład:
purple|||był bardzo zły|||Emocja nazwana wprost|||Zacisnął pięści tak mocno, że zbielały mu knykcie
Nie używaj JSON. Nie używaj cudzysłowów jako separatorów. Zwróć TYLKO linie z adnotacjami, bez żadnego dodatkowego tekstu.`;
  if (customPrompt) {
    system += `\n\nDodatkowe instrukcje autora:\n${customPrompt}`;
  }
  return `${system}\n\nTekst do analizy:\n"""\n${text}\n"""`;
}

function buildConsistencyPrompt(allChaptersText: string): string {
  const customPrompt = localStorage.getItem("ws_system_prompt");
  let system = `Przeanalizuj poniższy tekst całej książki (wszystkie rozdziały) pod kątem niespójności między rozdziałami. Szukaj: sprzecznych faktów (np. postać ma inny kolor oczu w różnych rozdziałach), nielogicznych skoków czasowych, zapomnianych wątków, niespójnych cech postaci, zmiennych nazw miejsc lub postaci, błędów chronologicznych. Zwróć czytelny tekstowy raport listujący znalezione problemy z odniesieniem do konkretnych rozdziałów. Format: każdy problem w osobnym akapicie, zacznij od numeru rozdziału lub "Ogólne" jeśli dotyczy całości. Nie używaj JSON — zwróć zwykły tekst.`;
  if (customPrompt) {
    system += `\n\nDodatkowe instrukcje autora:\n${customPrompt}`;
  }
  return `${system}\n\nTekst do analizy:\n"""\n${allChaptersText}\n"""`;
}

function buildSummaryPrompt(
  allChaptersText: string,
  summaryType: "short" | "long" | "hooks",
): string {
  const typeInstructions: Record<string, string> = {
    short:
      "Napisz KRÓTKIE streszczenie książki w 3-5 zdaniach, zachowując główne wątki i konflikt.",
    long: "Napisz SZCZEGÓŁOWE streszczenie książki, obejmujące wszystkie główne wątki, rozwój postaci, zwroty akcji i zakończenie. Format: kilka akapitów.",
    hooks:
      "Wymyśl 5-7 CHWYTliwych zdań (tzw. 'hooks') do promocji książki w mediach społecznościowych. Każde zdanie powinno być intrygujące, emocjonalne i zachęcać do przeczytania. Zwróć je jako listę punktowaną.",
  };

  return `${typeInstructions[summaryType]}

Oto pełny tekst wszystkich rozdziałów książki:
"""
${allChaptersText}
"""`;
}

function parsePipeAnnotations(responseText: string): Annotation[] {
  const validColors = new Set<string>([
    "red",
    "yellow",
    "blue",
    "orange",
    "purple",
  ]);
  const lines = responseText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("|||"));

  const annotations = lines
    .map((line) => {
      // Remove everything before the first recognized color
      let workingLine = line;
      const colorMatch = workingLine.match(
        /(red|yellow|blue|orange|purple)\|\|\|/i,
      );
      if (
        colorMatch &&
        colorMatch.index !== undefined &&
        colorMatch.index > 0
      ) {
        workingLine = workingLine.slice(colorMatch.index);
      }

      const parts = workingLine.split("|||");
      if (parts.length < 3) return null;
      const [color, text, explanation, proposal] = parts;
      if (!color?.trim() || !text?.trim() || !explanation?.trim()) return null;
      const colorLower = color.trim().toLowerCase();
      if (!validColors.has(colorLower)) return null;
      return {
        id: 0n,
        color: colorLower as Annotation["color"],
        text: text.trim(),
        explanation: explanation.trim(),
        proposal: (proposal || "").trim(),
        approved: false,
      };
    })
    .filter(Boolean) as Annotation[];
  return annotations;
}

function validateAnnotations(annotations: Annotation[]): Annotation[] {
  console.log("[VALIDATE]", annotations);
  const validColors = new Set<string>([
    "yellow",
    "red",
    "blue",
    "orange",
    "purple",
  ]);
  return annotations
    .map((item, idx) => {
      if (!item || typeof item !== "object") {
        console.warn(`Element ${idx} nie jest obiektem — pominięto`);
        return null;
      }
      const text = item.text;
      const color = item.color;
      const explanation = item.explanation;
      const proposal = item.proposal;
      if (
        typeof text !== "string" ||
        typeof explanation !== "string" ||
        typeof proposal !== "string"
      ) {
        console.warn(`Element ${idx} ma nieprawidłowy typ pól — pominięto`);
        return null;
      }
      const colorStr = String(color).toLowerCase();
      if (!validColors.has(colorStr)) {
        console.warn(
          `Element ${idx} ma nieprawidłowy kolor: ${colorStr} — pominięto`,
        );
        return null;
      }
      return {
        id: 0n,
        text,
        color: colorStr as Annotation["color"],
        explanation,
        proposal,
        approved: false,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

async function callAi(
  prompt: string,
  apiKey: string,
  provider: "openai" | "claude",
  expectJson: boolean,
): Promise<string> {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ISO-8859-1 range filter
  const safeApiKey = apiKey.replace(/[^\x00-\xFF]/g, "").trim();
  if (provider === "openai") {
    const body: Record<string, unknown> = {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 8000,
      temperature: 0.3,
    };
    if (expectJson) {
      body.response_format = { type: "json_object" };
    }
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${safeApiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${err}`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? "";
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": safeApiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude error ${res.status}: ${err}`);
  }
  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const responseText = data.content?.find((c) => c.type === "text")?.text ?? "";
  console.log("[AI RESPONSE]", responseText.substring(0, 500));
  return responseText;
}

export async function analyzeGrammarStyle(
  text: string,
  apiKey: string,
  provider: "openai" | "claude",
  bookContext?: BookContext,
): Promise<Annotation[]> {
  if (text.length > 8000) {
    throw new Error("Tekst za długi");
  }
  const prompt = buildGrammarPrompt(text, bookContext);
  const responseText = await callAi(prompt, apiKey, provider, false);
  const annotations = parsePipeAnnotations(responseText);
  console.log("[PARSED]", annotations.length, annotations);
  return validateAnnotations(annotations);
}

export async function analyzeWithContext(
  currentChapterText: string,
  previousChaptersSummaries: string[],
  apiKey: string,
  provider: "openai" | "claude",
  bookContext?: BookContext,
): Promise<Annotation[]> {
  if (currentChapterText.length > 8000) {
    throw new Error("Tekst za długi");
  }
  const prompt = buildContextPrompt(
    currentChapterText,
    previousChaptersSummaries,
    bookContext,
  );
  const responseText = await callAi(prompt, apiKey, provider, false);
  const annotations = parsePipeAnnotations(responseText);
  return validateAnnotations(annotations);
}

export async function analyzeDialogue(
  text: string,
  apiKey: string,
  provider: "openai" | "claude",
  bookContext?: BookContext,
): Promise<Annotation[]> {
  if (text.length > 8000) {
    throw new Error("Tekst za długi");
  }
  const prompt = buildDialoguePrompt(text, bookContext);
  const responseText = await callAi(prompt, apiKey, provider, false);
  const annotations = parsePipeAnnotations(responseText);
  return validateAnnotations(annotations);
}

export async function analyzeSceneExpansion(
  text: string,
  apiKey: string,
  provider: "openai" | "claude",
  bookContext?: BookContext,
): Promise<Annotation[]> {
  if (text.length > 8000) {
    throw new Error("Tekst za długi");
  }
  const prompt = buildSceneExpansionPrompt(text, bookContext);
  const responseText = await callAi(prompt, apiKey, provider, false);
  const annotations = parsePipeAnnotations(responseText);
  return validateAnnotations(annotations);
}

export async function analyzeEmotion(
  text: string,
  apiKey: string,
  provider: "openai" | "claude",
  bookContext?: BookContext,
): Promise<Annotation[]> {
  if (text.length > 8000) {
    throw new Error("Tekst za długi");
  }
  const prompt = buildEmotionPrompt(text, bookContext);
  const responseText = await callAi(prompt, apiKey, provider, false);
  const annotations = parsePipeAnnotations(responseText);
  const validated = validateAnnotations(annotations);
  // Force purple color for all emotion annotations
  return validated.map((a) => ({ ...a, color: "purple" as const }));
}

export async function analyzeConsistency(
  allChaptersText: string,
  apiKey: string,
  provider: "openai" | "claude",
): Promise<string> {
  if (allChaptersText.length > 50000) {
    throw new Error("Tekst za długi");
  }
  const prompt = buildConsistencyPrompt(allChaptersText);
  return await callAi(prompt, apiKey, provider, false);
}

export async function generateSummary(
  allChaptersText: string,
  summaryType: "short" | "long" | "hooks",
  apiKey: string,
  provider: "openai" | "claude",
): Promise<string> {
  if (allChaptersText.length > 50000) {
    throw new Error("Tekst za długi");
  }
  const prompt = buildSummaryPrompt(allChaptersText, summaryType);
  return await callAi(prompt, apiKey, provider, false);
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildChatPrompt(
  messages: ChatMessage[],
  bookContext: string,
  chapterSummaries?: string[],
): string {
  const history = messages
    .map(
      (m) => `${m.role === "user" ? "Użytkownik" : "Asystent"}: ${m.content}`,
    )
    .join("\n\n");

  const customPrompt = localStorage.getItem("ws_system_prompt");

  let system = `Jesteś asystentem pisarskim dla pisarza. Pomagasz w tworzeniu powieści, odpowiadasz na pytania, proponujesz pomysły na fabułę, postacie, dialogi i rozwój wątków.

KONTEKST KSIĄŻKI:
${bookContext}`;

  if (chapterSummaries && chapterSummaries.length > 0) {
    system += `\n\nSTRESZCZENIA ROZDZIAŁÓW KSIĄŻKI:\n${chapterSummaries.map((s, i) => `Rozdział ${i + 1}:\n${s}`).join("\n\n")}`;
  }

  system += `\n\nHISTORIA ROZMOWY:\n${history}\n\nOdpowiedz na ostatnie pytanie użytkownika. Bądź konstruktywny, konkretny i inspirujący.`;

  if (customPrompt) {
    system += `\n\nDodatkowe instrukcje autora:\n${customPrompt}`;
  }

  return system;
}

export async function getSynonyms(
  word: string,
  apiKey: string,
  provider: "openai" | "claude",
): Promise<string[]> {
  if (!word || word.trim().length === 0) {
    return [];
  }
  const cleanWord = word.trim();
  const prompt = `Podaj 5-8 synonimów polskiego słowa "${cleanWord}" w kontekście języka literackiego. Zwróć wynik jako JSON array zawierający tylko synonimy jako stringi. Nie dodawaj żadnego tekstu przed ani po JSON. Odpowiedź musi być poprawnym JSON.`;
  const responseText = await callAi(prompt, apiKey, provider, true);
  try {
    const parsed = JSON.parse(responseText);
    if (!Array.isArray(parsed)) {
      throw new Error("Oczekiwano tablicy synonimów");
    }
    return parsed
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "synonym" in item) {
          return String((item as Record<string, unknown>).synonym);
        }
        return String(item);
      })
      .filter((s) => s.length > 0);
  } catch {
    console.error("Nie udało się sparsować synonimów:", responseText);
    return [];
  }
}

export async function chatWithBook(
  messages: ChatMessage[],
  bookContext: string,
  apiKey: string,
  provider: "openai" | "claude",
  chapterSummaries?: string[],
): Promise<string> {
  const prompt = buildChatPrompt(messages, bookContext, chapterSummaries);
  return await callAi(prompt, apiKey, provider, false);
}
