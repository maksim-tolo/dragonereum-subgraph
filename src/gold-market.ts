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
  const user = User.load(userId) || new User(userId);
  const goldAuction = new GoldAuction(auctionId);

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
  const user = User.load(userId);

  if (user && user.goldAuction) {
    const goldAuction = GoldAuction.load(user.goldAuction);

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
  const user = User.load(userId);

  if (user && user.goldAuction) {
    const goldAuction = new GoldAuction(user.goldAuction);

    if (goldAuction) {
      goldAuction.status = FulfilledAuctionStatus;
      goldAuction.ended = timestamp;
      goldAuction.buyer = buyer;
      goldAuction.purchaseAmount = amount;
      goldAuction.save();

      if (goldAuction.amount.notEqual(goldAuction.purchaseAmount)) {
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
  const seller = event.params.seller.toString();
  const goldAuctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  createGoldAuction(seller, goldAuctionId, SellGoldOrderType, event.params.price, event.params.amount, event.block.timestamp);
}

export function handleGoldSellOrderCancelled(
  event: GoldSellOrderCancelledEvent
): void {
  const seller = event.params.seller.toString();

  cancelGoldAuction(seller, event.block.timestamp);
}

export function handleGoldSold(event: GoldSoldEvent): void {
  const seller = event.params.seller.toString();
  const buyer = event.params.buyer.toString();
  const newAuctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  fulfillGoldAuction(seller, buyer, event.params.amount, newAuctionId, event.block.timestamp);
}

export function handleGoldBuyOrderCreated(
  event: GoldBuyOrderCreatedEvent
): void {
  const buyer = event.params.buyer.toString();
  const goldAuctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  createGoldAuction(buyer, goldAuctionId, BuyGoldOrderType, event.params.price, event.params.amount, event.block.timestamp);
}

export function handleGoldBuyOrderCancelled(
  event: GoldBuyOrderCancelledEvent
): void {
  const buyer = event.params.buyer.toString();

  cancelGoldAuction(buyer, event.block.timestamp);
}

export function handleGoldBought(event: GoldBoughtEvent): void {
  const seller = event.params.seller.toString();
  const buyer = event.params.buyer.toString();
  const newAuctionId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  fulfillGoldAuction(buyer, seller, event.params.amount, newAuctionId, event.block.timestamp);
}
