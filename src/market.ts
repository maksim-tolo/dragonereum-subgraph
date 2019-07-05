import { Address, BigInt, Value } from '@graphprotocol/graph-ts';
import {
  DragonOnSale as DragonOnSaleEvent,
  DragonRemovedFromSale as DragonRemovedFromSaleEvent,
  DragonRemovedFromBreeding as DragonRemovedFromBreedingEvent,
  DragonOnBreeding as DragonOnBreedingEvent,
  DragonBought as DragonBoughtEvent,
  DragonBreedingBought as DragonBreedingBoughtEvent,
  EggOnSale as EggOnSaleEvent,
  EggRemovedFromSale as EggRemovedFromSaleEvent,
  EggBought as EggBoughtEvent,
} from '../generated/Events/Events';
import {
  Auction,
  Dragon,
  Egg,
} from '../generated/schema';
import { Getter } from '../generated/Events/Getter';
import {
  ActiveAuctionStatus,
  CanceledAuctionStatus,
  DragonBreedingAuctionType,
  DragonSaleAuctionType,
  EggSaleAuctionType,
  EtherCurrency,
  FulfilledAuctionStatus,
  getterAddress,
  GoldCurrency,
} from './constants';

interface AuctionInfo {
  value0: Address; // seller
  value1: BigInt; // currentPrice
  value2: BigInt; // startPrice
  value3: BigInt; // endPrice
  value4: i32; // period
  value5: BigInt; // created
  value6: boolean; // isGold
}

// Egg or Dragon
interface GameAsset {
  id: string;
  owner: string | null;
  auction: string | null;
  save: Function;
}

function getAuctionInfo(entityId: BigInt, auctionType: string): AuctionInfo | null {
  let getter = Getter.bind(Address.fromString(getterAddress));

  switch (auctionType) {
    case DragonSaleAuctionType:
      return getter.getDragonOnSaleInfo(entityId);
    case EggSaleAuctionType:
      return getter.getEggOnSaleInfo(entityId);
    case DragonBreedingAuctionType:
      return getter.getBreedingOnSaleInfo(entityId);
    default:
      return null;
  }
}

function createAuction(entity: GameAsset | null, auctionId: string, auctionType: string): void {
  if (entity != null && entity.owner != null) {
    let auctionInfo = getAuctionInfo(Value.fromString(entity.id).toBigInt(), auctionType);

    if (auctionInfo != null) {
      let auction = new Auction(auctionId);

      auction.type = auctionType;
      auction.currency = auctionInfo.value6 ? GoldCurrency : EtherCurrency;
      auction.status = ActiveAuctionStatus;
      auction.startPrice = auctionInfo.value2;
      auction.endPrice = auctionInfo.value3;
      auction.seller = entity.owner;
      auction.period = auctionInfo.value4;
      auction.created = auctionInfo.value5;
      auction.save();

      if (entity != null) {
        entity.auction = auctionId;
        entity.save();
      }
    }
  }
}

// TODO: Handle ownership transferring or add entity.owner = buyer;
function fulfillAuction(entity: GameAsset | null, buyer: Address, price: BigInt, timestamp: BigInt): void {
  if (entity != null && entity.auction != null) {
    let auction = Auction.load(entity.auction);

    if (auction != null) {
      auction.status = FulfilledAuctionStatus;
      auction.buyer = buyer.toHex();
      auction.purchasePrice = price;
      auction.ended = timestamp;
      auction.save();
    }

    entity.auction = null;
    entity.save();
  }
}

function cancelAuction(entity: GameAsset | null, timestamp: BigInt): void {
  if (entity != null && entity.auction != null) {
    let auction = Auction.load(entity.auction);

    if (auction != null) {
      auction.status = CanceledAuctionStatus;
      auction.ended = timestamp;
      auction.save();
    }

    entity.auction = null;
    entity.save();
  }
}

export function handleEggOnSale(event: EggOnSaleEvent): void {
  let id = event.params.id.toString();
  let egg = Egg.load(id);
  let auctionId = event.transaction.hash.toHex() + '-' + event.logIndex.toString();

  createAuction(egg, auctionId, EggSaleAuctionType);
}

export function handleDragonOnSale(event: DragonOnSaleEvent): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);
  let auctionId = event.transaction.hash.toHex() + '-' + event.logIndex.toString();

  createAuction(dragon, auctionId, DragonSaleAuctionType);
}

export function handleDragonOnBreeding(event: DragonOnBreedingEvent): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);
  let auctionId = event.transaction.hash.toHex() + '-' + event.logIndex.toString();

  createAuction(dragon, auctionId, DragonBreedingAuctionType);
}

export function handleEggRemovedFromSale(event: EggRemovedFromSaleEvent): void {
  let id = event.params.id.toString();
  let egg = Egg.load(id);

  cancelAuction(egg, event.block.timestamp);
}

export function handleDragonRemovedFromSale(
  event: DragonRemovedFromSaleEvent
): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);

  cancelAuction(dragon, event.block.timestamp);
}

export function handleDragonRemovedFromBreeding(
  event: DragonRemovedFromBreedingEvent
): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);

  cancelAuction(dragon, event.block.timestamp);
}

export function handleEggBought(event: EggBoughtEvent): void {
  let id = event.params.id.toString();
  let egg = Egg.load(id);

  fulfillAuction(egg, event.params.buyer, event.params.price, event.block.timestamp);
}

export function handleDragonBought(event: DragonBoughtEvent): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);

  fulfillAuction(dragon, event.params.buyer, event.params.price, event.block.timestamp);
}

export function handleDragonBreedingBought(
  event: DragonBreedingBoughtEvent
): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);

  fulfillAuction(dragon, event.params.buyer, event.params.price, event.block.timestamp);
}
