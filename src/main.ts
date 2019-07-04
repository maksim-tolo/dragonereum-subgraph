/**
 * TODO: Add DistributionUpdated event
 */
import { Address, BigInt, log, Value } from '@graphprotocol/graph-ts';

import {
  EggClaimed as EggClaimedEvent,
  EggSentToNest as EggSentToNestEvent,
  EggHatched as EggHatchedEvent,
  DragonUpgraded as DragonUpgradedEvent,
  EggCreated as EggCreatedEvent,
  DragonNameSet as DragonNameSetEvent,
  DragonTacticsSet as DragonTacticsSetEvent,
  UserNameSet as UserNameSetEvent,
  LeaderboardRewardsDistributed as LeaderboardRewardsDistributedEvent,
  DistributionUpdated as DistributionUpdatedEvent,
} from '../generated/Events/Events';
import { Transfer as DragonTransferEvent } from '../generated/DragonStorage/DragonStorage';
import { Transfer as EggTransferEvent } from '../generated/EggStorage/EggStorage';
import {
  Dragon,
  Egg,
  User,
  DragonTactics,
} from '../generated/schema';
import { Getter } from '../generated/Events/Getter';
import { getterAddress } from './constants';

// TODO: Add default value and add egg to owner
function createEgg(id: BigInt, owner: Address): void {
  let egg = new Egg(id.toString());
  let getter = Getter.bind(Address.fromString(getterAddress));
  let eggDetails = getter.getEgg(id);

  egg.owner = owner.toHex();
  egg.isInNest = false;
  egg.isHatched = false;
  egg.generation = eggDetails.value0;
  egg.coolness = eggDetails.value1;
  egg.parents = eggDetails.value2.map<string>(id => id.toString());
  egg.momDragonTypes = eggDetails.value3;
  egg.dadDragonTypes = eggDetails.value4;

  egg.save();
}

export function handleEggClaimed(event: EggClaimedEvent): void {
  createEgg(event.params.id, event.params.user);
}

export function handleEggSentToNest(event: EggSentToNestEvent): void {
  let id = event.params.id.toString();
  let egg = Egg.load(id);

  if (egg) {
    egg.isInNest = true;
    egg.save();
  }
}

export function handleEggHatched(event: EggHatchedEvent): void {
  let getter = Getter.bind(Address.fromString(getterAddress));
  let eggId = event.params.eggId.toString();
  let dragonId = event.params.dragonId.toString();
  let userId = event.params.user.toHex();
  let dragon = new Dragon(dragonId);
  let tactics = new DragonTactics(dragonId);
  let egg = Egg.load(eggId);
  let tacticsValue = getter.getDragonTactics(event.params.dragonId);
  let parents = getter.getDragonParents(event.params.dragonId);

  if (egg) {
    egg.isHatched = true;
    egg.hatchedDragon = dragonId;
    egg.owner = null;
    egg.save();
  }

  tactics.melee = tacticsValue.value0;
  tactics.attack = tacticsValue.value1;
  tactics.save();

  dragon.owner = userId;
  dragon.tactics = dragonId; // Reference to DragonTactics
  dragon.fromEgg = eggId;
  dragon.parents = parents.map<string>(id => id.toString());
  dragon.save();
}

export function handleDragonUpgraded(event: DragonUpgradedEvent): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);

  if (dragon) {
    dragon.save();
  }
}

export function handleEggCreated(event: EggCreatedEvent): void {
  createEgg(event.params.id, event.params.user);
}

export function handleDragonNameSet(event: DragonNameSetEvent): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);

  if (dragon) {
    dragon.name = event.params.name;
    dragon.save();
  }
}

export function handleDragonTacticsSet(event: DragonTacticsSetEvent): void {
  let id = event.params.id.toString();
  let tactics = DragonTactics.load(id);

  if (tactics) {
    tactics.melee = event.params.melee;
    tactics.attack = event.params.attack;
    tactics.save();
  }
}

export function handleUserNameSet(event: UserNameSetEvent): void {
  let id = event.params.user.toHex();
  let user = User.load(id) || new User(id);

  user.name = event.params.name;
  user.save();
}

// TODO: Check null address
// event.params._from.toHex() != '0x0000000000000000000000000000000000000000'
export function handleDragonTransfer(event: DragonTransferEvent): void {
  let from = event.params._from;
  let to = event.params._to;
  let id = event.params._tokenId.toString();
  let dragon = Dragon.load(id);

  if (!User.load(to.toHex()) != null) {
    let user = new User(to.toHex());

    user.save();
  }

  if (dragon) {
    dragon.owner = to.toHex();
    dragon.save();
  }
}

export function handleEggTransfer(event: EggTransferEvent): void {
  let from = event.params._from;
  let to = event.params._to;
  let id = event.params._tokenId.toString();
  let egg = Egg.load(id);

  log.info(to.toHex(), []);
  log.info(to.toString(), []);
  log.info(Value.fromI32(to.length).toString(), []);

  if (!User.load(to.toHex()) != null) {
    let user = new User(to.toHex());

    user.save();
  }

  if (egg) {
    egg.owner = to.toHex();
    egg.save();
  }
}
