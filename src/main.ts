/**
 * TODO: Add DistributionUpdated event
 */
import { Address, BigInt, log } from '@graphprotocol/graph-ts';

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
  const egg = new Egg(id.toString());
  const getter = Getter.bind(Address.fromString(getterAddress));
  const eggDetails = getter.getEgg(id);

  egg.owner = owner.toHex();
  egg.isInNest = false;
  egg.isHatched = false;
  egg.generation = eggDetails.value0;
  egg.coolness = eggDetails.value1;
  egg.parents = eggDetails.value2.map(id => id.toString());
  egg.momDragonTypes = eggDetails.value3;
  egg.dadDragonTypes = eggDetails.value4;

  egg.save();
}

export function handleEggClaimed(event: EggClaimedEvent): void {
  createEgg(event.params.id, event.params.user);
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
  const getter = Getter.bind(Address.fromString(getterAddress));
  const eggId = event.params.eggId.toString();
  const dragonId = event.params.dragonId.toString();
  const userId = event.params.user.toHex();
  const dragon = new Dragon(dragonId);
  const tactics = new DragonTactics(dragonId);
  const egg = Egg.load(eggId);
  const tacticsValue = getter.getDragonTactics(event.params.dragonId);
  const parents = getter.getDragonParents(event.params.dragonId);

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
  dragon.parents = parents.map(id => id.toString());
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
  createEgg(event.params.id, event.params.user);
}

export function handleDragonNameSet(event: DragonNameSetEvent): void {
  const id = event.params.id.toString();
  const dragon = Dragon.load(id);

  if (dragon) {
    dragon.name = event.params.name;
    dragon.save();
  }
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
  const id = event.params.user.toHex();
  const user = User.load(id) || new User(id);

  user.name = event.params.name;
  user.save();
}

// TODO: Check null address
// event.params._from.toHex() != '0x0000000000000000000000000000000000000000'
export function handleDragonTransfer(event: DragonTransferEvent): void {
  const from = event.params._from;
  const to = event.params._to;
  const id = event.params._tokenId.toString();
  const dragon = Dragon.load(id);

  log(3, from);
  log(3, from.toString());
  log(3, from.toHex());
  log(3, from.length);

  if (to && !User.load(to.toHex())) {
    const user = new User(to.toHex());

    user.save();
  }

  if (dragon) {
    dragon.owner = to.toHex();
    dragon.save();
  }
}

export function handleEggTransfer(event: EggTransferEvent): void {
  const from = event.params._from;
  const to = event.params._to;
  const id = event.params._tokenId.toString();
  const egg = Egg.load(id);

  log(3, from);
  log(3, from.toString());
  log(3, from.toHex());
  log(3, from.length);

  if (to && !User.load(to.toHex())) {
    const user = new User(to.toHex());

    user.save();
  }

  if (egg) {
    egg.owner = to.toHex();
    egg.save();
  }
}
