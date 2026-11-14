export type Purpose = 'credit_underwriting' | 'wifi_billing' | 'marketing';
interface ConsentEvent { subject: string; purpose: Purpose; kind: 'grant' | 'revoke'; at: Date; expiresAt?: Date }

/** Append-only consent log. Latest event per (subject, purpose) wins. */
export class ConsentService {
  private log: ConsentEvent[] = [];
  grant(subject: string, purpose: Purpose, at = new Date(), expiresAt?: Date) {
    this.log.push({ subject, purpose, kind: 'grant', at, expiresAt });
  }
  revoke(subject: string, purpose: Purpose, at = new Date()) {
    this.log.push({ subject, purpose, kind: 'revoke', at });
  }
  isAllowed(subject: string, purpose: Purpose, now = new Date()): boolean {
    for (let i = this.log.length - 1; i >= 0; i--) {
      const e = this.log[i]!;
      if (e.subject !== subject || e.purpose !== purpose || e.at > now) continue;
      if (e.kind === 'revoke') return false;
      return !e.expiresAt || e.expiresAt > now;
    }
    return false;
  }
}
