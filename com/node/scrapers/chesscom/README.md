# Scraper - Chess.com

[![](https://images.microbadger.com/badges/image/yusufali/chess_chesscom.svg)](https://microbadger.com/images/yusufali/chess_chesscom "Get your own image badge on microbadger.com")
[![](https://images.microbadger.com/badges/version/yusufali/chess_chesscom.svg)](https://microbadger.com/images/yusufali/chess_chesscom "Get your own version badge on microbadger.com")

Scrapes chess.com games and stores the games into the database.

## Task Definition

```
{
  name: 'chesscom'.
  params: {
    username: <string>,  // username on chess.com to scrape
    alias?  : <string>,  // name to alias the username with. 
                         // useful for multiple chess.com profiles
  },
}
```