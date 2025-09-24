export function buildSceneTimestamps(totalMinutes: number, stepSeconds = 30): string[] {
  const totalSeconds = totalMinutes * 60;
  const stamps: string[] = [];
  for (let t = stepSeconds; t <= totalSeconds; t += stepSeconds) {
    const m = Math.floor(t / 60);
    const s = t % 60;
    stamps.push(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
  }
  return stamps;
}
