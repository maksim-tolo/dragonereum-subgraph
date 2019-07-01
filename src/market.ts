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
import { AuctionStatus, AuctionType, Currency, GameAsset, getterAddress } from './constants';

function cancelAuction(entity: GameAsset, timestamp: BigInt): void {
  if (entity && entity.auction) {
    const auction = Auction.load(entity.auction);

    if (auction) {
      auction.status = AuctionStatus.canceled;
      auction.ended = timestamp;
      auction.save();
    }

    entity.auction = null;
    entity.save();
  }
}

// TODO: Add return type
function getAuctionInfo(entityId: BigInt, auctionType: string) {
  const contract = Getter.bind(getterAddress);

  switch (auctionType) {
    case AuctionType.dragonSale:
      return contract.getDragonOnSaleInfo(entityId);
    case AuctionType.eggSale:
      return contract.getEggOnSaleInfo(entityId);
    case AuctionType.dragonBreeding:
      return contract.getBreedingOnSaleInfo(entityId);
    default:
      return null;
  }
}

function createAuction(entity: GameAsset, auctionId: string, auctionType: string): void {
  const auctionInfo = getAuctionInfo(Value.fromString(entity.id).toBigInt(), auctionType);

  if (entity && auctionInfo) {
    const {
      value2: startPrice,
      value3: endPrice,
      value4: period,
      value5: created,
      value6: isGold,
    } = auctionInfo;

    const auction = new Auction(auctionId);

    auction.type = AuctionType.dragonSale;
    auction.currency = isGold ? Currency.gold : Currency.ether;
    auction.status = AuctionStatus.active;
    auction.startPrice = startPrice;
    auction.endPrice = endPrice;
    auction.seller = entity.owner;
    auction.period = period;
    auction.created = created;
    auction.save();

    if (entity) {
      entity.auction = auctionId;
      entity.save();
    }
  }
}

// TODO: Handle ownership transferring or add entity.owner = buyer;
function fulfillAuction(entity: GameAsset, buyer: Address, price: BigInt, timestamp: BigInt): void {
  if (entity && entity.auction) {
    const auction = Auction.load(entity.auction);

    if (auction) {
      auction.status = AuctionStatus.fulfilled;
      auction.buyer = buyer.toString();
      auction.purchasePrice = price;
      auction.ended = timestamp;
      auction.save();
    }

    entity.auction = null;
    entity.save();
  }
}

export function handleEggOnSale(event: EggOnSaleEvent): void {
  const id = event.params.id.toString();
  const egg = Egg.load(id);
  const auctionId = event.transaction.hash.toHex() + '-' + event.logIndex.toString();

  createAuction(egg, auctionId, AuctionType.eggSale);
}

export function handleDragonOnSale(event: DragonOnSaleEvent): void {
  const id = event.params.id.toString();
  const dragon = Dragon.load(id);
  const auctionId = event.transaction.hash.toHex() + '-' + event.logIndex.toString();

  createAuction(dragon, auctionId, AuctionType.dragonSale);
}

export function handleDragonOnBreeding(event: DragonOnBreedingEvent): void {
  const id = event.params.id.toString();
  const dragon = Dragon.load(id);
  const auctionId = event.transaction.hash.toHex() + '-' + event.logIndex.toString();

  createAuction(dragon, auctionId, AuctionType.dragonBreeding);
}

export function handleEggRemovedFromSale(event: EggRemovedFromSaleEvent): void {
  const id = event.params.id.toString();
  const egg = Egg.load(id);

  cancelAuction(egg, event.block.timestamp);
}

export function handleDragonRemovedFromSale(
  event: DragonRemovedFromSaleEvent
): void {
  const id = event.params.id.toString();
  const dragon = Dragon.load(id);

  cancelAuction(dragon, event.block.timestamp);
}

export function handleDragonRemovedFromBreeding(
  event: DragonRemovedFromBreedingEvent
): void {
  const id = event.params.id.toString();
  const dragon = Dragon.load(id);

  cancelAuction(dragon, event.block.timestamp);
}

export function handleEggBought(event: EggBoughtEvent): void {
  const id = event.params.id.toString();
  const egg = Egg.load(id);

  fulfillAuction(egg, event.params.buyer, event.params.price, event.block.timestamp);
}

export function handleDragonBought(event: DragonBoughtEvent): void {
  const id = event.params.id.toString();
  const dragon = Dragon.load(id);

  fulfillAuction(dragon, event.params.buyer, event.params.price, event.block.timestamp);
}

export function handleDragonBreedingBought(
  event: DragonBreedingBoughtEvent
): void {
  const id = event.params.id.toString();
  const dragon = Dragon.load(id);

  fulfillAuction(dragon, event.params.buyer, event.params.price, event.block.timestamp);
}
