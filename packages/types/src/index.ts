export const appNames = ["site", "booking", "admin"] as const;

export type AppName = (typeof appNames)[number];

