export interface Annotation {
  text: string;
  color: "yellow" | "red" | "blue" | "orange" | "purple";
  explanation: string;
  proposal: string;
}

function buildPrompt(text: string): string {
  return `Przeanalizuj poniższy tekst pod kątem błędów gramatycznych, stylistycznych oraz propozycji poprawy. Zwróć wynik jako JSON array, gdzie każdy element ma pola: "text" (fragment tekstu, którego dotyczy adnotacja), "color" (jeden z: yellow, red, blue, orange, purple), "explanation" (wyjaśnienie problemu), "proposal" (propozycja poprawy). Kolory oznaczają: yellow = drobna uwaga stylistyczna, red = błąd gramatyczny, blue = sugestia stylistyczna, orange = powtórzenie lub nadmiarowość, purple = niejasność lub nieprecyzyjne sformułowanie. Nie dodawaj żadnego tekstu przed ani po JSON.

Tekst do analizy:
"""
${text}
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
      text,
      color: colorStr as Annotation["color"],
      explanation,
      proposal,
    };
  });
}

export async function analyzeGrammarStyle(
  text: string,
  apiKey: string,
  provider: "openai" | "claude",
): Promise<Annotation[]> {
  if (text.length > 8000) {
    throw new Error("Tekst za długi");
  }

  const prompt = buildPrompt(text);

  let responseText: string;

  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 8000,
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${err}`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    responseText = data.choices?.[0]?.message?.content ?? "";
  } else {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
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
    responseText = data.content?.find((c) => c.type === "text")?.text ?? "";
  }

  const parsed = extractJsonArray(responseText);
  return validateAnnotations(parsed);
}
