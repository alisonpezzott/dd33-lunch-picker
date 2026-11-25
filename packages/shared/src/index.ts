/**
 * Browser-safe contracts shared by the data registration package and frontend.
 *
 * Keep each record shape aligned with its decorated runtime entity in
 * `@rayfin-app/data`. This package must stay isomorphic, so do not import the
 * decorated classes here.
 */
export interface LunchPlaceRecord {
  id: string;
  name: string;
  cuisine: string;
  budget: string;
  note: string;
  owner_id: string;
}

export interface LunchBallotRecord {
  id: string;
  day: string;
  place_id: string;
  owner_id: string;
}

export type UniversalAppSchema = {
  LunchPlace: LunchPlaceRecord;
  LunchBallot: LunchBallotRecord;
};
