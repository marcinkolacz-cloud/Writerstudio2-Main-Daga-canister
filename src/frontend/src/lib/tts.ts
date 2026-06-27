const MAX_CHUNK_LENGTH = 4000;

function splitTextIntoChunks(text: string): string[] {
  if (text.length <= MAX_CHUNK_LENGTH) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > MAX_CHUNK_LENGTH) {
    // Try to find a sentence boundary within the last 500 chars of the chunk
    const searchEnd = MAX_CHUNK_LENGTH;
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
      splitIndex = MAX_CHUNK_LENGTH;
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
): Promise<Blob> {
  const response = await fetch(
    "https://writerstudio-tts.marcinkolacz.workers.dev",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "tts-1", input: text, voice }),
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
): Promise<Blob> {
  if (!text.trim()) {
    throw new Error("Brak tekstu do odczytania");
  }

  const chunks = splitTextIntoChunks(text);

  if (chunks.length === 1) {
    onProgress?.(1, 1);
    return generateSpeechChunk(chunks[0], voice, apiKey);
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
        const blob = await generateSpeechChunk(chunks[index], voice, apiKey);
        blobs[index] = blob;
        onProgress?.(index + 1, chunks.length);
      }),
    );
  }

  // Concatenate all blobs into one
  return new Blob(blobs, { type: "audio/mpeg" });
}
