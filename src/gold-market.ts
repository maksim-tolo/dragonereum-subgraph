import { BigInt } from '@graphprotocol/graph-ts';
import {
  GoldSellOrderCreated as GoldSellOrderCreatedEvent,
  GoldSellOrderCancelled as GoldSellOrderCancelledEvent,
  GoldSold as GoldSoldEvent,
  GoldBuyOrderCreated as GoldBuyOrderCreatedEvent,
  GoldBuyOrderCancelled as GoldBuyOrderCancelledEvent,
  GoldBought as GoldBoughtEvent,
} from '../generated/Events/Events';
import {
  User,
  GoldAuction,
} from '../generated/schema';
import {
  ActiveAuctionStatus,
  BuyGoldOrderType,
  CanceledAuctionStatus,
  FulfilledAuctionStatus,
  SellGoldOrderType,
} from './constants';

function getAuctionId(user: User | null, orderType: string): string | null {
  if (user == null) {
    return null;
  }

  return orderType == SellGoldOrderType ? user.goldSellOffer : user.goldBuyOffer;
}

function setAuctionId(user: User | null, orderType: string, value: string | null): void {
  if (user != null) {
    if (orderType == SellGoldOrderType) {
      user.goldSellOffer = value;
    } else {
      user.goldBuyOffer = value;
    }
  }
}

function createGoldAuction(userId: string, auctionId: string, orderType: string, price: BigInt, amount: BigInt, timestamp: BigInt): void {
  let user = User.load(userId) || new User(userId);
  let goldAuction = new GoldAuction(auctionId);

  goldAuction.type = orderType;
  goldAuction.status = ActiveAuctionStatus;
  goldAuction.seller = userId;
  goldAuction.price = price;
  goldAuction.amount = amount;
  goldAuction.created = timestamp;
  goldAuction.save();

  setAuctionId(user, orderType, auctionId);
  user.save();
}

function cancelGoldAuction(userId: string, timestamp: BigInt, orderType: string): void {
  let user = User.load(userId);

  if (user != null) {
    let auctionId = getAuctionId(user, orderType);

    if (auctionId != null) {
      let goldAuction = GoldAuction.load(auctionId);

      if (goldAuction != null) {
        goldAuction.status = CanceledAuctionStatus;
        goldAuction.ended = timestamp;
        goldAuction.save();
      }

      setAuctionId(user, orderType, null);
      user.save();
    }
  }
}

function fulfillGoldAuction(userId: string, buyer: string, amount: BigInt, newAuctionId: string, timestamp: BigInt, txHash: string, orderType: string): void {
  let user = User.load(userId);

  if (user != null) {
    let auctionId = getAuctionId(user, orderType);

    if (auctionId != null) {
      let goldAuction = GoldAuction.load(auctionId);

      if (goldAuction != null) {
        let restAmount = goldAuction.amount.minus(amount);

        goldAuction.status = FulfilledAuctionStatus;
        goldAuction.ended = timestamp;
        goldAuction.buyer = buyer;
        goldAuction.purchaseAmount = amount;
        goldAuction.txHash = txHash;
        goldAuction.save();

        if (restAmount.gt(BigInt.fromI32(0))) {
          createGoldAuction(userId, newAuctionId, orderType, goldAuction.price, restAmount, timestamp);
        } else {
          setAuctionId(user, orderType, null);
          user.save();
        }
      } else {
        setAuctionId(user, orderType, null);
        user.save();
      }
    }
  }
}

export function handleGoldSellOrderCreated(
  event: GoldSellOrderCreatedEvent
): void {
  let seller = event.params.seller.toHex();
  let goldAuctionId = event.transaction.hash.toHex() + '-' + event.logIndex.toString();

  createGoldAuction(seller, goldAuctionId, SellGoldOrderType, event.params.price, event.params.amount, event.block.timestamp);
}

export function handleGoldSellOrderCancelled(
  event: GoldSellOrderCancelledEvent
): void {
  let seller = event.params.seller.toHex();

  cancelGoldAuction(seller, event.block.timestamp, SellGoldOrderType);
}

export function handleGoldSold(event: GoldSoldEvent): void {
  let seller = event.params.seller.toHex();
  let buyer = event.params.buyer.toHex();
  let txHash = event.transaction.hash.toHex();
  let newAuctionId = txHash + '-' + event.logIndex.toString();

  fulfillGoldAuction(seller, buyer, event.params.amount, newAuctionId, event.block.timestamp, txHash, SellGoldOrderType);
}

export function handleGoldBuyOrderCreated(
  event: GoldBuyOrderCreatedEvent
): void {
  let buyer = event.params.buyer.toHex();
  let goldAuctionId = event.transaction.hash.toHex() + '-' + event.logIndex.toString();

  createGoldAuction(buyer, goldAuctionId, BuyGoldOrderType, event.params.price, event.params.amount, event.block.timestamp);
}

export function handleGoldBuyOrderCancelled(
  event: GoldBuyOrderCancelledEvent
): void {
  let buyer = event.params.buyer.toHex();

  cancelGoldAuction(buyer, event.block.timestamp, BuyGoldOrderType);
}

export function handleGoldBought(event: GoldBoughtEvent): void {
  let seller = event.params.seller.toHex();
  let buyer = event.params.buyer.toHex();
  let txHash = event.transaction.hash.toHex();
  let newAuctionId = txHash + '-' + event.logIndex.toString();

  fulfillGoldAuction(buyer, seller, event.params.amount, newAuctionId, event.block.timestamp, txHash, BuyGoldOrderType);
}
