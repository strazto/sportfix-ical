"use strict";

import express from "express";
import ical, { ICalEventData } from "ical-generator";
import { DateTime, Interval } from "luxon";

import { TeamDetailResponseSchema } from "./schemas/TeamDetailResponse";
import dedent from "dedent";
import jsonUrl from "json-url";

import {
  MetadataInput,
  metadataInputSchema,
} from "./schemas/MetadataInputSchema";
import memoizee from "memoizee";

const apiHost = "https://api.fixionline.com";
const routerPath = "MobService.svc";
const teamDetailEndpoint = "GetMobTeamDetails";
const dttmFormatString = "yyyy EEE, MMM dd t";

const memoizeeExpiryConf = { maxAge: 1000 * 60 * 60 * 24, preFetch: 0.8 };

const teamDetails = async (params: { centreID: string; teamId: string }) => {
  const endpoint = `${apiHost}/${routerPath}/${teamDetailEndpoint}`;

  const url = new URL(endpoint);
  for (const k in params) {
    url.searchParams.append(k, params[k as keyof typeof params]);
  }

  const res = await fetch(url)
    .then((res) => res.json())
    .then((res) => TeamDetailResponseSchema.safeParse(res));

  if (!res.success) {
    console.log(res.error);

    return undefined;
  }

  return res;
};

const teamDetailsMemo = memoizee(teamDetails, {
  async: true,
  ...memoizeeExpiryConf,
});

const app = express();

const parseMetadata = async (
  mdRaw?: string
): Promise<MetadataInput | undefined> => {
  if (!mdRaw) return;
  const parsed = await jsonUrl("lzma")
    .decompress(mdRaw)
    .then((rawJson: unknown) => metadataInputSchema.safeParse(rawJson));

  if (!parsed.success) return;

  return parsed.data;
};

const parseMetadataMemo = memoizee(parseMetadata, {
  async: true,
});

app.get("/calendar/:centreID/:teamId/:metadata?", async (req, res) => {
  const { centreID, teamId, metadata: metadataRaw } = req.params;
  //teamDetails({ centreID: "1720", teamId: "263619" });
  const detailsResult = await teamDetailsMemo({ centreID, teamId });

  if (!detailsResult) {
    res.status(500).send("Error");
    return;
  }

  const metadata = await parseMetadataMemo(metadataRaw);

  const details = detailsResult.data.MobTeamDetails;

  type Competition = (typeof details.AssociatedCompetitionCollection)[number];
  const defaultCompetition: Competition = {
    DivisionId: 0,
    DivisionName: "Unknown",
    LinkTo: false,
    SeasonId: 0,
    SeasonName: "Unknown",
    SportId: 0,
    SportName: "Unknown",
  };

  const comp = details.AssociatedCompetitionCollection[0] ?? defaultCompetition;

  const name = `${details.Name} | ${comp.SeasonName} - ${comp.DivisionName}`;

  const sportName = details.SportCollectionMetaData[0]?.Value ?? "";

  const source = new URL(
    req.url,
    `${req.protocol}://${req.headers.host}`
  ).toString();

  const cal = ical({
    name,
    source,
    timezone: metadata?.timezone ?? "Australia/Sydney",
  });

  type MatchDetails = (typeof details.UpcomingMatchCollection)[number];

  // TODO - Determine the year using the season boundary as intervals
  const constructEvent = (match: MatchDetails): ICalEventData => {
    const getTimeDetails = ({
      MatchDate,
      MatchTime,
      YearFormed,
    }: {
      MatchDate: string;
      MatchTime: string;
      YearFormed: string;
    }) => {
      if (MatchTime === "NA") {
        const formattedDttm = `${YearFormed} ${MatchDate} 01:00 AM`;
        const start = DateTime.fromFormat(formattedDttm, dttmFormatString);

        return { allDay: true, start };
      }

      // MatchDate: Mon, Jun 05
      // MatchTime: 09:05 PM
      // YearFormed: "2023"
      const formattedDttm = `${YearFormed} ${MatchDate} ${MatchTime}`;
      const start = DateTime.fromFormat(formattedDttm, dttmFormatString);
      const end = start.plus({ hours: 1 });

      if (!start || !end) {
        console.warn({ start, end });
      }

      return {
        start,
        end,
      };
    };

    const timeDetails = getTimeDetails({ ...details, ...match });

    const otherTeamName =
      match.AwayTeam.Id === details.Id ? match.HomeTeam.Name : details.Name;

    const out: ICalEventData = {
      ...timeDetails,
      summary: `${details.Name} vs ${otherTeamName} `,
      description: dedent`
        ${match.CourtName}
      `,
      location: metadata?.location,
    };
    return out;
  };

  const upcomingEvents = details.UpcomingMatchCollection.map(constructEvent);
  const pastEvents = details.CompletedMatchCollection.map(constructEvent);

  const knownDates = new Set<string | null>();

  const addEvent = (e: ICalEventData) => {
    cal.createEvent(e);
    const { start } = e;

    if (!start) return;

    if (typeof start === "string") {
      const dttm = DateTime.fromISO(start);
      knownDates.add(dttm.toISODate());
      return;
    }

    if (start instanceof DateTime) {
      knownDates.add(start.toISODate());
      return;
    }

    if (start instanceof Date) {
      const dttm = DateTime.fromJSDate(start);
      knownDates.add(dttm.toISODate());
      return;
    }
  };

  upcomingEvents.forEach(addEvent);
  pastEvents.forEach(addEvent);

  const unknownFixtures =
    metadata?.seasonTimes.flatMap((seasonTime) => {
      const start = DateTime.fromJSDate(seasonTime.start);
      const end = DateTime.fromJSDate(seasonTime.end);

      const interval = Interval.fromDateTimes(start, end);

      const out: ICalEventData[] = [];

      for (let i = start; interval.contains(i); i = i.plus({ weeks: 1 })) {
        // Skip if its already got a fixture
        if (knownDates.has(i.toISODate())) continue;
        // Skip if it was in the past
        if (i < DateTime.now()) continue;

        const start = i
          .startOf("day")
          .plus(metadata.fixtureTimes?.startTime ?? 0);
        const end = i.startOf("day").plus(metadata.fixtureTimes?.endTime ?? 0);

        const event: ICalEventData = {
          start,
          end,
          summary: `${details.Name} | ${sportName} - Placeholder`,
          description: "Fixture not yet posted",
          location: metadata.location,
        };

        out.push(event);
      }
      return out;
    }) ?? [];

  unknownFixtures.forEach((e) => cal.createEvent(e));

  // if (metadata.competitionStart) {
  //   cal.createEvent({
  //     start: metadata.competitionStart,
  //     allDay: true,
  //     summary: "Season begins",
  //   });
  // }

  cal.serve(res);
});

app.listen(3000);