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
  return `${buildBookContextPrompt(bookContext)}Przeanalizuj poniższy tekst pod kątem błędów gramatycznych, stylistycznych oraz propozycji poprawy. Zwróć wynik jako JSON array, gdzie każdy element ma pola: "text" (fragment tekstu, którego dotyczy adnotacja), "color" (jeden z: yellow, red, blue, orange, purple), "explanation" (wyjaśnienie problemu), "proposal" (propozycja poprawy). Kolory oznaczają: yellow = drobna uwaga stylistyczna, red = błąd gramatyczny, blue = sugestia stylistyczna, orange = powtórzenie lub nadmiarowość, purple = niejasność lub nieprecyzyjne sformułowanie. Jeśli istnieją dwa poprawne sposoby poprawy danego fragmentu, podaj oba: "proposal" jako główną sugestię oraz "alternativeProposal" jako alternatywne sformułowanie. Nie dodawaj żadnego tekstu przed ani po JSON. Odpowiedź musi być poprawnym JSON.

Tekst do analizy:
"""
${text}
"""`;
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

  return `${buildBookContextPrompt(bookContext)}Jesteś redaktorem powieści. Poniżej znajdują się streszczenia wcześniejszych rozdziałów, które stanowią kontekst dla bieżącego rozdziału. Przeanalizuj bieżący rozdział pod kątem spójności z wcześniejszymi wydarzeniami, błędów gramatycznych, stylistycznych oraz propozycji poprawy. Zwróć wynik jako JSON array, gdzie każdy element ma pola: "text" (fragment tekstu, którego dotyczy adnotacja), "color" (jeden z: yellow, red, blue, orange, purple), "explanation" (wyjaśnienie problemu), "proposal" (propozycja poprawy). Kolory oznaczają: yellow = drobna uwaga stylistyczna, red = błąd gramatyczny, blue = sugestia stylistyczna, orange = powtórzenie lub nadmiarowość, purple = niejasność lub nieprecyzyjne sformułowanie. Nie dodawaj żadnego tekstu przed ani po JSON. Odpowiedź musi być poprawnym JSON.

KONTEKST POPRZEDNICH ROZDZIAŁÓW:
${summariesBlock}

BIĄŻĄCY ROZDZIAŁ DO ANALIZY:
"""
${text}
"""`;
}

function buildDialoguePrompt(text: string, bookContext?: BookContext): string {
  return `${buildBookContextPrompt(bookContext)}Przeanalizuj poniższy tekst pod kątem jakości dialogów. Oceń: naturalność wypowiedzi, charakterystykę postaci przez dialog (czy każda postać ma swój unikalny sposób mówienia), użycie tagów dialogowych ("powiedział", "zawołał" itp.) — czy nie są nadmiarowe lub monotonne, czy dialogi napędzają akcję i emocje. Nawet jeśli dialogi są dobrze napisane, zawsze zaproponuj przynajmniej 2-3 drobne sugestie ulepszeń stylistycznych lub alternatywne sformułowania, które mogłyby wzbogacić tekst. Zwróć wynik jako JSON array, gdzie każdy element ma pola: "text" (fragment tekstu, którego dotyczy adnotacja), "color" (jeden z: yellow, red, blue, orange, purple), "explanation" (wyjaśnienie problemu), "proposal" (propozycja poprawy). Kolory oznaczają: yellow = drobna uwaga stylistyczna, red = poważny problem z dialogiem, blue = sugestia stylistyczna, orange = powtórzenie lub nadmiarowość, purple = niejasność lub nieprecyzyjne sformułowanie. Nie dodawaj żadnego tekstu przed ani po JSON. Odpowiedź musi być poprawnym JSON.

Tekst do analizy:
"""
${text}
"""`;
}

function buildSceneExpansionPrompt(
  text: string,
  bookContext?: BookContext,
): string {
  return `${buildBookContextPrompt(bookContext)}Przeanalizuj poniższy tekst i znajdź miejsca, które można rozbudować o więcej szczegółów sensorycznych (wzrok, dźwięk, dotyk, zapach), opis otoczenia, tempo sceny lub nastrój. Dla każdego fragmentu, który warto rozbudować, zaproponuj rozszerzoną wersję jako propozycję poprawy. Zwróć wynik jako JSON array, gdzie każdy element ma pola: "text" (fragment tekstu do rozbudowy), "color" (jeden z: yellow, red, blue, orange, purple), "explanation" (wyjaśnienie, czego brakuje — np. "brak opisu dźwięków otoczenia"), "proposal" (rozszerzona wersja fragmentu). Kolory oznaczają: yellow = drobna uwaga, red = znaczący brak szczegółów, blue = sugestia rozbudowy, orange = powtórzenie, purple = niejasność. Nie dodawaj żadnego tekstu przed ani po JSON. Odpowiedź musi być poprawnym JSON.

Tekst do analizy:
"""
${text}
"""`;
}

function buildEmotionPrompt(text: string, bookContext?: BookContext): string {
  return `${buildBookContextPrompt(bookContext)}Przeanalizuj poniższy tekst pod kątem zasady "show, don't tell" w odniesieniu do emocji. Znajdź miejsca, gdzie emocja jest nazwana wprost zamiast pokazana przez działanie, mowę ciała, szczegóły lub reakcję postaci (np. "był zły", "czuła smutek", "był przestraszony"). Dla każdego takiego miejsca zaproponuj przepisaną wersję, która pokazuje emocję przez czyny, gesty, mimikę, ton głosu lub szczegóły otoczenia. WSZYSTKIE adnotacje z tej analizy MUSZĄ używać koloru "purple". Zwróć wynik jako JSON array, gdzie każdy element ma pola: "text" (fragment tekstu do poprawy), "color" (zawsze "purple"), "explanation" (wyjaśnienie, dlaczego to "tell" zamiast "show"), "proposal" (przepisana wersja pokazująca emocję). Nie dodawaj żadnego tekstu przed ani po JSON. Odpowiedź musi być poprawnym JSON.

Tekst do analizy:
"""
${text}
"""`;
}

function buildConsistencyPrompt(allChaptersText: string): string {
  return `Przeanalizuj poniższy tekst całej książki (wszystkie rozdziały) pod kątem niespójności między rozdziałami. Szukaj: sprzecznych faktów (np. postać ma inny kolor oczu w różnych rozdziałach), nielogicznych skoków czasowych, zapomnianych wątków, niespójnych cech postaci, zmiennych nazw miejsc lub postaci, błędów chronologicznych. Zwróć czytelny tekstowy raport listujący znalezione problemy z odniesieniem do konkretnych rozdziałów. Format: każdy problem w osobnym akapicie, zacznij od numeru rozdziału lub "Ogólne" jeśli dotyczy całości. Nie używaj JSON — zwróć zwykły tekst.

Tekst do analizy:
"""
${allChaptersText}
"""`;
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

function extractJsonArray(text: string): unknown {
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    return JSON.parse(match[0]);
  }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    const parsed = JSON.parse(objMatch[0]);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && "annotations" in parsed) {
      return (parsed as { annotations: unknown }).annotations;
    }
  }
  throw new Error("Nie udało się wyciągnąć JSON z odpowiedzi AI");
}

function validateAnnotations(data: unknown): Annotation[] {
  if (!Array.isArray(data)) {
    throw new Error("Oczekiwano tablicy adnotacji");
  }
  const validColors = new Set<string>([
    "yellow",
    "red",
    "blue",
    "orange",
    "purple",
  ]);
  return data.map((item, idx) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Element ${idx} nie jest obiektem`);
    }
    const text = (item as Record<string, unknown>).text;
    const color = (item as Record<string, unknown>).color;
    const explanation = (item as Record<string, unknown>).explanation;
    const proposal = (item as Record<string, unknown>).proposal;
    const alternativeProposal = (item as Record<string, unknown>)
      .alternativeProposal;
    if (
      typeof text !== "string" ||
      typeof explanation !== "string" ||
      typeof proposal !== "string"
    ) {
      throw new Error(`Element ${idx} ma nieprawidłowy typ pól`);
    }
    const colorStr = String(color);
    if (!validColors.has(colorStr)) {
      throw new Error(`Element ${idx} ma nieprawidłowy kolor: ${colorStr}`);
    }
    return {
      id: 0n,
      text,
      color: colorStr as Annotation["color"],
      explanation,
      proposal,
      alternativeProposal:
        typeof alternativeProposal === "string"
          ? alternativeProposal
          : undefined,
      approved: false,
    };
  });
}

async function callAi(
  prompt: string,
  apiKey: string,
  provider: "openai" | "claude",
  expectJson: boolean,
): Promise<string> {
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
        Authorization: `Bearer ${apiKey}`,
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
      "x-api-key": apiKey,
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
  return data.content?.find((c) => c.type === "text")?.text ?? "";
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
  const responseText = await callAi(prompt, apiKey, provider, true);
  const parsed = extractJsonArray(responseText);
  return validateAnnotations(parsed);
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
  const responseText = await callAi(prompt, apiKey, provider, true);
  const parsed = extractJsonArray(responseText);
  return validateAnnotations(parsed);
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
  const responseText = await callAi(prompt, apiKey, provider, true);
  const parsed = extractJsonArray(responseText);
  return validateAnnotations(parsed);
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
  const responseText = await callAi(prompt, apiKey, provider, true);
  const parsed = extractJsonArray(responseText);
  return validateAnnotations(parsed);
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
  const responseText = await callAi(prompt, apiKey, provider, true);
  const parsed = extractJsonArray(responseText);
  const annotations = validateAnnotations(parsed);
  // Force purple color for all emotion annotations
  return annotations.map((a) => ({ ...a, color: "purple" as const }));
}

export async function analyzeConsistency(
  allChaptersText: string,
  apiKey: string,
  provider: "openai" | "claude",
): Promise<string> {
  if (allChaptersText.length > 12000) {
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
  if (allChaptersText.length > 12000) {
    throw new Error("Tekst za długi");
  }
  const prompt = buildSummaryPrompt(allChaptersText, summaryType);
  return await callAi(prompt, apiKey, provider, false);
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildChatPrompt(messages: ChatMessage[], bookContext: string): string {
  const history = messages
    .map(
      (m) => `${m.role === "user" ? "Użytkownik" : "Asystent"}: ${m.content}`,
    )
    .join("\n\n");

  return `Jesteś asystentem pisarskim dla pisarza. Pomagasz w tworzeniu powieści, odpowiadasz na pytania, proponujesz pomysły na fabułę, postacie, dialogi i rozwój wątków.

KONTEKST KSIĄŻKI:
${bookContext}

HISTORIA ROZMOWY:
${history}

Odpowiedz na ostatnie pytanie użytkownika. Bądź konstruktywny, konkretny i inspirujący.`;
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
  const parsed = extractJsonArray(responseText);
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
}

export async function chatWithBook(
  messages: ChatMessage[],
  bookContext: string,
  apiKey: string,
  provider: "openai" | "claude",
): Promise<string> {
  const prompt = buildChatPrompt(messages, bookContext);
  return await callAi(prompt, apiKey, provider, false);
}
