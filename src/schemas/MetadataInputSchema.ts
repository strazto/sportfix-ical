import * as z from "zod";
import { iCalLocationSchema, iCalWeekdaySchema } from "./IcalGeneratorSchemas";
import { DateTime } from "luxon";

const dttmSchema = z.coerce.date(); //.string().datetime();
const matchTimeSchema = z.object({
  hour: z.number(),
  minute: z.number(),
});

export type MatchTime = z.infer<typeof matchTimeSchema>;

const checkSaneIntervals = (
  startTime: MatchTime,
  endTime: MatchTime
): boolean => {
  try {
    const start = DateTime.fromObject(startTime);
    const end = DateTime.fromObject(endTime);

    if (start > end) {
      console.warn({ msg: "Start > end", start, end });
      return false;
    }
  } catch (e) {
    console.warn({ error: e, startTime, endTime });
    return false;
  }
  return true;
};

export const metadataInputSchema = z.object({
  location: iCalLocationSchema.optional(),
  seasonTimes: z.array(
    z
      .object({
        start: dttmSchema,
        end: dttmSchema,
      })
      .refine(({ start, end }) => start <= end)
  ),
  timezone: z.string().optional(),
  fixtureTimes: z
    .object({
      weekday: iCalWeekdaySchema,
      startTime: matchTimeSchema,
      endTime: matchTimeSchema,
    })
    .refine(({ startTime, endTime }) => checkSaneIntervals(startTime, endTime))
    .optional(),
});

export type MetadataInput = z.infer<typeof metadataInputSchema>;
