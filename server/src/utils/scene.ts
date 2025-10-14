export function buildSceneTimestamps(totalMinutes: number): string[] {
  const totalSeconds = totalMinutes * 60;
  const stamps: string[] = [];
  let currentTime = 0;
  let lastStep = 0;

  while (currentTime <= totalSeconds) {
    const m = Math.floor(currentTime / 60);
    const s = currentTime % 60;
    stamps.push(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);

    if (currentTime < 60) lastStep = 6;
    else if (currentTime < 120) lastStep = 10;
    else if (currentTime < 180) lastStep = 15;
    else if (currentTime < 240) lastStep = 20;
    else if (currentTime < 600) lastStep = 30;
    else if (currentTime < 1200) lastStep = 60;
    else lastStep = 120;

    currentTime += lastStep;
  }

  for (let i = 0; i < 30; i++) {
    const m = Math.floor(currentTime / 60);
    const s = currentTime % 60;
    stamps.push(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    currentTime += lastStep;
  }

  return stamps;
}

export function stampToSeconds(stamp: string): number {
  const parts = stamp.split(":").map((p) => parseInt(p, 10));
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}