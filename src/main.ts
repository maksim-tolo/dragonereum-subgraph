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
  SkillSet as SkillSetEvent,
  SkillUsed as SkillUsedEvent,
  SkillBought as SkillBoughtEvent,
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
  DragonBattlesStat,
  DragonSpecialAttack,
  DragonSpecialDefense,
  DragonSpecialPeacefulSkill,
} from '../generated/schema';
import { Getter } from '../generated/Events/Getter';
import { getterAddress, nullAddress } from './constants';

function updateHealthAndMana(dragonId: BigInt): void {
  let dragonIdStr = dragonId.toString();
  let getter = Getter.bind(Address.fromString(getterAddress));
  let healthAndMana =
    DragonHealthAndMana.load(dragonIdStr) ||
    new DragonHealthAndMana(dragonIdStr);
  let healthAndManaValues = getter.getDragonHealthAndMana(dragonId);

  healthAndMana.timestamp = healthAndManaValues.value0;
  healthAndMana.maxHealth = healthAndManaValues.value3;
  healthAndMana.maxMana = healthAndManaValues.value4;
  healthAndMana.save();
}

function updateSpecialBattleSkills(dragonId: BigInt): void {
  let dragonIdStr = dragonId.toString();
  let getter = Getter.bind(Address.fromString(getterAddress));
  let specialAttack =
    DragonSpecialAttack.load(dragonIdStr) ||
    new DragonSpecialAttack(dragonIdStr);
  let specialDefense =
    DragonSpecialDefense.load(dragonIdStr) ||
    new DragonSpecialDefense(dragonIdStr);
  let specialAttackValue = getter.getDragonSpecialAttack(dragonId);
  let specialDefenseValue = getter.getDragonSpecialDefense(dragonId);

  specialAttack.dragonType = specialAttackValue.value0;
  specialAttack.cost = specialAttackValue.value1;
  specialAttack.factor = specialAttackValue.value2;
  specialAttack.chance = specialAttackValue.value3;
  specialAttack.save();

  specialDefense.dragonType = specialDefenseValue.value0;
  specialDefense.cost = specialDefenseValue.value1;
  specialDefense.factor = specialDefenseValue.value2;
  specialDefense.chance = specialDefenseValue.value3;
  specialDefense.save();
}

function updateDragonSkills(dragonId: BigInt): void {
  let dragonIdStr = dragonId.toString();
  let getter = Getter.bind(Address.fromString(getterAddress));
  let skills = DragonSkills.load(dragonIdStr) || new DragonSkills(dragonIdStr);
  let skillsValue = getter.getDragonSkills(dragonId);

  skills.attack = skillsValue.value0;
  skills.defense = skillsValue.value1;
  skills.stamina = skillsValue.value2;
  skills.speed = skillsValue.value3;
  skills.intelligence = skillsValue.value4;
  skills.save();

  updateSpecialBattleSkills(dragonId);
  updateHealthAndMana(dragonId);
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

function updateDragonBuffs(
  dragonId: BigInt,
  targetDragonId: BigInt,
  timestamp: BigInt,
): void {
  let getter = Getter.bind(Address.fromString(getterAddress));
  let dragonIdStr = dragonId.toString();
  let targetDragonIdStr = targetDragonId.toString();
  let dragon = Dragon.load(dragonIdStr);
  let specialPeacefulSkill = DragonSpecialPeacefulSkill.load(dragonIdStr);

  if (specialPeacefulSkill != null) {
    specialPeacefulSkill.usageDate = timestamp;
    specialPeacefulSkill.save();
  }

  if (dragon != null) {
    dragon.buffs = getter.getDragonBuffs(dragonId);
    dragon.save();
  }

  updateHealthAndMana(dragonId);

  if (targetDragonIdStr != dragonIdStr) {
    let targetDragon = Dragon.load(targetDragonIdStr);

    if (targetDragon != null) {
      targetDragon.buffs = getter.getDragonBuffs(targetDragonId);
      targetDragon.save();
    }

    updateHealthAndMana(targetDragonId);
  }
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
  let dragonId = event.params.dragonId;
  let dragonIdStr = dragonId.toString();
  let userId = event.params.user.toHex();
  let dragon = Dragon.load(dragonIdStr) || new Dragon(dragonIdStr);
  let tactics =
    DragonTactics.load(dragonIdStr) || new DragonTactics(dragonIdStr);
  let battlesStat =
    DragonBattlesStat.load(dragonIdStr) || new DragonBattlesStat(dragonIdStr);

  let egg = Egg.load(eggId);
  let tacticsValue = getter.getDragonTactics(dragonId);
  let parents = getter.getDragonParents(dragonId);
  let profile = getter.getDragonProfile(dragonId);
  let types = getter.getDragonTypes(dragonId);
  let genome = getter.getDragonGenome(dragonId);
  let buffs = getter.getDragonBuffs(dragonId);
  let strength = getter.getDragonStrength(dragonId);

  if (egg != null) {
    egg.isHatched = true;
    egg.isInNest = false;
    egg.hatchedDragon = dragonIdStr;
    egg.owner = null;
    egg.save();
  }

  tactics.melee = tacticsValue.value0;
  tactics.attack = tacticsValue.value1;
  tactics.save();

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
    dragon.dnaPoints = profile.value5;
    dragon.isBreedingAllowed = profile.value6;
    dragon.coolness = profile.value7;
    dragon.genome = genome;
    dragon.strength = strength;
    dragon.save();
  }

  updateDragonSkills(id);
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
    let battlesStat = DragonBattlesStat.load(winnerIdStr);
    let buffs = getter.getDragonBuffs(winnerId);

    winnerDragon.level = profile.value3;
    winnerDragon.experience = profile.value4;
    winnerDragon.dnaPoints = profile.value5;
    winnerDragon.isBreedingAllowed = profile.value6;
    winnerDragon.buffs = buffs;
    winnerDragon.save();

    updateHealthAndMana(winnerId);

    if (battlesStat != null) {
      battlesStat.wins = battlesStat.wins + 1;
      battlesStat.save();
    }
  }

  if (looserDragon != null) {
    let battlesStat = DragonBattlesStat.load(looserIdStr);
    let buffs = getter.getDragonBuffs(looserId);

    looserDragon.buffs = buffs;
    looserDragon.save();

    updateHealthAndMana(looserId);

    if (battlesStat != null) {
      battlesStat.defeats = battlesStat.defeats + 1;
      battlesStat.save();
    }
  }
}

export function handleSkillSet(event: SkillSetEvent): void {
  let getter = Getter.bind(Address.fromString(getterAddress));
  let dragonId = event.params.id;
  let dragonIdStr = dragonId.toString();
  let dragon = Dragon.load(dragonIdStr);

  if (dragon != null) {
    let peacefulSkill = getter.getDragonSpecialPeacefulSkill(dragonId);
    let skillClass = peacefulSkill.value0;

    if (skillClass != null && skillClass != 0) {
      let specialPeacefulSkill =
        DragonSpecialPeacefulSkill.load(dragonIdStr) ||
        new DragonSpecialPeacefulSkill(dragonIdStr);

      specialPeacefulSkill.skillClass = skillClass;
      specialPeacefulSkill.cost = peacefulSkill.value1;
      specialPeacefulSkill.effect = peacefulSkill.value2;
      specialPeacefulSkill.save();

      dragon.specialPeacefulSkill = dragonIdStr; // Reference to DragonSpecialPeacefulSkill
      dragon.save();
    }
  }
}

export function handleSkillUsed(event: SkillUsedEvent): void {
  updateDragonBuffs(
    event.params.id,
    event.params.target,
    event.block.timestamp,
  );
}

export function handleSkillBought(event: SkillBoughtEvent): void {
  updateDragonBuffs(
    event.params.id,
    event.params.target,
    event.block.timestamp,
  );
}
