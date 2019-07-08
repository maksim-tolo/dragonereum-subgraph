import { Address, BigInt, EthereumBlock } from '@graphprotocol/graph-ts';
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
import { Auction, Dragon, Egg } from '../generated/schema';
import {
  Getter,
  Getter__getDragonOnSaleInfoResult as DragonSaleInfo,
  Getter__getEggOnSaleInfoResult as EggSaleInfo,
  Getter__getBreedingOnSaleInfoResult as DragonBreedingSaleInfo,
} from '../generated/Events/Getter';
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

let dynamicPricesAuctionsIds: string[] = [];

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
interface ERC721Token {
  id: string;
  owner: string | null;
  auction: string | null;
  save: Function;
}

function addAuctionToDynamicPricesRegistry(auctionId: string): void {
  dynamicPricesAuctionsIds = dynamicPricesAuctionsIds.concat([auctionId]);
}

function removeAuctionFromDynamicPricesRegistry(auctionId: string): void {
  dynamicPricesAuctionsIds = dynamicPricesAuctionsIds.filter(
    id => id != auctionId,
  );
}

function updateCurrentPrice(auctionId: string, timestamp: BigInt): boolean {
  let auction = Auction.load(auctionId);

  if (auction != null) {
    let startPrice = auction.startPrice;
    let endPrice = auction.endPrice;
    let period = auction.period;
    let created = auction.created;
    let oneHourInSeconds = BigInt.fromI32(3600);
    let fullPeriod = BigInt.fromI32(period).times(oneHourInSeconds);
    let pastTime = timestamp.minus(created);

    if (pastTime.ge(fullPeriod)) {
      auction.currentPrice = endPrice;
      auction.save();

      return false;
    }

    let isIncreasingType = startPrice < endPrice;
    let interval = isIncreasingType
      ? endPrice.minus(startPrice)
      : startPrice.minus(endPrice);
    let priceChangingSpeed = interval.div(fullPeriod);
    let diff = pastTime.times(priceChangingSpeed);

    auction.currentPrice = isIncreasingType
      ? startPrice.plus(diff)
      : startPrice.minus(diff);
    auction.save();

    return true;
  }

  return false;
}

function createAuction<T extends ERC721Token, K extends AuctionInfo>(
  token: T | null,
  auctionInfo: K,
  auctionId: string,
  auctionType: string,
): void {
  if (token != null && token.owner != null && auctionInfo != null) {
    let auction = new Auction(auctionId);

    auction.type = auctionType;
    auction.currency = auctionInfo.value6 ? GoldCurrency : EtherCurrency;
    auction.status = ActiveAuctionStatus;
    auction.currentPrice = auctionInfo.value1;
    auction.startPrice = auctionInfo.value2;
    auction.endPrice = auctionInfo.value3;
    auction.seller = token.owner;
    auction.period = auctionInfo.value4;
    auction.created = auctionInfo.value5;
    auction.save();

    if (auction.startPrice != auction.endPrice) {
      addAuctionToDynamicPricesRegistry(auctionId);
    }

    token.auction = auctionId;
    token.save();
  }
}

function fulfillAuction<T extends ERC721Token>(
  token: T | null,
  buyer: Address,
  price: BigInt,
  timestamp: BigInt,
  txHash: string,
): void {
  if (token != null && token.auction != null) {
    let auction = Auction.load(token.auction);

    if (auction != null) {
      auction.status = FulfilledAuctionStatus;
      auction.buyer = buyer.toHex();
      auction.purchasePrice = price;
      auction.ended = timestamp;
      auction.txHash = txHash;
      auction.save();

      if (auction.startPrice != auction.endPrice) {
        removeAuctionFromDynamicPricesRegistry(token.auction);
      }
    }

    token.auction = null;
    token.save();
  }
}

function cancelAuction<T extends ERC721Token>(
  token: T | null,
  timestamp: BigInt,
): void {
  if (token != null && token.auction != null) {
    let auction = Auction.load(token.auction);

    if (auction != null) {
      auction.status = CanceledAuctionStatus;
      auction.ended = timestamp;
      auction.save();

      if (auction.startPrice != auction.endPrice) {
        removeAuctionFromDynamicPricesRegistry(token.auction);
      }
    }

    token.auction = null;
    token.save();
  }
}

export function handleEggOnSale(event: EggOnSaleEvent): void {
  let id = event.params.id.toString();
  let egg = Egg.load(id);
  let auctionId =
    event.transaction.hash.toHex() + '-' + event.logIndex.toString();
  let getter = Getter.bind(Address.fromString(getterAddress));
  let auctionInfo = getter.getEggOnSaleInfo(event.params.id);

  createAuction<Egg, EggSaleInfo>(
    egg,
    auctionInfo,
    auctionId,
    EggSaleAuctionType,
  );

  let auction = Auction.load(auctionId);

  if (auction != null) {
    auction.egg = id;
    auction.save();
  }
}

export function handleDragonOnSale(event: DragonOnSaleEvent): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);
  let auctionId =
    event.transaction.hash.toHex() + '-' + event.logIndex.toString();
  let getter = Getter.bind(Address.fromString(getterAddress));
  let auctionInfo = getter.getDragonOnSaleInfo(event.params.id);

  createAuction<Dragon, DragonSaleInfo>(
    dragon,
    auctionInfo,
    auctionId,
    DragonSaleAuctionType,
  );

  let auction = Auction.load(auctionId);

  if (auction != null) {
    auction.dragon = id;
    auction.save();
  }
}

export function handleDragonOnBreeding(event: DragonOnBreedingEvent): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);
  let auctionId =
    event.transaction.hash.toHex() + '-' + event.logIndex.toString();
  let getter = Getter.bind(Address.fromString(getterAddress));
  let auctionInfo = getter.getBreedingOnSaleInfo(event.params.id);

  createAuction<Dragon, DragonBreedingSaleInfo>(
    dragon,
    auctionInfo,
    auctionId,
    DragonBreedingAuctionType,
  );

  let auction = Auction.load(auctionId);

  if (auction != null) {
    auction.dragon = id;
    auction.save();
  }
}

export function handleEggRemovedFromSale(event: EggRemovedFromSaleEvent): void {
  let id = event.params.id.toString();
  let egg = Egg.load(id);

  cancelAuction<Egg>(egg, event.block.timestamp);
}

export function handleDragonRemovedFromSale(
  event: DragonRemovedFromSaleEvent,
): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);

  cancelAuction<Dragon>(dragon, event.block.timestamp);
}

export function handleDragonRemovedFromBreeding(
  event: DragonRemovedFromBreedingEvent,
): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);

  cancelAuction<Dragon>(dragon, event.block.timestamp);
}

export function handleEggBought(event: EggBoughtEvent): void {
  let id = event.params.id.toString();
  let egg = Egg.load(id);
  let txHash = event.transaction.hash.toHex();

  fulfillAuction<Egg>(
    egg,
    event.params.buyer,
    event.params.price,
    event.block.timestamp,
    txHash,
  );
}

export function handleDragonBought(event: DragonBoughtEvent): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);
  let txHash = event.transaction.hash.toHex();

  fulfillAuction<Dragon>(
    dragon,
    event.params.buyer,
    event.params.price,
    event.block.timestamp,
    txHash,
  );
}

export function handleDragonBreedingBought(
  event: DragonBreedingBoughtEvent,
): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);
  let txHash = event.transaction.hash.toHex();

  fulfillAuction<Dragon>(
    dragon,
    event.params.buyer,
    event.params.price,
    event.block.timestamp,
    txHash,
  );
}

export function handleBlock(block: EthereumBlock): void {
  if (dynamicPricesAuctionsIds.length != 0) {
    dynamicPricesAuctionsIds = dynamicPricesAuctionsIds.filter(auctionId =>
      updateCurrentPrice(auctionId, block.timestamp),
    );
  }
}
