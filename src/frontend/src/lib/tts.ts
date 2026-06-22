import type { backendInterface } from "@/backend";

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
  actor: backendInterface,
): Promise<Blob> {
  const bytes = await actor.synthesizeSpeech(text, voice, apiKey);
  return new Blob([new Uint8Array(bytes)], { type: "audio/mpeg" });
}

export async function generateSpeech(
  text: string,
  voice: string,
  apiKey: string,
  actor: backendInterface,
): Promise<Blob> {
  if (!text.trim()) {
    throw new Error("Brak tekstu do odczytania");
  }

  const chunks = splitTextIntoChunks(text);

  if (chunks.length === 1) {
    return generateSpeechChunk(chunks[0], voice, apiKey, actor);
  }

  const blobs: Blob[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const blob = await generateSpeechChunk(chunks[i], voice, apiKey, actor);
    blobs.push(blob);
  }

  // Concatenate all blobs into one
  return new Blob(blobs, { type: "audio/mpeg" });
}
