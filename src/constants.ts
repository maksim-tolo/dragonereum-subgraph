import { Address } from '@graphprotocol/graph-ts/index';
import { Dragon, Egg } from '../generated/schema';

export const getterAddress = Address.fromString('0xF88Fdb63dc782dAE646cD6c74728Ca83f56200E4'); // TODO: Use dynamic address

export type GameAsset = Dragon | Egg;

export enum AuctionType {
  dragonSale = 'dragonSale',
  eggSale = 'eggSale',
  dragonBreeding = 'dragonBreeding',
}

export enum AuctionStatus {
  active = 'active',
  canceled = 'canceled',
  fulfilled = 'fulfilled',
}

export enum Currency {
  gold = 'gold',
  ether = 'ether',
}

export enum GoldOrderType {
  sell = 'sell',
  buy = 'buy',
}
