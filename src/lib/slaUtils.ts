/** 접수일시 문자열을 최대한 관대하게 Date로 파싱한다. 실패하면 null. */
export function parseReceivedAt(text: string | undefined): Date | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  // "2026-09-01 08:00" 처럼 공백으로 구분된 경우 ISO 형태(T)로도 시도
  const candidates = [trimmed, trimmed.replace(" ", "T")];
  for (const candidate of candidates) {
    const date = new Date(candidate);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

export function elapsedHoursSince(date: Date, now: Date = new Date()): number {
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60);
}

export function formatElapsed(hours: number): string {
  if (hours < 0) return "접수 예정";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}분 경과`;
  if (hours < 48) return `${Math.round(hours)}시간 경과`;
  return `${Math.round(hours / 24)}일 경과`;
}
