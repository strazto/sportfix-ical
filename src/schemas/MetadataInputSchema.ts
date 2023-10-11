import * as z from "zod";
import { iCalLocationSchema, iCalWeekdaySchema } from "./IcalGeneratorSchemas";

const dttmSchema = z.string().datetime();
const matchTimeSchema = z.object({
  hour: z.number(),
  minute: z.number(),
});

export const metadataInputSchema = z.object({
  location: iCalLocationSchema.optional(),
  competitionStart: dttmSchema,
  nRounds: z.number(),
  breaks: z
    .array(
      z.object({
        start: dttmSchema,
        end: dttmSchema,
      })
    )
    .optional(),
  timezone: z.string().optional().default("Australia/Sydney"),
  fixtureTimes: z.object({
    weekday: iCalWeekdaySchema,
    startTime: matchTimeSchema,
    endTime: matchTimeSchema,
  }),
});

export type MetadataInput = z.infer<typeof metadataInputSchema>;
