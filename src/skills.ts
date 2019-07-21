import { Address, BigInt, EthereumTransaction } from '@graphprotocol/graph-ts';
import {
  SkillOnSale as SkillOnSaleEvent,
  SkillRemovedFromSale as SkillRemovedFromSaleEvent,
  SkillBought as SkillBoughtEvent,
  SkillSet as SkillSetEvent,
  SkillUsed as SkillUsedEvent,
} from '../generated/Events/Events';
import { Getter } from '../generated/Events/Getter';
import { Dragon, DragonSpecialPeacefulSkill } from '../generated/schema';
import { getterAddress } from './constants';
import { updateEtherSpentOnToken, updateHealthAndMana } from './helper';

function updateDragonBuffs(
  dragonId: BigInt,
  targetDragonId: BigInt,
  timestamp: BigInt,
  tx: EthereumTransaction,
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
      updateEtherSpentOnToken<Dragon>(targetDragon, tx);

      targetDragon.buffs = getter.getDragonBuffs(targetDragonId);
      targetDragon.save();
    }

    updateHealthAndMana(targetDragonId);
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

      updateEtherSpentOnToken<Dragon>(dragon, event.transaction);

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
    event.transaction,
  );
}

export function handleSkillBought(event: SkillBoughtEvent): void {
  updateDragonBuffs(
    event.params.id,
    event.params.target,
    event.block.timestamp,
    event.transaction,
  );
}
