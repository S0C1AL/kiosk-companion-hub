export interface PlayerDocument {
  idDocNo?: string;
  idDocType?: string;
  idDocNationality?: string;
  IssuerCountry?: string;
}

export interface PlayerInfo {
  playerId: number;
  firstNames: string;
  lastName: string;
  lastName2?: string;
  nickName?: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  cardLevel: number;
  cardLevelName: string;
  email?: string;
  cellPhoneNo?: string;
  phoneNo?: string;
  country?: string;
  city?: string;
  street?: string;
  postCode?: string;
  lastVisit?: string;
  visitsLastWeek?: number;
  visitsLastMonth?: number;
  visitsLastYear?: number;
  primaryLevelColour?: string;
  document?: PlayerDocument[];
}

export interface PlayerBalance {
  playerId: number;
  cardNumber: number;
  currency: number;
  numberOfCards: number;
  cardCash: number;
  cardNonCash: number;
  cardPoints: number;
}

export interface KioskClientConfig {
  casinoId: string;
}

export function currencyCodeToLabel(code: number): string {
  if (code === 49) return "CZK";
  return "EUR";
}

export function formatPlayerName(p: PlayerInfo): string {
  return [p.firstNames, p.lastName, p.lastName2].filter(Boolean).join(" ").trim();
}