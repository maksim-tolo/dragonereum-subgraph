import {store, Address, BigInt, Value} from '@graphprotocol/graph-ts';
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
} from "../generated/Events/Events"
import {
  Auction,
  Dragon,
  Egg,
} from "../generated/schema"
import { Getter } from "../generated/Getter/Getter";

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

function createEgg(id, owner) {
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
      auction.buyer = buyer;
      auction.purchasePrice = price;
      auction.ended = timestamp;
      auction.save();
    }

    entity.auction = null;
    entity.save();
  }
}

export function handleEggClaimed(event: EggClaimedEvent): void {
  createEgg(event.params.id.toString(), event.params.user);
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
  const eggId = event.params.eggId.toString();
  const dragonId = event.params.dragonId.toString();
  const dragon = new Dragon(dragonId);
  const egg = Egg.load(eggId);

  if (egg) {
    egg.isHatched = true;
    egg.save();
  }

  dragon.owner = event.params.user;
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
  createEgg(event.params.id.toString(), event.params.user);
}

export function handleDragonOnSale(event: DragonOnSaleEvent): void {
  const id = event.params.id.toString();
  const dragon = Dragon.load(id);
  const auctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  createAuction(dragon, auctionId, AuctionType.dragonSale);
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

export function handleDragonOnBreeding(event: DragonOnBreedingEvent): void {
  const id = event.params.id.toString();
  const dragon = Dragon.load(id);
  const auctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  createAuction(dragon, auctionId, AuctionType.dragonBreeding);
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
