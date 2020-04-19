import {Injectable} from '@angular/core';
import {AssetLoaderService} from './asset-loader.service';
import {GameBoardTile} from '../classes/game-board-tile';
import {GameBoardTileType} from '../enums/game-board-tile-type.enum';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameBoardGeneratorService {

  public constructor(
    private assetLoaderService: AssetLoaderService
  ) { }
  private mountainsOccuranceFactor = 0.05;

  private assetPrefix = 'terrain-';
  private tilesArray: any[];
  private landTilesArray: GameBoardTile[] = [];
  private generatedLandTiles: BehaviorSubject<GameBoardTile[]> = new BehaviorSubject(this.landTilesArray);

  // surrounding tiles vertices
  private aUp = new BABYLON.Vector2(-1, 1);
  private cUp = new BABYLON.Vector2(1, 1);
  private dUp = new BABYLON.Vector2(1, 0);
  private fUp = new BABYLON.Vector2(-1, 0);

  private aDown = new BABYLON.Vector2(-1, 0);
  private cDown = new BABYLON.Vector2(1, 0);
  private dDown = new BABYLON.Vector2(1, -1);
  private fDown = new BABYLON.Vector2(-1, -1);

  private b = new BABYLON.Vector2(0, 1);
  private e = new BABYLON.Vector2(0, -1);

  private surroundingTilesVectorsUp = [this.aUp, this.b, this.cUp, this.dUp, this.e, this.fUp];
  private surroundingTilesVectorsDown = [this.aDown, this.b, this.cDown, this.dDown, this.e, this.fDown];

  private surroundingTileNames = ['A', 'B', 'C', 'D', 'E', 'F'];


  private static changeTypeOfTiles(tiles: GameBoardTile[], type: GameBoardTileType) {
    for (const tile of tiles) {
      tile.type = type;
    }
  }

  // input
  // tile: tile to check surrounding
  // range: how many levels away from the center we will search
  private  checkSurroundingTilesForType(tile: GameBoardTile, typeArray: GameBoardTileType[], range, tileMemory: GameBoardTile[]) {
    // stop if the tile doesnt have a defined surrounding
    if (tile.surroundingTiles && tile.surroundingTiles.length === 6) {
      for (const surroundingTile of tile.surroundingTiles) {
        // check if new should check one level further from the center
        if (range > 0) {
          // recursive, go one level deeper
          if (this.checkSurroundingTilesForType(surroundingTile, typeArray, (range - 1), tileMemory)) {
            // found an unsuitable tile, break
            return true;
          }
        }
        // check if the surrounding tile is of the specified types we dont want
        if (typeArray.includes(surroundingTile.type)) {
          // console.log('not suitable tile detected');
          return true;
        }
      }
      // check if tile already saved
      const filtered = tileMemory.filter(existingTile => existingTile.name === tile.name );
      if ( filtered.length === 0) {
        // everything is ok, tile seems suited, lets save this tile
        tileMemory.push(tile);
      }
      return false;
    } else {
      // console.log('not suitable tile detected');
      return true;
    }

  }

  public subscribeToGeneratedGameBoardLandTiles() {
    return this.generatedLandTiles;
  }

  public init() {
    this.tilesArray = [];
    const textures = this.assetLoaderService.loadTexturesOfCategory(this.assetPrefix);
    this.buildTilesArray(textures);
    this.generatedLandTiles.next(this.landTilesArray);
  }

  private buildTilesArray(terrainTextures) {
    terrainTextures.forEach(terrainTexture => {
      const rowLength =  terrainTexture.getBaseSize().width;
      const rows = terrainTexture.getBaseSize().height;

      // get image and read if this is land or water
      const texturePixels = terrainTexture.readPixels();

      // build tiles, separate water and land tiles
      for (let r = 0; r < rows; r++) {
        for (let i = 0; i < rowLength; i++) {
          // init array
          if (!this.tilesArray[i]) {
            this.tilesArray[i] = [];
          }

          const pixelStartingPosition = (r * rowLength + i)  * 4;
          const red = texturePixels[pixelStartingPosition];
          const green = texturePixels[pixelStartingPosition + 1];
          const blue = texturePixels[pixelStartingPosition + 2];
          // we ignore alpha
          const colorValue = (red + green + blue) / 3;

          const newTile = new GameBoardTile();
          newTile.mapCoordinates = new BABYLON.Vector2(i, r);

          // remember that this tile will be shifted in the view
          if (i % 2 !== 0) { newTile.yPositionShifted = true; }

          if (colorValue < 127) {
            // we found a water tile
            newTile.type = GameBoardTileType.water;
          } else {
            // land aHoi!
            newTile.type = GameBoardTileType.land;
            this.landTilesArray.push(newTile);
          }
          // row element i -> x, row -> y
          this.tilesArray[i][r] = newTile;
        }
      }

      // *****************
      // COAST
      // find coast tiles
      // *****************
      for (const landTile of this.landTilesArray) {
        const surroundingTilesObject = this.findSurroundingTiles(landTile);
        let coastStyleCode = '';
        let surroundingTileNumber = 0;

        const surroundingTiles = surroundingTilesObject.surroundingTiles;
        // store surrounding tiles of this tile
        landTile.surroundingTiles = surroundingTiles;

        // console.log(surroundingTiles);
        if (surroundingTiles && surroundingTiles.length > 0) {
          for (const surroundingTile of surroundingTiles) {
            if (surroundingTile.type === GameBoardTileType.water) {
              // found a water tile next to this land  tile -> this is a coast tile
              // add Surrounding Tile Code, this defines the coast style
              coastStyleCode += this.surroundingTileNames[surroundingTileNumber];
            }
            surroundingTileNumber++;
          }
          // redefine landTile to coast tile
          if (coastStyleCode !== '') {
            // console.log('found a coast tile');
            landTile.type = GameBoardTileType.coast;
            landTile.coastStyleCode = coastStyleCode;
          }
        }
      }

      // *****************
      // MOUNTAINS
      // define mountain tiles, -> center and surrounding
      // Mountain fields do not reside next to a coast field + are a land tile
      // *****************
      // calculate how many mountain fields we should generate
      const mountainFieldCount = Math.round(this.landTilesArray.length * this.mountainsOccuranceFactor);
      // max tries to find a spot for a mountain
      const maxTries = 5;
      const maxMountainAreaSize = 5;
      const minMountainAreaSize = 3;

      // find a suitable tile for a mountain
      for (let m = 0; m < mountainFieldCount; m++) {
        let mountainTileNotFound = true;
        let exitCounter = 0;
        // do some retries
        while (mountainTileNotFound && exitCounter < maxTries) {
          // select a random field
          const randomLandTileIndex = Math.round(Math.random() * (this.landTilesArray.length - 1));
          const possibleMountainTile = this.landTilesArray[randomLandTileIndex];

          const newMountainTiles = [];
          let coastOrMountainNextToTheSelectedTile = false;
          const mountainAreaSize = minMountainAreaSize + Math.round(Math.random() * (maxMountainAreaSize - minMountainAreaSize));

          coastOrMountainNextToTheSelectedTile = this.checkSurroundingTilesForType(
            possibleMountainTile,
            [GameBoardTileType.coast, GameBoardTileType.mountain],
            mountainAreaSize,
            newMountainTiles
          );

          // the tile needs to be land + should not be next to a mountain or the coast
          if (possibleMountainTile.type === GameBoardTileType.land && !coastOrMountainNextToTheSelectedTile) {
            // console.log('found a mountain tile');
            possibleMountainTile.isMountainCenter = true;
            possibleMountainTile.mountainAreaSize = mountainAreaSize;

            // change tile type to mountain
            // change surrounding tiles to mountain
            GameBoardGeneratorService.changeTypeOfTiles(newMountainTiles, GameBoardTileType.mountain);
            mountainTileNotFound = false;
          }
          exitCounter++;
        }
      }
    });
  }

  private findSurroundingTiles(tile: GameBoardTile) {
    let vectorArray = [];
    const surroundingTiles = [];
    const surroundingTilesCoordinates = [];

    if (tile.yPositionShifted) {
      vectorArray = this.surroundingTilesVectorsUp;
    } else {
      vectorArray = this.surroundingTilesVectorsDown;
    }

    // calculate position of surrounding tiles
    for (const vector of vectorArray) {
      // calculate surrounding tile position, vector + vector
      const surroundingTilePosition = tile.mapCoordinates.add(vector);
      // check if tile exists
      if (this.tilesArray[surroundingTilePosition.x] && this.tilesArray[surroundingTilePosition.x][surroundingTilePosition.y]) {
        const surroundingTile = this.tilesArray[surroundingTilePosition.x][surroundingTilePosition.y];
        surroundingTiles.push(surroundingTile);
        surroundingTilesCoordinates.push(surroundingTilePosition);
      }
    }
    return {
      surroundingTiles,
      surroundingTilesCoordinates
    };
  }
}
