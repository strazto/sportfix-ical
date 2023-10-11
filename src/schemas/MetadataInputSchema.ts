import * as z from "zod";
import { iCalLocationSchema, iCalWeekdaySchema } from "./IcalGeneratorSchemas";

const dttmSchema = z.coerce.date(); //.string().datetime();
const matchTimeSchema = z.object({
  hour: z.number(),
  minute: z.number(),
});

export const metadataInputSchema = z.object({
  location: iCalLocationSchema.optional(),
  competitionStart: dttmSchema.optional(),
  nRounds: z.number().optional(),
  breaks: z
    .array(
      z.object({
        start: dttmSchema,
        end: dttmSchema,
      })
    )
    .optional(),
  timezone: z.string().optional(),
  fixtureTimes: z
    .object({
      weekday: iCalWeekdaySchema,
      startTime: matchTimeSchema,
      endTime: matchTimeSchema,
    })
    .optional(),
});

export type MetadataInput = z.infer<typeof metadataInputSchema>;
