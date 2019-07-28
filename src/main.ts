/**
 * TODO: Add DistributionUpdated event
 */
import { Address, BigInt } from '@graphprotocol/graph-ts';

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
  DragonTactics,
  DragonBattlesStat,
  Auction,
} from '../generated/schema';
import { Getter } from '../generated/Events/Getter';
import { getterAddress, nullAddress } from './constants';
import {
  initUser,
  updateDragonSkills,
  updateEtherSpentOnToken,
  updateTactics,
  parseDragonTypes,
} from './helper';

function getEggTypes(momTypes: i32[], dadTypes: i32[]): i32[] {
  let types: i32[] = [];
  let minLength = Math.min(momTypes.length, dadTypes.length);

  for (let i: i32 = 0; i < minLength; i++) {
    types.push((momTypes[i] + dadTypes[i]) / 2);
  }

  return types;
}

function createEgg(id: BigInt, owner: Address, timestamp: BigInt): void {
  let eggId = id.toString();
  let egg = Egg.load(eggId) || new Egg(eggId);
  let getter = Getter.bind(Address.fromString(getterAddress));
  let eggDetails = getter.getEgg(id);

  egg.owner = owner.toHex();
  egg.birthDay = timestamp;
  egg.isInNest = false;
  egg.isHatched = false;
  egg.generation = eggDetails.value0;
  egg.coolness = eggDetails.value1;
  egg.momDragonTypes = eggDetails.value3;
  egg.dadDragonTypes = eggDetails.value4;
  egg.types = getEggTypes(egg.momDragonTypes, egg.dadDragonTypes); // TODO: Remove when auction.dragonTypes is removed
  egg.parsedTypes = parseDragonTypes(egg.types); // TODO: Remove

  if (egg.generation == 0) {
    egg.parents = [];
  } else {
    egg.parents = eggDetails.value2.map<string>(id => id.toString());
    eggDetails.value2.forEach((dragonId: BigInt) => {
      if (dragonId.notEqual(BigInt.fromI32(0))) {
        let getter = Getter.bind(Address.fromString(getterAddress));
        let dragon = Dragon.load(dragonId.toString());
        let profile = getter.getDragonProfile(dragonId);

        if (dragon != null) {
          dragon.dnaPoints = profile.value5;
          dragon.isBreedingAllowed = profile.value6;
          dragon.save();
        }
      }
    });
  }

  egg.save();
}

export function handleEggClaimed(event: EggClaimedEvent): void {
  createEgg(event.params.id, event.params.user, event.block.timestamp);
}

export function handleEggCreated(event: EggCreatedEvent): void {
  createEgg(event.params.id, event.params.user, event.block.timestamp);
}

export function handleEggSentToNest(event: EggSentToNestEvent): void {
  let id = event.params.id.toString();
  let egg = Egg.load(id);

  if (egg != null) {
    updateEtherSpentOnToken<Egg>(egg, event.transaction);

    egg.isInNest = true;
    egg.nestPlacementDate = event.block.timestamp;
    egg.save();
  }
}

export function handleEggHatched(event: EggHatchedEvent): void {
  let getter = Getter.bind(Address.fromString(getterAddress));
  let eggId = event.params.eggId.toString();
  let dragonId = event.params.dragonId;
  let dragonIdStr = dragonId.toString();
  let userId = event.params.user.toHex();
  let dragon = Dragon.load(dragonIdStr) || new Dragon(dragonIdStr);
  let battlesStat =
    DragonBattlesStat.load(dragonIdStr) || new DragonBattlesStat(dragonIdStr);
  let egg = Egg.load(eggId);
  let parents = getter.getDragonParents(dragonId);
  let profile = getter.getDragonProfile(dragonId);
  let types = getter.getDragonTypes(dragonId);
  let genome = getter.getDragonGenome(dragonId);
  let buffs = getter.getDragonBuffs(dragonId);
  let strength = getter.getDragonStrength(dragonId);

  if (egg != null) {
    dragon.etherSpent = egg.etherSpent; // Transfer ether spent on egg to dragon
    egg.isHatched = true;
    egg.isInNest = false;
    egg.hatchedDragon = dragonIdStr;
    egg.owner = null;
    egg.save();
  }

  updateTactics(dragonId);
  updateDragonSkills(dragonId);

  battlesStat.wins = 0;
  battlesStat.defeats = 0;
  battlesStat.save();

  dragon.name = profile.value0.toString();
  dragon.generation = profile.value1;
  dragon.birthDay = profile.value2;
  dragon.level = profile.value3;
  dragon.experience = profile.value4;
  dragon.dnaPoints = profile.value5;
  dragon.isBreedingAllowed = profile.value6;
  dragon.coolness = profile.value7;
  dragon.types = types;
  dragon.parsedTypes = parseDragonTypes(dragon.types); // TODO: Remove
  dragon.genome = genome;
  dragon.strength = strength;
  dragon.owner = userId;
  dragon.tactics = dragonIdStr; // Reference to DragonTactics
  dragon.skills = dragonIdStr; // Reference to DragonSkills
  dragon.healthAndMana = dragonIdStr; // Reference to DragonHealthAndMana
  dragon.battlesStat = dragonIdStr; // Reference to DragonBattlesStat
  dragon.specialAttack = dragonIdStr; // Reference to DragonSpecialAttack
  dragon.specialDefense = dragonIdStr; // Reference to DragonSpecialDefense
  dragon.fromEgg = eggId;
  dragon.buffs = buffs;
  dragon.parents = parents.map<string>(id => id.toString());
  dragon.save();
}

export function handleDragonUpgraded(event: DragonUpgradedEvent): void {
  let id = event.params.id;
  let idStr = id.toString();
  let dragon = Dragon.load(idStr);
  let getter = Getter.bind(Address.fromString(getterAddress));
  let profile = getter.getDragonProfile(id);
  let genome = getter.getDragonGenome(id);
  let strength = getter.getDragonStrength(id);

  if (dragon != null) {
    updateEtherSpentOnToken<Dragon>(dragon, event.transaction);

    dragon.dnaPoints = profile.value5;
    dragon.isBreedingAllowed = profile.value6;
    dragon.coolness = profile.value7;
    dragon.genome = genome;
    dragon.strength = strength;
    dragon.save();

    // TODO: Remove
    if (dragon.auction != null) {
      let auction = Auction.load(dragon.auction);

      if (auction != null) {
        auction.tokenCoolness = dragon.coolness;

        auction.save();
      }
    }
  }

  updateDragonSkills(id);
}

export function handleDragonNameSet(event: DragonNameSetEvent): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);

  if (dragon != null) {
    updateEtherSpentOnToken<Dragon>(dragon, event.transaction);

    dragon.name = event.params.name.toString();
    dragon.save();
  }
}

export function handleDragonTacticsSet(event: DragonTacticsSetEvent): void {
  let id = event.params.id.toString();
  let tactics = DragonTactics.load(id);
  let dragon = Dragon.load(id);

  if (tactics != null) {
    tactics.melee = event.params.melee;
    tactics.attack = event.params.attack;
    tactics.save();
  }

  if (dragon != null) {
    updateEtherSpentOnToken<Dragon>(dragon, event.transaction);
    dragon.save();
  }
}

export function handleUserNameSet(event: UserNameSetEvent): void {
  let id = event.params.user.toHex();
  let user = initUser(id);

  user.name = event.params.name.toString();
  user.save();
}

export function handleDragonTransfer(event: DragonTransferEvent): void {
  let to = event.params._to.toHex();
  let id = event.params._tokenId.toString();
  let dragon = Dragon.load(id) || new Dragon(id);

  if (to != nullAddress) {
    initUser(to);

    if (dragon.owner == null) {
      // Dragon was born
      dragon.owner = to;
    } else if (dragon.owner == event.transaction.from.toHex()) {
      // Regular transfer
      updateEtherSpentOnToken<Dragon>(dragon, event.transaction);

      dragon.owner = to;
    } else {
      // Dragon was bought
      dragon.owner = to;

      updateEtherSpentOnToken<Dragon>(dragon, event.transaction);
    }
  } else {
    dragon.owner = null;
  }

  dragon.save();
}

export function handleEggTransfer(event: EggTransferEvent): void {
  let to = event.params._to.toHex();
  let id = event.params._tokenId.toString();
  let egg = Egg.load(id) || new Egg(id);

  if (to != nullAddress) {
    initUser(to);

    if (egg.owner == null) {
      // Egg was born
      egg.owner = to;

      updateEtherSpentOnToken<Egg>(egg, event.transaction);
    } else if (egg.owner == event.transaction.from.toHex()) {
      // Regular transfer
      updateEtherSpentOnToken<Egg>(egg, event.transaction);

      egg.owner = to;
    } else {
      // Egg was bought
      egg.owner = to;

      updateEtherSpentOnToken<Egg>(egg, event.transaction);
    }
  } else {
    // Egg was hatched
    egg.owner = null;
  }

  egg.save();
}
