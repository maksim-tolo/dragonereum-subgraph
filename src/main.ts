/**
 * TODO: Add DistributionUpdated event
 */
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
import {
  Dragon,
  Egg,
  User,
  DragonTactics,
} from '../generated/schema';
import { Getter } from '../generated/Events/Getter';
import { getterAddress } from './constants';

// TODO: Add default value and add egg to owner
function createEgg(id: string, owner: string): void {
  const egg = new Egg(id);

  egg.owner = owner;
  egg.isInNest = false;
  egg.isHatched = false;

  egg.save();
}

export function handleEggClaimed(event: EggClaimedEvent): void {
  createEgg(event.params.id.toString(), event.params.user.toString());
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
  const getter = Getter.bind(getterAddress);
  const eggId = event.params.eggId.toString();
  const dragonId = event.params.dragonId.toString();
  const userId = event.params.user.toString();
  const dragon = new Dragon(dragonId);
  const tactics = new DragonTactics(dragonId);
  const egg = Egg.load(eggId);
  const {
    value0: melee,
    value1: attack,
  } = getter.getDragonTactics(event.params.dragonId);

  if (egg) {
    egg.isHatched = true;
    egg.save();
  }

  tactics.melee = melee;
  tactics.attack = attack;
  tactics.save();

  dragon.owner = userId;
  dragon.tactics = dragonId;
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
  createEgg(event.params.id.toString(), event.params.user.toString());
}

export function handleDragonNameSet(event: DragonNameSetEvent): void {
  const id = event.params.id.toString();
  const dragon = Dragon.load(id);

  dragon.name = event.params.name;
  dragon.save();
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
  const id = event.params.user.toString();
  const user = User.load(id) || new User(id);

  user.name = event.params.name;
  user.save();
}
