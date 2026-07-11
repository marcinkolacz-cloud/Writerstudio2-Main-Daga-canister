function getMaxChunkLength(provider: "openai" | "polly"): number {
  return provider === "polly" ? 2800 : 4000;
}

function splitTextIntoChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    // Try to find a sentence boundary within the last 500 chars of the chunk
    const searchEnd = maxLength;
    const searchStart = Math.max(0, searchEnd - 500);
    let splitIndex = -1;

    for (let i = searchEnd; i >= searchStart; i--) {
      const char = remaining[i];
      if (char === "." || char === "!" || char === "?") {
        // Check if next char is whitespace or end of string
        const nextChar = remaining[i + 1];
        if (nextChar === " " || nextChar === "\n" || nextChar === undefined) {
          splitIndex = i + 1;
          break;
        }
      }
    }

    if (splitIndex === -1) {
      // Fallback: split at newline or space
      for (let i = searchEnd; i >= searchStart; i--) {
        if (remaining[i] === "\n") {
          splitIndex = i + 1;
          break;
        }
      }
      if (splitIndex === -1) {
        for (let i = searchEnd; i >= searchStart; i--) {
          if (remaining[i] === " ") {
            splitIndex = i + 1;
            break;
          }
        }
      }
    }

    if (splitIndex === -1 || splitIndex <= 0) {
      splitIndex = maxLength;
    }

    chunks.push(remaining.slice(0, splitIndex).trim());
    remaining = remaining.slice(splitIndex).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}

async function generateSpeechChunk(
  text: string,
  voice: string,
  apiKey: string,
  provider: "openai" | "polly",
): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (provider === "openai") {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  const response = await fetch(
    "https://writerstudio-tts.marcinkolacz.workers.dev",
    {
      method: "POST",
      headers,
      body: JSON.stringify({ provider, model: "tts-1", input: text, voice }),
    },
  );
  if (!response.ok) {
    throw new Error(`Błąd TTS: ${response.status}`);
  }
  return response.blob();
}

export async function generateSpeech(
  text: string,
  voice: string,
  apiKey: string,
  onProgress?: (current: number, total: number) => void,
  provider: "openai" | "polly" = "openai",
): Promise<Blob> {
  if (!text.trim()) {
    throw new Error("Brak tekstu do odczytania");
  }

  const maxLength = getMaxChunkLength(provider);
  const chunks = splitTextIntoChunks(text, maxLength);

  if (chunks.length === 1) {
    onProgress?.(1, 1);
    return generateSpeechChunk(chunks[0], voice, apiKey, provider);
  }

  const blobs: Blob[] = new Array(chunks.length);
  const CONCURRENCY = 3;

  for (
    let batchStart = 0;
    batchStart < chunks.length;
    batchStart += CONCURRENCY
  ) {
    const batchEnd = Math.min(batchStart + CONCURRENCY, chunks.length);
    const batchIndices = Array.from(
      { length: batchEnd - batchStart },
      (_, i) => batchStart + i,
    );

    await Promise.all(
      batchIndices.map(async (index) => {
        const blob = await generateSpeechChunk(
          chunks[index],
          voice,
          apiKey,
          provider,
        );
        blobs[index] = blob;
        onProgress?.(index + 1, chunks.length);
      }),
    );
  }

  // Concatenate all blobs into one
  return new Blob(blobs, { type: "audio/mpeg" });
}
