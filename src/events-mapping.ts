/**
 * TODO: Add DistributionUpdated event
 */

import { Address, BigInt, Value } from '@graphprotocol/graph-ts';
import {
  EggClaimed as EggClaimedEvent,
  EggSentToNest as EggSentToNestEvent,
  EggHatched as EggHatchedEvent,
  DragonUpgraded as DragonUpgradedEvent,
  EggCreated as EggCreatedEvent,
  DragonOnSale as DragonOnSaleEvent,
  DragonRemovedFromSale as DragonRemovedFromSaleEvent,
  DragonRemovedFromBreeding as DragonRemovedFromBreedingEvent,
  DragonOnBreeding as DragonOnBreedingEvent,
  DragonBought as DragonBoughtEvent,
  DragonBreedingBought as DragonBreedingBoughtEvent,
  DistributionUpdated as DistributionUpdatedEvent,
  EggOnSale as EggOnSaleEvent,
  EggRemovedFromSale as EggRemovedFromSaleEvent,
  EggBought as EggBoughtEvent,
  GoldSellOrderCreated as GoldSellOrderCreatedEvent,
  GoldSellOrderCancelled as GoldSellOrderCancelledEvent,
  GoldSold as GoldSoldEvent,
  GoldBuyOrderCreated as GoldBuyOrderCreatedEvent,
  GoldBuyOrderCancelled as GoldBuyOrderCancelledEvent,
  GoldBought as GoldBoughtEvent,
  SkillOnSale as SkillOnSaleEvent,
  SkillRemovedFromSale as SkillRemovedFromSaleEvent,
  SkillBought as SkillBoughtEvent,
  SkillSet as SkillSetEvent,
  SkillUsed as SkillUsedEvent,
  DragonNameSet as DragonNameSetEvent,
  DragonTacticsSet as DragonTacticsSetEvent,
  UserNameSet as UserNameSetEvent,
  BattleEnded as BattleEndedEvent,
  BattleDragonsDetails as BattleDragonsDetailsEvent,
  BattleHealthAndMana as BattleHealthAndManaEvent,
  BattleSkills as BattleSkillsEvent,
  BattleTacticsAndBuffs as BattleTacticsAndBuffsEvent,
  GladiatorBattleEnded as GladiatorBattleEndedEvent,
  GladiatorBattleCreated as GladiatorBattleCreatedEvent,
  GladiatorBattleApplicantAdded as GladiatorBattleApplicantAddedEvent,
  GladiatorBattleOpponentSelected as GladiatorBattleOpponentSelectedEvent,
  GladiatorBattleCancelled as GladiatorBattleCancelledEvent,
  GladiatorBattleBetReturned as GladiatorBattleBetReturnedEvent,
  GladiatorBattleOpponentSelectTimeUpdated as GladiatorBattleOpponentSelectTimeUpdatedEvent,
  GladiatorBattleBlockNumberUpdated as GladiatorBattleBlockNumberUpdatedEvent,
  GladiatorBattleSpectatorBetPlaced as GladiatorBattleSpectatorBetPlacedEvent,
  GladiatorBattleSpectatorBetRemoved as GladiatorBattleSpectatorBetRemovedEvent,
  GladiatorBattleSpectatorRewardPaidOut as GladiatorBattleSpectatorRewardPaidOutEvent,
  LeaderboardRewardsDistributed as LeaderboardRewardsDistributedEvent,
  OwnershipTransferred as OwnershipTransferredEvent
} from '../generated/Events/Events';
import {
  Auction,
  Dragon,
  Egg,
  User,
  GoldAuction,
  DragonTactics,
} from '../generated/schema';
import { Getter } from '../generated/Events/Getter';

const getterAddress = Address.fromString('0xF88Fdb63dc782dAE646cD6c74728Ca83f56200E4'); // TODO: Use dynamic address

type GameAsset = Dragon | Egg;

enum AuctionType {
  dragonSale = 'dragonSale',
  eggSale = 'eggSale',
  dragonBreeding = 'dragonBreeding',
}

enum AuctionStatus {
  active = 'active',
  canceled = 'canceled',
  fulfilled = 'fulfilled',
}

enum Currency {
  gold = 'gold',
  ether = 'ether',
}

enum GoldOrderType {
  sell = 'sell',
  buy = 'buy',
}

// TODO: Add default value and add egg to owner
function createEgg(id: string, owner: string): void {
  const egg = new Egg(id);

  egg.owner = owner;
  egg.isInNest = false;
  egg.isHatched = false;

  egg.save();
}

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

function createGoldAuction(userId: string, auctionId: string, orderType: string, price: BigInt, amount: BigInt, timestamp: BigInt): void {
  const user = User.load(userId) || new User(userId);
  const goldAuction = new GoldAuction(auctionId);

  goldAuction.type = orderType;
  goldAuction.status = AuctionStatus.active;
  goldAuction.seller = userId;
  goldAuction.price = price;
  goldAuction.amount = amount;
  goldAuction.created = timestamp;
  goldAuction.save();

  user.goldAuction = auctionId;
  user.save();
}

function cancelGoldAuction(userId: string, timestamp: BigInt): void {
  const user = User.load(userId);

  if (user && user.goldAuction) {
    const goldAuction = GoldAuction.load(user.goldAuction);

    if (goldAuction) {
      goldAuction.status = AuctionStatus.canceled;
      goldAuction.ended = timestamp;
      goldAuction.save();
    }

    user.goldAuction = null;
    user.save();
  }
}

function fulfillGoldAuction(userId: string, buyer: string, amount: BigInt, newAuctionId: string, timestamp: BigInt): void {
  const user = User.load(userId);

  if (user && user.goldAuction) {
    const goldAuction = new GoldAuction(user.goldAuction);

    if (goldAuction) {
      goldAuction.status = AuctionStatus.fulfilled;
      goldAuction.ended = timestamp;
      goldAuction.buyer = buyer;
      goldAuction.purchaseAmount = amount;
      goldAuction.save();

      if (goldAuction.amount.notEqual(goldAuction.purchaseAmount)) {
        createGoldAuction(userId, newAuctionId, goldAuction.type, goldAuction.price, goldAuction.amount.minus(goldAuction.purchaseAmount), timestamp)
      } else {
        user.goldAuction = null;
        user.save();
      }
    } else {
      user.goldAuction = null;
      user.save();
    }
  }
}

export function handleEggClaimed(event: EggClaimedEvent): void {
  createEgg(event.params.id.toString(), event.params.user.toString());
}

export function handleEggSentToNest(event: EggSentToNestEvent): void {
  const id = event.params.id.toString();
  const egg = Egg.load(id);

  if (egg) {
    egg.isInNest = true;
    egg.save();
  }
}

export function handleEggHatched(event: EggHatchedEvent): void {
  const getter = Getter.bind(getterAddress);
  const eggId = event.params.eggId.toString();
  const dragonId = event.params.dragonId.toString();
  const userId = event.params.user.toString();
  const dragon = new Dragon(dragonId);
  const tactics = new DragonTactics(dragonId);
  const egg = Egg.load(eggId);
  const {
    value0: melee,
    value1: attack,
  } = getter.getDragonTactics(event.params.dragonId);

  if (egg) {
    egg.isHatched = true;
    egg.save();
  }

  tactics.melee = melee;
  tactics.attack = attack;
  tactics.save();

  dragon.owner = userId;
  dragon.tactics = dragonId;
  dragon.save();
}

export function handleDragonUpgraded(event: DragonUpgradedEvent): void {
  const id = event.params.id.toString();
  const dragon = Dragon.load(id);

  if (dragon) {
    dragon.save();
  }
}

export function handleEggCreated(event: EggCreatedEvent): void {
  createEgg(event.params.id.toString(), event.params.user.toString());
}

export function handleEggOnSale(event: EggOnSaleEvent): void {
  const id = event.params.id.toString();
  const egg = Egg.load(id);
  const auctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  createAuction(egg, auctionId, AuctionType.eggSale);
}

export function handleDragonOnSale(event: DragonOnSaleEvent): void {
  const id = event.params.id.toString();
  const dragon = Dragon.load(id);
  const auctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  createAuction(dragon, auctionId, AuctionType.dragonSale);
}

export function handleDragonOnBreeding(event: DragonOnBreedingEvent): void {
  const id = event.params.id.toString();
  const dragon = Dragon.load(id);
  const auctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

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

export function handleGoldSellOrderCreated(
  event: GoldSellOrderCreatedEvent
): void {
  const seller = event.params.seller.toString();
  const goldAuctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  createGoldAuction(seller, goldAuctionId, GoldOrderType.sell, event.params.price, event.params.amount, event.block.timestamp);
}

export function handleGoldSellOrderCancelled(
  event: GoldSellOrderCancelledEvent
): void {
  const seller = event.params.seller.toString();

  cancelGoldAuction(seller, event.block.timestamp);
}

export function handleGoldSold(event: GoldSoldEvent): void {
  const seller = event.params.seller.toString();
  const buyer = event.params.buyer.toString();
  const newAuctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  fulfillGoldAuction(seller, buyer, event.params.amount, newAuctionId, event.block.timestamp);
}

export function handleGoldBuyOrderCreated(
  event: GoldBuyOrderCreatedEvent
): void {
  const buyer = event.params.buyer.toString();
  const goldAuctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  createGoldAuction(buyer, goldAuctionId, GoldOrderType.buy, event.params.price, event.params.amount, event.block.timestamp);
}

export function handleGoldBuyOrderCancelled(
  event: GoldBuyOrderCancelledEvent
): void {
  const buyer = event.params.buyer.toString();

  cancelGoldAuction(buyer, event.block.timestamp);
}

export function handleGoldBought(event: GoldBoughtEvent): void {
  const seller = event.params.seller.toString();
  const buyer = event.params.buyer.toString();
  const newAuctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  fulfillGoldAuction(buyer, seller, event.params.amount, newAuctionId, event.block.timestamp);
}

export function handleDragonNameSet(event: DragonNameSetEvent): void {
  const id = event.params.id.toString();
  const dragon = Dragon.load(id);

  dragon.name = event.params.name;
  dragon.save();
}

export function handleDragonTacticsSet(event: DragonTacticsSetEvent): void {
  const id = event.params.id.toString();
  const tactics = DragonTactics.load(id);

  if (tactics) {
    tactics.melee = event.params.melee;
    tactics.attack = event.params.attack;
    tactics.save();
  }
}

export function handleUserNameSet(event: UserNameSetEvent): void {
  const id = event.params.user.toString();
  const user = User.load(id) || new User(id);

  user.name = event.params.name;
  user.save();
}
