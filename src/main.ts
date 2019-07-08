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
  BattleEnded as BattleEndedEvent,
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
  DragonSkills,
  DragonHealthAndMana,
} from '../generated/schema';
import { Getter } from '../generated/Events/Getter';
import { getterAddress, nullAddress } from './constants';

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
  egg.parents = eggDetails.value2.map<string>(id => id.toString());
  egg.momDragonTypes = eggDetails.value3;
  egg.dadDragonTypes = eggDetails.value4;
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
    egg.isInNest = true;
    egg.nestPlacementDate = event.block.timestamp;
    egg.save();
  }
}

export function handleEggHatched(event: EggHatchedEvent): void {
  let getter = Getter.bind(Address.fromString(getterAddress));
  let eggId = event.params.eggId.toString();
  let dragonId = event.params.dragonId.toString();
  let userId = event.params.user.toHex();
  let dragon = Dragon.load(dragonId) || new Dragon(dragonId);
  let tactics = DragonTactics.load(dragonId) || new DragonTactics(dragonId);
  let skills = DragonSkills.load(dragonId) || new DragonSkills(dragonId);
  let healthAndMana = DragonHealthAndMana.load(dragonId) || new DragonHealthAndMana(dragonId);
  let egg = Egg.load(eggId);
  let tacticsValue = getter.getDragonTactics(event.params.dragonId);
  let parents = getter.getDragonParents(event.params.dragonId);
  let profile = getter.getDragonProfile(event.params.dragonId);
  let types = getter.getDragonTypes(event.params.dragonId);
  let genome = getter.getDragonGenome(event.params.dragonId);
  let skillsValue = getter.getDragonSkills(event.params.dragonId);
  let healthAndManaValues = getter.getDragonHealthAndMana(event.params.dragonId);

  if (egg != null) {
    egg.isHatched = true;
    egg.isInNest = false;
    egg.hatchedDragon = dragonId;
    egg.owner = null;
    egg.save();
  }

  tactics.melee = tacticsValue.value0;
  tactics.attack = tacticsValue.value1;
  tactics.save();

  skills.attack = skillsValue.value0;
  skills.defense = skillsValue.value1;
  skills.stamina = skillsValue.value2;
  skills.speed = skillsValue.value3;
  skills.intelligence = skillsValue.value4;
  skills.save();

  healthAndMana.timestamp = healthAndManaValues.value0;
  healthAndMana.maxHealth = healthAndManaValues.value3;
  healthAndMana.maxMana = healthAndManaValues.value4;
  healthAndMana.save();

  dragon.name = profile.value0.toString();
  dragon.generation = profile.value1;
  dragon.birthDay = profile.value2;
  dragon.level = profile.value3;
  dragon.experience = profile.value4;
  dragon.dnaPoints = profile.value5;
  dragon.isBreedingAllowed = profile.value6;
  dragon.coolness = profile.value7;
  dragon.types = types;
  dragon.genome = genome;
  dragon.owner = userId;
  dragon.tactics = dragonId; // Reference to DragonTactics
  dragon.skills = dragonId; // Reference to DragonSkills
  dragon.healthAndMana = dragonId; // Reference to DragonHealthAndMana
  dragon.fromEgg = eggId;
  dragon.parents = parents.map<string>(id => id.toString());
  dragon.save();
}

export function handleDragonUpgraded(event: DragonUpgradedEvent): void {
  let id = event.params.id;
  let dragon = Dragon.load(id.toString());
  let skills = DragonSkills.load(id.toString());
  let healthAndMana = DragonHealthAndMana.load(id.toString());
  let getter = Getter.bind(Address.fromString(getterAddress));
  let profile = getter.getDragonProfile(id);
  let genome = getter.getDragonGenome(id);
  let skillsValue = getter.getDragonSkills(id);
  let healthAndManaValues = getter.getDragonHealthAndMana(id);

  if (dragon != null) {
    dragon.dnaPoints = profile.value5;
    dragon.isBreedingAllowed = profile.value6;
    dragon.coolness = profile.value7;
    dragon.genome = genome;
    dragon.save();
  }

  if (skills != null) {
    skills.attack = skillsValue.value0;
    skills.defense = skillsValue.value1;
    skills.stamina = skillsValue.value2;
    skills.speed = skillsValue.value3;
    skills.intelligence = skillsValue.value4;
    skills.save();
  }

  if (healthAndMana != null) {
    healthAndMana.timestamp = healthAndManaValues.value0;
    healthAndMana.maxHealth = healthAndManaValues.value3;
    healthAndMana.maxMana = healthAndManaValues.value4;
    healthAndMana.save();
  }
}

export function handleDragonNameSet(event: DragonNameSetEvent): void {
  let id = event.params.id.toString();
  let dragon = Dragon.load(id);

  if (dragon != null) {
    dragon.name = event.params.name.toString();
    dragon.save();
  }
}

export function handleDragonTacticsSet(event: DragonTacticsSetEvent): void {
  let id = event.params.id.toString();
  let tactics = DragonTactics.load(id);

  if (tactics != null) {
    tactics.melee = event.params.melee;
    tactics.attack = event.params.attack;
    tactics.save();
  }
}

export function handleUserNameSet(event: UserNameSetEvent): void {
  let id = event.params.user.toHex();
  let user = User.load(id) || new User(id);

  user.name = event.params.name.toString();
  user.save();
}

export function handleDragonTransfer(event: DragonTransferEvent): void {
  let to = event.params._to.toHex();
  let id = event.params._tokenId.toString();
  let dragon = Dragon.load(id) || new Dragon(id);

  if (to != nullAddress) {
    let user = User.load(to) || new User(to);

    user.save();
    dragon.owner = to;
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
    let user = User.load(to) || new User(to);

    user.save();
    egg.owner = to;
  } else {
    egg.owner = null;
  }

  egg.save();
}

export function handleBattleEnded(event: BattleEndedEvent): void {
  let getter = Getter.bind(Address.fromString(getterAddress));
  let winnerId = event.params.winnerId;
  let winnerIdStr = winnerId.toString();
  let winnerDragon = Dragon.load(winnerIdStr);
  let looserId = event.params.looserId;
  let looserIdStr = looserId.toString();
  let looserDragon = Dragon.load(looserIdStr);

  if (winnerDragon != null) {
    let profile = getter.getDragonProfile(winnerId);
    let healthAndMana = DragonHealthAndMana.load(winnerIdStr);
    let healthAndManaValues = getter.getDragonHealthAndMana(winnerId);

    winnerDragon.level = profile.value3;
    winnerDragon.experience = profile.value4;
    winnerDragon.dnaPoints = profile.value5;
    winnerDragon.isBreedingAllowed = profile.value6;
    winnerDragon.save();

    if (healthAndMana != null) {
      healthAndMana.timestamp = healthAndManaValues.value0;
      healthAndMana.save();
    }
  }

  if (looserDragon != null) {
    let healthAndMana = DragonHealthAndMana.load(looserIdStr);
    let healthAndManaValues = getter.getDragonHealthAndMana(looserId);

    if (healthAndMana != null) {
      healthAndMana.timestamp = healthAndManaValues.value0;
      healthAndMana.save();
    }
  }
}
