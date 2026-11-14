import { Country, VendCommodity } from './types';

export interface ProviderProfile {
  id: string; name: string; country: Country | 'ZA+MW'; role: 'aggregator' | 'operator' | 'utility' | 'network';
  commodities: VendCommodity[];
  integration: 'adapter_built' | 'public_docs' | 'partner_gated' | 'in_negotiation';
  notes: string;
}

/** Providers named in public sources (see master build document, section 17). Commercial terms and API access must be confirmed with each. */
export const PROVIDERS: ProviderProfile[] = [
  { id: 'blue-label', name: 'Blue Label Telecoms (Cigicell platform, Ringas)', country: 'ZA', role: 'aggregator', commodities: ['airtime', 'data', 'electricity'], integration: 'partner_gated', notes: 'Reported to handle over 60% of prepaid top-ups; also runs BlueAdvance, a competing advance product' },
  { id: 'easypay', name: 'EasyPay (Lesaka group)', country: 'ZA', role: 'aggregator', commodities: ['airtime', 'data', 'electricity'], integration: 'partner_gated', notes: 'Switching and bill payments; named as an electricity aggregator' },
  { id: 'kazang', name: 'Kazang (Connect Group)', country: 'ZA', role: 'aggregator', commodities: ['airtime', 'data', 'electricity'], integration: 'partner_gated', notes: 'About 68,000 active devices; also sells international electricity vouchers including Malawi ESCOM; corporate integration offered' },
  { id: 'flash', name: 'Flash', country: 'ZA', role: 'aggregator', commodities: ['airtime', 'data', 'electricity'], integration: 'partner_gated', notes: 'Named as a national prepaid competitor' },
  { id: 'prepaid24', name: 'Prepaid24', country: 'ZA', role: 'aggregator', commodities: ['airtime', 'data', 'electricity'], integration: 'public_docs', notes: 'Electricity for over 94% of municipalities; offers API integration for platforms' },
  { id: 'syntell', name: 'Syntell', country: 'ZA', role: 'aggregator', commodities: ['electricity'], integration: 'partner_gated', notes: 'Named as an electricity vending aggregator' },
  { id: 'contour', name: 'Contour', country: 'ZA', role: 'aggregator', commodities: ['electricity'], integration: 'partner_gated', notes: 'Named as an electricity vending aggregator' },
  { id: 'ontec', name: 'Ontec', country: 'ZA', role: 'aggregator', commodities: ['electricity'], integration: 'partner_gated', notes: 'Named as an electricity vending aggregator' },
  { id: 'ipay', name: 'iPay', country: 'ZA', role: 'aggregator', commodities: ['electricity'], integration: 'partner_gated', notes: 'Named as an electricity vending aggregator' },
  { id: 'pay-at', name: 'Pay@', country: 'ZA', role: 'aggregator', commodities: ['electricity'], integration: 'partner_gated', notes: 'Municipal bill payments' },
  { id: 'cellair', name: 'CellAir', country: 'ZA', role: 'aggregator', commodities: ['airtime', 'data'], integration: 'partner_gated', notes: 'Named as a prepaid player' },
  { id: 'ra-cellular', name: 'RA Cellular', country: 'ZA', role: 'aggregator', commodities: ['airtime', 'data'], integration: 'partner_gated', notes: 'Named as a prepaid player' },
  { id: 'vodacom', name: 'Vodacom (direct)', country: 'ZA', role: 'operator', commodities: ['airtime', 'data'], integration: 'partner_gated', notes: 'Runs Airtime Advance already; direct supply for the later operator-embedded model' },
  { id: 'mtn-za', name: 'MTN South Africa (direct)', country: 'ZA', role: 'operator', commodities: ['airtime', 'data'], integration: 'partner_gated', notes: 'XtraTime; reported to be reducing advances' },
  { id: 'cell-c', name: 'Cell C (direct)', country: 'ZA', role: 'operator', commodities: ['airtime', 'data'], integration: 'partner_gated', notes: 'Fixed fee per advance, no interest' },
  { id: 'telkom', name: 'Telkom Mobile (direct)', country: 'ZA', role: 'operator', commodities: ['airtime', 'data'], integration: 'partner_gated', notes: 'Reported to lean on airtime advances' },
  { id: 'eskom-vendors', name: 'Eskom national vendors and municipal vending systems', country: 'ZA', role: 'utility', commodities: ['electricity'], integration: 'partner_gated', notes: 'Tokens are requested in real time from the utility vending server through contracted vendors' },
  { id: 'tnm', name: 'TNM (Telekom Networks Malawi) and TNM Mpamba', country: 'MW', role: 'operator', commodities: ['airtime', 'data'], integration: 'in_negotiation', notes: 'In discussions; runs Pasavute with Net1 and Supa Pesa today' },
  { id: 'airtel-mw', name: 'Airtel Malawi and Airtel Money', country: 'MW', role: 'operator', commodities: ['airtime', 'data'], integration: 'partner_gated', notes: 'Runs Kutapa and Kutchova' },
  { id: 'escom', name: 'ESCOM (Electricity Supply Corporation of Malawi)', country: 'MW', role: 'utility', commodities: ['electricity'], integration: 'in_negotiation', notes: 'Negotiations under way; prepaid tokens' },
  { id: 'paychangu', name: 'PayChangu bill payments', country: 'MW', role: 'aggregator', commodities: ['airtime', 'data', 'electricity'], integration: 'adapter_built', notes: 'Documented API for Airtel and TNM airtime and ESCOM tokens, paid from a pre-funded wallet' },
];
