## Dapp
Subgraph integration is currently in progress.
The latest updates are available by the following url https://dragonereum-alpha-test.web.app/.
Subgraph has been added only to the gold marketplace at the moment.
## Queries
### Get eggs for sale
```graphql
query Auction($first: Int!, $skip: Int!) {
  auctions(first: $first, skip: $skip, where: { status: active, type: eggSale }) {
    currency
    startPrice
    endPrice
    period
    created
    egg {
      id
      generation
      coolness
      momDragonTypes
      dadDragonTypes
    }
  }
}
```
### Get dragons for sale
```graphql
query Auction($first: Int!, $skip: Int!) {
  auctions(first: $first, skip: $skip, where: { status: active, type: dragonSale }) {
    currency
    startPrice
    endPrice
    period
    created
    dragon {
      id
      name
      types
      coolness
      level
      generation
      skills {
        attack
        defense
        stamina
        speed
        intelligence
      }
    }
  }
}
```
### Get dragons for breeding
```graphql
query Auction($first: Int!, $skip: Int!) {
  auctions(first: $first, skip: $skip, where: { status: active, type: dragonBreeding }) {
    currency
    startPrice
    endPrice
    period
    created
    dragon {
      id
      name
      types
      coolness
      level
      generation
      skills {
        attack
        defense
        stamina
        speed
        intelligence
      }
    }
  }
}
```
### Get gold selling orders
```graphql
query GoldAuctions($first: Int!, $skip: Int!) {
  goldAuctions(first: $first, skip: $skip, where: { status: active, type: sell }, orderBy: price, orderDirection: asc) {
    id
    seller {
      id
    }
    price
    amount
    created
  }
}
```
### Get gold buying orders
```graphql
query GoldAuctions($first: Int!, $skip: Int!) {
  goldAuctions(first: $first, skip: $skip, where: { status: active, type: buy }, orderBy: price, orderDirection: desc) {
    id
    seller {
      id
    }
    price
    amount
    created
  }
}
```
### Get gold selling history
```graphql
query GoldAuctions($first: Int!, $skip: Int!) {
  goldAuctions(first: $first, skip: $skip, where: { status: fulfilled, type: sell }, orderBy: ended, orderDirection: desc) {
    price
    purchaseAmount
    ended
    txHash
  }
}
```
### Get gold buying history
```graphql
query GoldAuctions($first: Int!, $skip: Int!) {
  goldAuctions(first: $first, skip: $skip, where: { status: fulfilled, type: buy }, orderBy: ended, orderDirection: desc) {
    price
    purchaseAmount
    ended
    txHash
  }
}
```
### Get dragon details
```graphql
query Dragon($id: ID!) {
  dragon(id: $id) {
    id
    owner {
      id
      name
    }
    types
    genome
    skills {
      attack
      defense
      stamina
      speed
      intelligence
    }
    birthDay
    generation
    experience
    dnaPoints
    coolness
    isBreedingAllowed
    level
    tactics {
      attack
      melee
    }
    auction {
      currency
      startPrice
      endPrice
      period
      created
    }
    name
    parents {
      id
      types
      genome
    }
    dragonsChildren {
      id
      types
      genome
    }
    eggsChildren {
      id
      isHatched
      momDragonTypes
      dadDragonTypes
    }
    healthAndMana {
      maxHealth
      maxMana
      timestamp
    }
    battlesStat {
      wins
      defeats
    }
    specialAttack {
      dragonType
      cost
      factor
      chance
    }
    specialDefense {
      dragonType
      cost
      factor
      chance
    }
    specialPeacefulSkill {
      skillClass
      cost
      effect
      usageDate
    }
    buffs
    strength
  }
}
```
### Get egg details
```graphql
query Egg($id: ID!) {
  egg(id: $id) {
    id
    owner {
      id
      name
    }
    birthDay
    isInNest
    nestPlacementDate
    isHatched
    auction {
      currency
      startPrice
      endPrice
      period
      created
    }
    generation
    coolness
    parents {
      id
      types
      genome
    }
    momDragonTypes
    dadDragonTypes
  }
}
```
