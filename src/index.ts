"use strict";

import express from "express";
import ical, { ICalEventData } from "ical-generator";
import { DateTime, Interval } from "luxon";

import { TeamDetailResponseSchema } from "./schemas/TeamDetailResponse";
import dedent from "dedent";
import jsonUrl from "json-url";

import showdown from "showdown";

import {
  MetadataInput,
  metadataInputSchema,
} from "./schemas/MetadataInputSchema";
import memoizee from "memoizee";

const apiHost = "https://api.fixionline.com";
const routerPath = "MobService.svc";
const teamDetailEndpoint = "GetMobTeamDetails";

const memoizeeExpiryConf = { maxAge: 1000 * 60 * 60 * 24, preFetch: 0.8 };

const mdConverter = new showdown.Converter();

const eventDescriptionSpiel = dedent`
    Generated by [strazto/sportfix-ical](https://github.com/strazto/sportfix-ical).
    
    For support [post a ticket](https://github.com/strazto/sportfix-ical/issues) or
    dm [@strazto on instagram](https://instagram.com/strazto/).
`;

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

const dttmFormatString = "yyyy MMM dd t";
const formatDttmString = ({
  date,
  time,
  year,
}: {
  date: string;
  time: string;
  year: string | number;
}) => {
  const strippedDate = date.replace(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*/, "");

  const timeString = time === "NA" ? "01:00 AM" : time;

  return `${year} ${strippedDate} ${timeString}`;
};

const getDateInSeasonTimes = ({
  seasonTimes,
  MatchDate,
  MatchTime,
  YearFormed,
}: {
  seasonTimes: MetadataInput["seasonTimes"];
  MatchDate: string;
  MatchTime: string;
  YearFormed: string;
}) => {
  const maxDate = seasonTimes.reduce((a, b) => (a.end > b.end ? a : b)).end;
  const minDate = seasonTimes.reduce((a, b) =>
    a.start < b.start ? a : b
  ).start;

  const interval = Interval.fromDateTimes(
    DateTime.fromJSDate(minDate),
    DateTime.fromJSDate(maxDate)
  );

  const maxYear = maxDate.getFullYear();
  const minYear = minDate.getFullYear();

  const years = new Set<number>();

  for (let y = minYear; y <= maxYear; y++) {
    years.add(y);
  }

  const formattedDttm = [...years]
    .map((y) => formatDttmString({ year: y, date: MatchDate, time: MatchTime }))
    .find((formattedDttm) => {
      const date = DateTime.fromFormat(formattedDttm, dttmFormatString);

      if (interval.contains(date)) {
        return true;
      }

      return false;
    });

  if (formattedDttm) return formattedDttm;

  const fallbackValue = formatDttmString({
    year: YearFormed,
    date: MatchDate,
    time: MatchTime,
  });

  console.warn({
    msg: "Unable to determine year",
    fallbackValue,
    years,
    maxYear,
    minYear,
  });

  return fallbackValue;
};

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
    description: eventDescriptionSpiel,
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
      // MatchDate: Mon, Jun 05
      // MatchTime: 09:05 PM
      // YearFormed: "2023"
      const formattedDttm = formatDttmString({
        year: YearFormed,
        date: MatchDate,
        time: MatchTime,
      });

      const start = DateTime.fromFormat(formattedDttm, dttmFormatString);

      if (MatchTime === "NA") {
        return { allDay: true, start };
      }

      const end = start.plus({ hours: 1 });

      if (!start || !end) {
        console.warn({ start, end });
      }

      if (start.invalidExplanation) {
        console.warn({
          msg: start.invalidExplanation,
          formattedDttm,
          MatchDate,
          MatchTime,
        });
      }

      return {
        start,
        end,
      };
    };

    const timeDetails = getTimeDetails({ ...details, ...match });

    const otherTeamName =
      match.AwayTeam.Id === details.Id ? match.HomeTeam.Name : details.Name;

    const description = dedent`
      ${match.CourtName}

      ${eventDescriptionSpiel}
    `;

    const out: ICalEventData = {
      ...timeDetails,
      summary: `${details.Name} vs ${otherTeamName} `,
      description: {
        plain: description,
        html: mdConverter.makeHtml(description),
      },
      location: metadata?.location,
    };
    return out;
  };

  const upcomingEvents = details.UpcomingMatchCollection.map(constructEvent);
  const pastEvents = details.CompletedMatchCollection.map(constructEvent);

  const knownDates = new Set<string | null>();

  const addEvent = (e: ICalEventData) => {
    const { start } = e;

    if (!start) {
      console.error({ msg: "Event missing start", event: e });
      return;
    }

    try {
      cal.createEvent(e);
    } catch (err) {
      console.error({ err, start, end: e.end, event: e });
      return;
    }

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

        const description = dedent`
          Fixture not yet posted.

          ${eventDescriptionSpiel}
        `;

        const event: ICalEventData = {
          start,
          end,
          summary: `${details.Name} | ${sportName} - Placeholder`,
          description: {
            plain: description,
            html: mdConverter.makeHtml(description),
          },
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
