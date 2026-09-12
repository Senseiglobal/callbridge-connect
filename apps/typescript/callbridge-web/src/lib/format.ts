/** Mask an E.164 phone number for display: +1555…234 style. */
export function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.includes("•")) return trimmed;
  if (trimmed.length < 6) return "••••";
  const plus = trimmed.startsWith("+") ? "+" : "";
  const digits = trimmed.replace(/\D/g, "");
  const head = digits.slice(0, 2);
  const tail = digits.slice(-3);
  return `${plus}${head} •••• ${tail}`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function hostFromUrl(url: string): string {
  try {
    return new URL(url).host + new URL(url).pathname;
  } catch {
    return url;
  }
}
