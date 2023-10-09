import * as z from "zod";

export const CompetitionNameSchema = z.enum([
  "Volleyball Monday Evening Mixed Div 1B 2023 Winter",
  "Volleyball Monday Evening Mixed Div 1B 23/24 Summer",
]);
export type CompetitionName = z.infer<typeof CompetitionNameSchema>;

export const TeamSchema = z.object({
  Id: z.number(),
  Name: z.string(),
});
export type Team = z.infer<typeof TeamSchema>;

export const MatchCollectionSchema = z.object({
  AwayTeam: TeamSchema,
  AwayTeamScore: z.union([z.null(), z.string()]),
  CompetitionName: CompetitionNameSchema,
  CourtName: z.string(),
  DivisionId: z.number(),
  HomeTeam: TeamSchema,
  HomeTeamScore: z.union([z.null(), z.string()]),
  MatchDate: z.string(),
  MatchId: z.number(),
  MatchTime: z.string(),
  ResultSubmitted: z.boolean(),
  Round: z.string(),
  SeasonId: z.number(),
  SportId: z.number(),
});
export type MatchCollection = z.infer<typeof MatchCollectionSchema>;

export const AssociatedCompetitionCollectionSchema = z.object({
  DivisionId: z.number(),
  DivisionName: z.string(),
  LinkTo: z.boolean(),
  SeasonId: z.number(),
  SeasonName: z.string(),
  SportId: z.number(),
  SportName: z.string(),
});
export type AssociatedCompetitionCollection = z.infer<
  typeof AssociatedCompetitionCollectionSchema
>;

export const AgeGroupMetaDataSchema = z.object({
  Key: z.number(),
  Value: z.string(),
});
export type AgeGroupMetaData = z.infer<typeof AgeGroupMetaDataSchema>;

export const MobTeamDetailsSchema = z.object({
  AgeGroupMetaData: AgeGroupMetaDataSchema,
  AssociatedCompetitionCollection: z.array(
    AssociatedCompetitionCollectionSchema
  ),
  BiggestLosingMarginCollection: z.array(z.string()),
  BiggestWinningMarginCollection: z.array(z.string()),
  CompletedMatchCollection: z.array(MatchCollectionSchema),
  FinalsBiggestLosingMarginCollection: z.array(z.string()),
  FinalsBiggestWinningMarginCollection: z.array(z.string()),
  FinalsHighestScoreCollection: z.array(z.string()),
  FinalsLongestLosingStreak: z.string(),
  FinalsLongestWinningStreak: z.string(),
  FinalsLowestScoreCollection: z.array(z.string()),
  FinalsMatchesLost: z.number(),
  FinalsMatchesPlayed: z.number(),
  FinalsMatchesWon: z.number(),
  FinalsResultsRatio: z.string(),
  FinalsScoreRatio: z.string(),
  FinalsTotalConcededScore: z.number(),
  FinalsTotalScore: z.number(),
  GenderMetaData: AgeGroupMetaDataSchema,
  HighestScoreCollection: z.array(z.string()),
  Id: z.number(),
  LastModified: z.string(),
  LongestLosingStreak: z.string(),
  LongestUndefeatedStreak: z.string(),
  LongestWinningStreak: z.string(),
  LowestScoreCollection: z.array(z.string()),
  MatchesDrawn: z.number(),
  MatchesLost: z.number(),
  MatchesPlayed: z.number(),
  MatchesWon: z.number(),
  Name: z.string(),
  PremiershipCollection: z.array(z.string()),
  PremiershipCount: z.number(),
  ResultsRatio: z.string(),
  RunnersUpCollection: z.array(z.string()),
  ScoreRatio: z.string(),
  SportCollectionMetaData: z.array(AgeGroupMetaDataSchema),
  TotalConcededScore: z.number(),
  TotalScore: z.number(),
  UpcomingMatchCollection: z.array(MatchCollectionSchema),
  YearFormed: z.string(),
});
export type MobTeamDetails = z.infer<typeof MobTeamDetailsSchema>;

export const TeamDetailResponseSchema = z.object({
  Message: z.null(),
  Success: z.boolean(),
  MobTeamDetails: MobTeamDetailsSchema,
});
export type TeamDetailResponse = z.infer<typeof TeamDetailResponseSchema>;
