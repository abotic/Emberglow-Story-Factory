export function coerceLastJsonBlock(text: string): any {
  const match = text.match(/\{[\s\S]*\}\s*$/);
  if (!match) throw new Error("No JSON object found in model output");
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    throw new Error("JSON parse error: " + (e as Error).message);
  }
}
