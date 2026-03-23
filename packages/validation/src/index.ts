import { appNames } from "@boat/types";
import { z } from "zod";

export const appNameSchema = z.enum(appNames);

export type AppNameSchema = z.infer<typeof appNameSchema>;

