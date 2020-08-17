# Database Microservice

[![](https://images.microbadger.com/badges/image/yusufali/chess_dbapi.svg)](https://microbadger.com/images/yusufali/chess_dbapi "Get your own image badge on microbadger.com")
[![](https://images.microbadger.com/badges/version/yusufali/chess_dbapi.svg)](https://microbadger.com/images/yusufali/chess_dbapi "Get your own version badge on microbadger.com")

Provides an abstraction over the database engine to allow for easy hot-swapping of storage engines without issue.

## Interface

Accepts JSON with the following structure:

```
model: <string>,
method: <string>,
methodData: <mixed>
```

## Model: match

**method: metadata** 
```
  { operation: add, matchid, metadata: {...} }
  { operation: delete, matchid, metadataid }
```

**method: move** 
```
  { operation: add, matchid, move: {...} }
  { operation: delete, matchid, moveid }
```

**method: annotation** 
```
  { operation: add, matchid, moveid, annotation: {...} }
  { operation: delete, matchid, moveid, annotationid }
```

**method: add** 
```
  { ...match }
```

**method: delete** 
```
  matchid
```

**method: find** 
```
  { ...query }
```

**method: findPosition** 
```
  { position: <fen>, ...query }
  fen
```

**method: getRepertoire** 
```
  { color: (white|black), user }
```

**method: noAnnotations** 
```
  version
```