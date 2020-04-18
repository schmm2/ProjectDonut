import {Injectable} from '@angular/core';
import {AssetLoaderService} from './asset-loader.service';
import {GameBoardTile} from '../classes/game-board-tile';
import {GameBoardTileType} from '../enums/game-board-tile-type.enum';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameBoardGeneratorService {
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

  public constructor(
    private assetLoaderService: AssetLoaderService
  ) { }

  public subscribeToGeneratedGameBoardLandTiles() {
    return this.generatedLandTiles;
  }

  public init() {
    this.tilesArray = [];
    const textures = this.loadTerrainTextures();
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

      // find coast tiles
      for (const landTile of this.landTilesArray) {
        const surroundingTilesObject = this.findSurroundingTiles(landTile);
        let coastStyleCode = '';
        let surroundingTileNumber = 0;
        // store surrounding tiles, maybe we need them later
        landTile.surroundingTilesCoordinates = surroundingTilesObject.surroundingTilesCoordinates;

        const surroundingTiles = surroundingTilesObject.surroundingTiles;

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

  private loadTerrainTextures() {
    const images = [];
    const allImages = this.assetLoaderService.getAllTextures();
    allImages.forEach((image, key) => {
      if (key.startsWith(this.assetPrefix)) {images.push(image); }
    });
    return images;
  }
}
