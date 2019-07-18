import { User, UserBattlesStat } from '../generated/schema';

export function initUser(userId: string): User {
  let user = User.load(userId);

  if (user != null) {
    return user;
  }

  let userBattlesStat = new UserBattlesStat(userId);

  userBattlesStat.defeats = 0;
  userBattlesStat.wins = 0;
  userBattlesStat.save();

  user = new User(userId);
  user.battlesStat = userId; // Reference to UserBattlesStat
  user.save();

  return user;
}
