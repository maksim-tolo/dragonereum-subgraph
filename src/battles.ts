import { Address, BigInt } from '@graphprotocol/graph-ts';
import {
  BattleEnded as BattleEndedEvent,
  BattleHealthAndMana as BattleHealthAndManaEvent,
  BattleTacticsAndBuffs as BattleTacticsAndBuffsEvent,
  GladiatorBattleCreated as GladiatorBattleCreatedEvent,
  GladiatorBattleOpponentSelected as GladiatorBattleOpponentSelectedEvent,
  GladiatorBattleCancelled as GladiatorBattleCancelledEvent,
  GladiatorBattleEnded as GladiatorBattleEndedEvent,
} from '../generated/Events/Events';
import { Getter } from '../generated/Events/Getter';
import {
  Dragon,
  DragonBattlesStat,
  UserBattlesStat,
  Battle,
  DragonBattleSnapshot,
  GladiatorBattle,
  BattleHealthAndMana,
  DragonTactics,
} from '../generated/schema';
import {
  CanceledGladiatorBattleStatus,
  ConductedGladiatorBattleStatus,
  CreatedGladiatorBattleStatus,
  EtherCurrency,
  getterAddress,
  GoldCurrency,
  OpponentSelectedGladiatorBattleStatus,
} from './constants';
import {
  updateEtherSpentOnToken,
  updateHealthAndMana,
  updateDragonBaseSkills,
  updateSpecialBattleSkills,
} from './helper';

// TODO: Should be called on the previous block
function takeDragonSnapshot(dragonId: BigInt, snapshotId: string): void {
  let getter = Getter.bind(Address.fromString(getterAddress));
  let profile = getter.getDragonProfile(dragonId);
  let strength = getter.getDragonStrength(dragonId);
  let snapshot =
    DragonBattleSnapshot.load(snapshotId) ||
    new DragonBattleSnapshot(snapshotId);

  updateDragonBaseSkills(dragonId, snapshotId);
  updateSpecialBattleSkills(dragonId, snapshotId);

  snapshot.level = profile.value3;
  snapshot.coolness = profile.value7;
  snapshot.strength = strength;
  snapshot.healthAndMana = snapshotId; // Reference to BattleHealthAndMana
  snapshot.skills = snapshotId; // Reference to DragonSkills
  snapshot.tactics = snapshotId; // Reference to DragonTactics
  snapshot.specialAttack = snapshotId; // Reference to DragonSpecialAttack
  snapshot.specialDefense = snapshotId; // Reference to DragonSpecialDefense
  snapshot.save();
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
  let attackerSnapshotId = battleIdStr + '-battle-0';
  let defenderSnapshotId = battleIdStr + '-battle-1';

  takeDragonSnapshot(winnerId, attackerSnapshotId);
  takeDragonSnapshot(looserId, defenderSnapshotId);

  battle.seed = event.params.seed.toString();
  battle.winnerDragon = winnerIdStr;
  battle.looserDragon = looserIdStr;
  battle.attackerDragon = attackerIdStr;
  battle.defenderDragon =
    attackerIdStr == winnerIdStr ? looserIdStr : winnerIdStr;
  battle.date = event.params.date;
  battle.attackerDragonSnapshot = attackerSnapshotId;
  battle.defenderDragonSnapshot = defenderSnapshotId;
  battle.winnerDragonSnapshot =
    attackerIdStr == winnerIdStr ? attackerSnapshotId : defenderSnapshotId;
  battle.looserDragonSnapshot =
    attackerIdStr == looserIdStr ? attackerSnapshotId : defenderSnapshotId;

  if (event.params.isGladiator) {
    battle.gladiatorBattle = event.params.gladiatorBattleId.toString();
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
    winnerDragon.lastBattleDate = event.block.timestamp;
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
    looserDragon.lastBattleDate = event.block.timestamp;
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

export function handleBattleHealthAndMana(
  event: BattleHealthAndManaEvent,
): void {
  let battleId = event.params.battleId.toString();
  let attackerId = battleId + '-battle-0';
  let defenderId = battleId + '-battle-1';
  let attackerHealthAndMana = new BattleHealthAndMana(attackerId);
  let defenderHealthAndMana = new BattleHealthAndMana(defenderId);

  attackerHealthAndMana.initHealth = event.params.attackerInitHealth;
  attackerHealthAndMana.initMana = event.params.attackerInitMana;
  attackerHealthAndMana.maxHealth = event.params.attackerMaxHealth;
  attackerHealthAndMana.maxMana = event.params.attackerMaxMana;
  attackerHealthAndMana.save();

  defenderHealthAndMana.initHealth = event.params.opponentInitHealth;
  defenderHealthAndMana.initMana = event.params.opponentInitMana;
  defenderHealthAndMana.maxHealth = event.params.opponentMaxHealth;
  defenderHealthAndMana.maxMana = event.params.opponentMaxMana;
  defenderHealthAndMana.save();
}

export function handleBattleTacticsAndBuffs(
  event: BattleTacticsAndBuffsEvent,
): void {
  let battleId = event.params.battleId.toString();
  let attackerId = battleId + '-battle-0';
  let defenderId = battleId + '-battle-1';
  let attackerTactics = new DragonTactics(attackerId);
  let attackerSnapshot =
    DragonBattleSnapshot.load(attackerId) ||
    new DragonBattleSnapshot(attackerId);
  let defenderTactics = new DragonTactics(defenderId);
  let defenderSnapshot =
    DragonBattleSnapshot.load(defenderId) ||
    new DragonBattleSnapshot(defenderId);

  attackerTactics.melee = event.params.attackerMeleeChance;
  attackerTactics.attack = event.params.attackerAttackChance;
  attackerTactics.save();

  attackerSnapshot.buffs = event.params.attackerBuffs;
  attackerSnapshot.save();

  defenderTactics.melee = event.params.opponentMeleeChance;
  defenderTactics.attack = event.params.opponentAttackChance;
  defenderTactics.save();

  defenderSnapshot.buffs = event.params.opponentBuffs;
  defenderSnapshot.save();
}

export function handleGladiatorBattleCreated(
  event: GladiatorBattleCreatedEvent,
): void {
  let gladiatorBattleId = event.params.id.toString();
  let dragonId = event.params.dragonId.toString();
  let dragon = Dragon.load(dragonId);
  let gladiatorBattle = new GladiatorBattle(gladiatorBattleId);

  gladiatorBattle.status = CreatedGladiatorBattleStatus;
  gladiatorBattle.bet = event.params.bet;
  gladiatorBattle.currency = event.params.isGold ? GoldCurrency : EtherCurrency;
  gladiatorBattle.creatorDragon = dragonId;
  gladiatorBattle.applicantsDragons = [];
  gladiatorBattle.save();

  if (dragon != null) {
    dragon.gladiatorBattle = gladiatorBattleId;
    dragon.save();
  }
}

export function handleGladiatorBattleOpponentSelected(
  event: GladiatorBattleOpponentSelectedEvent,
): void {
  let gladiatorBattleId = event.params.id.toString();
  let dragonId = event.params.dragonId.toString();
  let dragon = Dragon.load(dragonId);
  let gladiatorBattle = GladiatorBattle.load(gladiatorBattleId);

  if (gladiatorBattle != null) {
    gladiatorBattle.status = OpponentSelectedGladiatorBattleStatus;
    gladiatorBattle.opponentDragon = dragonId;
    gladiatorBattle.save();
  }

  if (dragon != null) {
    dragon.gladiatorBattle = gladiatorBattleId;
    dragon.save();
  }
}

export function handleGladiatorBattleCancelled(
  event: GladiatorBattleCancelledEvent,
): void {
  let gladiatorBattleId = event.params.id.toString();
  let gladiatorBattle = GladiatorBattle.load(gladiatorBattleId);

  if (gladiatorBattle != null) {
    gladiatorBattle.status = CanceledGladiatorBattleStatus;
    gladiatorBattle.save();

    if (gladiatorBattle.creatorDragon != null) {
      let creatorDragon = Dragon.load(gladiatorBattle.creatorDragon);

      if (creatorDragon != null) {
        creatorDragon.gladiatorBattle = null;
        creatorDragon.save();
      }
    }

    if (gladiatorBattle.opponentDragon != null) {
      let opponentDragon = Dragon.load(gladiatorBattle.opponentDragon);

      if (opponentDragon != null) {
        opponentDragon.gladiatorBattle = null;
        opponentDragon.save();
      }
    }
  }
}

export function handleGladiatorBattleEnded(
  event: GladiatorBattleEndedEvent,
): void {
  let gladiatorBattleId = event.params.id.toString();
  let gladiatorBattle = GladiatorBattle.load(gladiatorBattleId);

  if (gladiatorBattle != null) {
    gladiatorBattle.status = ConductedGladiatorBattleStatus;
    gladiatorBattle.save();

    if (gladiatorBattle.creatorDragon != null) {
      let creatorDragon = Dragon.load(gladiatorBattle.creatorDragon);

      if (creatorDragon != null) {
        creatorDragon.gladiatorBattle = null;
        creatorDragon.save();
      }
    }

    if (gladiatorBattle.opponentDragon != null) {
      let opponentDragon = Dragon.load(gladiatorBattle.opponentDragon);

      if (opponentDragon != null) {
        opponentDragon.gladiatorBattle = null;
        opponentDragon.save();
      }
    }
  }
}
