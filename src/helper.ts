import { Address, BigInt, EthereumTransaction } from '@graphprotocol/graph-ts';
import {
  DragonHealthAndMana,
  DragonSkills,
  DragonSpecialAttack,
  DragonSpecialDefense,
  DragonTactics,
  User,
  UserBattlesStat,
} from '../generated/schema';
import { Getter } from '../generated/Events/Getter';
import { getterAddress } from './constants';

// Egg or Dragon
export interface ERC721Token {
  id: string;
  owner: string | null;
  auction: string | null;
  etherSpent: BigInt | null;
  generation: i32;
  coolness: BigInt;
  parsedTypes: string[];
  save: Function;
}

export function initUser(userId: string): User {
  let user = User.load(userId);

  if (user == null) {
    let userBattlesStat = new UserBattlesStat(userId);

    userBattlesStat.defeats = 0;
    userBattlesStat.wins = 0;
    userBattlesStat.save();

    user = new User(userId);
    user.battlesStat = userId; // Reference to UserBattlesStat
    user.save();
  }

  return user as User;
}

export function getTxCost(tx: EthereumTransaction): BigInt {
  return tx.gasPrice.times(tx.gasUsed);
}

export function updateEtherSpentOnToken<T extends ERC721Token>(
  token: T | null,
  tx: EthereumTransaction,
): void {
  if (token != null && token.owner != null && token.owner == tx.from.toHex()) {
    if (token.etherSpent == null) {
      token.etherSpent = getTxCost(tx);
    } else {
      token.etherSpent = token.etherSpent.plus(getTxCost(tx));
    }
  }
}

export function updateTactics(
  dragonId: BigInt,
  tacticsId: string | null = null,
): void {
  let tacticsIdStr = tacticsId || dragonId.toString();
  let getter = Getter.bind(Address.fromString(getterAddress));
  let tactics =
    DragonTactics.load(tacticsIdStr) || new DragonTactics(tacticsIdStr);
  let tacticsValue = getter.getDragonTactics(dragonId);

  tactics.melee = tacticsValue.value0;
  tactics.attack = tacticsValue.value1;
  tactics.save();
}

export function updateHealthAndMana(
  dragonId: BigInt,
  healthAndManaId: string | null = null,
): void {
  let healthAndManaIdStr = healthAndManaId || dragonId.toString();
  let getter = Getter.bind(Address.fromString(getterAddress));
  let healthAndMana =
    DragonHealthAndMana.load(healthAndManaIdStr) ||
    new DragonHealthAndMana(healthAndManaIdStr);
  let healthAndManaValues = getter.getDragonHealthAndMana(dragonId);

  healthAndMana.timestamp = healthAndManaValues.value0;
  healthAndMana.remainingHealth = healthAndManaValues.value1;
  healthAndMana.remainingMana = healthAndManaValues.value2;
  healthAndMana.maxHealth = healthAndManaValues.value3;
  healthAndMana.maxMana = healthAndManaValues.value4;
  healthAndMana.save();
}

export function updateSpecialBattleSkills(
  dragonId: BigInt,
  skillsId: string | null = null,
): void {
  let skillsIdStr = skillsId || dragonId.toString();
  let getter = Getter.bind(Address.fromString(getterAddress));
  let specialAttack =
    DragonSpecialAttack.load(skillsIdStr) ||
    new DragonSpecialAttack(skillsIdStr);
  let specialDefense =
    DragonSpecialDefense.load(skillsIdStr) ||
    new DragonSpecialDefense(skillsIdStr);
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

export function updateDragonSkills(
  dragonId: BigInt,
  skillsId: string | null = null,
): void {
  let skillsIdStr = skillsId || dragonId.toString();
  let getter = Getter.bind(Address.fromString(getterAddress));
  let skills = DragonSkills.load(skillsIdStr) || new DragonSkills(skillsIdStr);
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

// TODO: Remove
export function parseDragonTypes(types: i32[]): string[] {
  let result: string[] = [];
  let length: i32 = types.length;
  let dragonTypes: string[] = ['water', 'fire', 'air', 'earth', 'magic'];

  for (let i: i32 = 0; i < length; i++) {
    if (types[i] != 0 && dragonTypes[i] != null) {
      result.push(dragonTypes[i]);
    }
  }

  return result;
}
