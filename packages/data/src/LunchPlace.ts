import { authenticated, entity, text, uuid } from '@microsoft/rayfin-core';

@entity()
@authenticated('read')
@authenticated(['create', 'update', 'delete'], {
  policy: (claims, place) => claims.sub.eq(place.owner_id),
})
export class LunchPlace {
  @uuid() id!: string;
  @text({ min: 1, max: 100 }) name!: string;
  @text({ min: 1, max: 40 }) cuisine!: string;
  @text({ min: 1, max: 3 }) budget!: string;
  @text({ max: 240 }) note!: string;
  @text({ max: 200 }) owner_id!: string;
}

