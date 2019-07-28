## Dapp
Subgraph integration is currently in progress.
The latest updates are available by the following url https://dragonereum-alpha-test.web.app/.

### Integration Progress
 - [x] `GOLD marketplace` page
 - [x] `Leaderboard` page
 - [ ] `My Dragons` page
 - [ ] `My Eggs` page
 - [x] `Dragon Details` page
 - [x] `Egg Details` page
 - [ ] `Dragons for sale` page
 - [ ] `Eggs for sale` page
 - [ ] `Dragons for breeding` page
 - [x] `Services` page
 - [ ] `Start battle` page
 - [ ] `Conducted battles` page
 - [ ] `Battle details` page
 - [ ] `Conducted gladiators battles` page
 - [ ] `Gladiator battle details` page
 - [ ] `Notifications`

## Queries
### Get eggs for sale
```graphql
query Auctions($first: Int!, $skip: Int!) {
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
query Auctions($first: Int!, $skip: Int!) {
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
      type
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
      remainingHealth
      remainingMana
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
      price
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
      type
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
  eggs(where: { isInNest: true }, orderBy: nestPlacementDate, orderDirection: asc) {
    id
  }
}
```
### Get dragons sorted by coolness
```graphql
query Dragons($first: Int!, $skip: Int!) {
  dragons(first: $first, skip: $skip, orderBy: coolness, orderDirection: desc) {
    id
    types
    genome
    birthDay
    generation
    coolness
    level
    auction {
      currency
      startPrice
      endPrice
      period
      created
      type
    }
    name
    owner {
      id
    }
  }
}
```
### Get peaceful skills for sale
```graphql
query DragonSpecialPeacefulSkills($first: Int!, $skip: Int!) {
  dragonSpecialPeacefulSkills(first: $first, skip: $skip, where: { price_not: null }, orderBy: usageDate) {
    skillClass
    cost
    effect
    usageDate
    price
    dragon {
      id
      types
      genome
      name
      owner {
        id
        name
      }
      healthAndMana {
        remainingHealth
        remainingMana
        maxHealth
        maxMana
        timestamp
      }
    }
  }
}
```
