"use strict";

import express from "express";
import ical, { ICalEventData, ICalEvent } from "ical-generator";
import { DateTime } from "luxon";

import { TeamDetailResponseSchema } from "./schemas/TeamDetailResponse";

const apiHost = "https://api.fixionline.com";
const routerPath = "MobService.svc";
const teamDetailEndpoint = "GetMobTeamDetails";

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

  console.log(res);

  return res;
};

const app = express();

app.get("/calendar/:centreID/:teamId", async (req, res) => {
  const { centreID, teamId } = req.params;
  //teamDetails({ centreID: "1720", teamId: "263619" });
  const detailsResult = await teamDetails({ centreID, teamId });

  if (!detailsResult) {
    res.status(500).send("Error");
    return;
  }

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

  const source = new URL(
    req.url,
    `${req.protocol}://${req.headers.host}`
  ).toString();

  const cal = ical({
    name,
    source,
  });

  const upcomingEvents = details.UpcomingMatchCollection.map(
    (match): ICalEventData => {
      //const start = DateTime.fromFormat(match.MatchDate);
      const out: ICalEventData = {
        start: match.MatchTime,
      };
      return out;
    }
  );
});
