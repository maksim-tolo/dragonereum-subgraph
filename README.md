## Queries
### Get eggs for sale
```graphql
{
  auctions(where: {status: active, type: eggSale}) {
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
{
  auctions(where: {status: active, type: dragonSale}) {
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
{
  auctions(where: {status: active, type: dragonBreeding}) {
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
{
  goldAuctions(where: {status: active, type: sell}) {
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
{
  goldAuctions(where: {status: active, type: buy}) {
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
### Get dragon details
```graphql
{
  dragon(id: "2551") {
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
  }
}
```
