export const appNames = ["site", "booking", "admin"] as const;

export type AppName = (typeof appNames)[number];

export type Nullable<T> = T | null;

export type SearchParamValue = string | string[] | undefined;

export type SearchParamsRecord = Readonly<Record<string, SearchParamValue>>;

export type SearchParamsInput = SearchParamsRecord | URLSearchParams;
