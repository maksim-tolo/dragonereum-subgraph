import { User, UserBattlesStat } from '../generated/schema';
import { BigInt, EthereumTransaction } from '@graphprotocol/graph-ts/index';

// Egg or Dragon
export interface ERC721Token {
  id: string;
  owner: string | null;
  auction: string | null;
  etherSpent: BigInt | null;
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
