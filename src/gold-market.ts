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

  user.goldAuction = auctionId;
  user.save();
}

function cancelGoldAuction(userId: string, timestamp: BigInt): void {
  let user = User.load(userId);

  if (user && user.goldAuction) {
    let goldAuction = GoldAuction.load(user.goldAuction);

    if (goldAuction) {
      goldAuction.status = CanceledAuctionStatus;
      goldAuction.ended = timestamp;
      goldAuction.save();
    }

    user.goldAuction = null;
    user.save();
  }
}

function fulfillGoldAuction(userId: string, buyer: string, amount: BigInt, newAuctionId: string, timestamp: BigInt): void {
  let user = User.load(userId);

  if (user && user.goldAuction) {
    let goldAuction = new GoldAuction(user.goldAuction);

    if (goldAuction) {
      goldAuction.status = FulfilledAuctionStatus;
      goldAuction.ended = timestamp;
      goldAuction.buyer = buyer;
      goldAuction.purchaseAmount = amount;
      goldAuction.save();

      if (goldAuction.amount.notEqual(amount)) {
        createGoldAuction(userId, newAuctionId, goldAuction.type, goldAuction.price, goldAuction.amount.minus(goldAuction.purchaseAmount), timestamp)
      } else {
        user.goldAuction = null;
        user.save();
      }
    } else {
      user.goldAuction = null;
      user.save();
    }
  }
}

export function handleGoldSellOrderCreated(
  event: GoldSellOrderCreatedEvent
): void {
  let seller = event.params.seller.toHex();
  let goldAuctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  createGoldAuction(seller, goldAuctionId, SellGoldOrderType, event.params.price, event.params.amount, event.block.timestamp);
}

export function handleGoldSellOrderCancelled(
  event: GoldSellOrderCancelledEvent
): void {
  let seller = event.params.seller.toHex();

  cancelGoldAuction(seller, event.block.timestamp);
}

export function handleGoldSold(event: GoldSoldEvent): void {
  let seller = event.params.seller.toHex();
  let buyer = event.params.buyer.toHex();
  let newAuctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  fulfillGoldAuction(seller, buyer, event.params.amount, newAuctionId, event.block.timestamp);
}

export function handleGoldBuyOrderCreated(
  event: GoldBuyOrderCreatedEvent
): void {
  let buyer = event.params.buyer.toHex();
  let goldAuctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  createGoldAuction(buyer, goldAuctionId, BuyGoldOrderType, event.params.price, event.params.amount, event.block.timestamp);
}

export function handleGoldBuyOrderCancelled(
  event: GoldBuyOrderCancelledEvent
): void {
  let buyer = event.params.buyer.toHex();

  cancelGoldAuction(buyer, event.block.timestamp);
}

export function handleGoldBought(event: GoldBoughtEvent): void {
  let seller = event.params.seller.toHex();
  let buyer = event.params.buyer.toHex();
  let newAuctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  fulfillGoldAuction(buyer, seller, event.params.amount, newAuctionId, event.block.timestamp);
}
