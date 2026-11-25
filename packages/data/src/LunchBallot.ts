import { authenticated, entity, one, text, uuid } from '@microsoft/rayfin-core';
import { LunchPlace } from './LunchPlace.js';

@entity()
@authenticated('read')
@authenticated(['create', 'delete'], {
  policy: (claims, ballot) => claims.sub.eq(ballot.owner_id),
})
@authenticated('update', {
  policy: (claims, ballot) => claims.sub.eq(ballot.owner_id),
  include: ['day', 'place_id'],
})
export class LunchBallot {
  @uuid() id!: string;
  // One reusable ballot per subject makes concurrent creates unique in the database.
  @text({ max: 200, unique: true }) owner_id!: string;
  @text({ min: 10, max: 10 }) day!: string;
  @uuid() place_id!: string;
  @one(() => LunchPlace) place!: LunchPlace;
}
