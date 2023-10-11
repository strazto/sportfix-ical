// Subset of
// https://github.com/sebbo2002/ical-generator/blob/f29ff3f917c5e2d7c98160dde06cfa71d790a49d/src/types.ts#L1
export type ICalDateTimeValue = string;

export interface ICalRepeatingOptions {
  freq: ICalEventRepeatingFreq;
  count?: number;
  interval?: number;
  until?: ICalDateTimeValue;
  byDay?: ICalWeekday[] | ICalWeekday;
  byMonth?: number[] | number;
  byMonthDay?: number[] | number;
  bySetPos?: number[] | number;
  exclude?: ICalDateTimeValue[] | ICalDateTimeValue;
  startOfWeek?: ICalWeekday;
}

export interface ICalLocation {
  title: string;
  address?: string;
  radius?: number;
  geo?: ICalGeo;
}

export interface ICalGeo {
  lat: number;
  lon: number;
}

export enum ICalEventRepeatingFreq {
  SECONDLY = "SECONDLY",
  MINUTELY = "MINUTELY",
  HOURLY = "HOURLY",
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

export enum ICalWeekday {
  SU = "SU",
  MO = "MO",
  TU = "TU",
  WE = "WE",
  TH = "TH",
  FR = "FR",
  SA = "SA",
}
