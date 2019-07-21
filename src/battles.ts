import { Address, BigInt } from '@graphprotocol/graph-ts';
import { BattleEnded as BattleEndedEvent } from '../generated/Events/Events';
import { Getter } from '../generated/Events/Getter';
import {
  Dragon,
  DragonBattlesStat,
  UserBattlesStat,
  Battle,
  DragonBattleSnapshot,
} from '../generated/schema';
import { getterAddress } from './constants';
import {
  updateEtherSpentOnToken,
  updateDragonSkills,
  updateHealthAndMana,
  updateTactics,
} from './helper';

// TODO: Should be called on the previous block
function takeDragonSnapshot(dragonId: BigInt, battleId: BigInt): string {
  let getter = Getter.bind(Address.fromString(getterAddress));
  let dragonIdStr = dragonId.toString();
  let battleIdStr = battleId.toString();
  let snapshotId = dragonIdStr + '-' + battleIdStr;
  let profile = getter.getDragonProfile(dragonId);
  let buffs = getter.getDragonBuffs(dragonId);
  let strength = getter.getDragonStrength(dragonId);
  let snapshot = new DragonBattleSnapshot(snapshotId);

  updateTactics(dragonId, snapshotId);
  updateDragonSkills(dragonId, snapshotId);

  snapshot.level = profile.value3;
  snapshot.coolness = profile.value7;
  snapshot.buffs = buffs;
  snapshot.strength = strength;
  snapshot.healthAndMana = snapshotId; // Reference to DragonHealthAndMana
  snapshot.skills = snapshotId; // Reference to DragonSkills
  snapshot.tactics = snapshotId; // Reference to DragonTactics
  snapshot.specialAttack = snapshotId; // Reference to DragonSpecialAttack
  snapshot.specialDefense = snapshotId; // Reference to DragonSpecialDefense
  snapshot.save();

  return snapshotId;
}

export function handleBattleEnded(event: BattleEndedEvent): void {
  let getter = Getter.bind(Address.fromString(getterAddress));
  let winnerId = event.params.winnerId;
  let winnerIdStr = winnerId.toString();
  let winnerDragon = Dragon.load(winnerIdStr);
  let looserId = event.params.looserId;
  let looserIdStr = looserId.toString();
  let looserDragon = Dragon.load(looserIdStr);
  let attackerId = event.params.attackerId;
  let attackerIdStr = attackerId.toString();
  let battleId = event.params.battleId;
  let battleIdStr = battleId.toString();
  let battle = new Battle(battleIdStr);

  battle.seed = event.params.seed.toString();
  battle.winnerDragon = winnerIdStr;
  battle.looserDragon = looserIdStr;
  battle.attackerDragon = attackerIdStr;
  battle.defenderDragon =
    attackerIdStr == winnerIdStr ? looserIdStr : winnerIdStr;
  battle.date = event.params.date;
  battle.winnerDragonSnapshot = takeDragonSnapshot(winnerId, battleId);
  battle.looserDragonSnapshot = takeDragonSnapshot(looserId, battleId);

  if (event.params.isGladiator) {
    battle.gladiatorsBattleId = event.params.gladiatorBattleId.toString();
  }

  if (winnerDragon != null) {
    let profile = getter.getDragonProfile(winnerId);
    let battlesStat = DragonBattlesStat.load(winnerIdStr);
    let buffs = getter.getDragonBuffs(winnerId);

    if (winnerDragon.owner != null) {
      battle.winnerUser = winnerDragon.owner;
    }

    if (winnerId.equals(attackerId)) {
      updateEtherSpentOnToken<Dragon>(winnerDragon, event.transaction);
    }

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

    if (winnerDragon.owner != null) {
      let winnerUserStat = UserBattlesStat.load(winnerDragon.owner);

      if (winnerUserStat != null) {
        winnerUserStat.wins = winnerUserStat.wins + 1;
        winnerUserStat.save();
      }
    }
  }

  if (looserDragon != null) {
    let battlesStat = DragonBattlesStat.load(looserIdStr);
    let buffs = getter.getDragonBuffs(looserId);

    if (looserDragon.owner != null) {
      battle.looserUser = looserDragon.owner;
    }

    if (looserId.equals(attackerId)) {
      updateEtherSpentOnToken<Dragon>(looserDragon, event.transaction);
    }

    looserDragon.buffs = buffs;
    looserDragon.save();

    updateHealthAndMana(looserId);

    if (battlesStat != null) {
      battlesStat.defeats = battlesStat.defeats + 1;
      battlesStat.save();
    }

    if (looserDragon.owner != null) {
      let looserUserStat = UserBattlesStat.load(looserDragon.owner);

      if (looserUserStat != null) {
        looserUserStat.defeats = looserUserStat.defeats + 1;
        looserUserStat.save();
      }
    }
  }

  battle.save();
}
