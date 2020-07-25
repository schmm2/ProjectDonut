import {Injectable} from '@angular/core';
import {AssetLoaderService} from './asset-loader.service';
import {GameBoardTile} from '../classes/game-board-tile';
import {GameBoardTileType} from '../enums/game-board-tile-type.enum';
import {BehaviorSubject} from 'rxjs';
import {TerrainGeneratorService} from './terrain-generator.service';
import {GameStateService} from './game-state.service';

@Injectable({
  providedIn: 'root'
})
export class TilesGeneratorService {

  public constructor() {}

  private resolution: BABYLON.Vector2;
  private generatedGameBoardTilesSubject : BehaviorSubject<any> = new BehaviorSubject(null);

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


  private scene;

  private tileSizeMultiplicator = 3.0;

  private static changeTypeOfTiles(tiles: GameBoardTile[], type: GameBoardTileType) {
    for (const tile of tiles) {
      tile.type = type;
    }
  }

  /*
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
  }*/

  public generateTiles(scene, heightMapTexture) {
    this.scene = scene;
    this.resolution = new BABYLON.Vector2(1024, 1024);

    const time1 = performance.now();
    
    let tilesArray = this.buildTilesArray(heightMapTexture);
    this.buildGameBoard(tilesArray);

    const time2 = performance.now();
    console.log('Tiles Generator: Creating Tiles took ' + (time2 - time1) + ' milliseconds.');
  }

  private defineTileTyp(tile){
    let heightDif = tile.maxHeight - tile.minHeight;

    // coast
    if(tile.minHeight <= 1.5){
      // one vertice is connected to water
      tile.type = GameBoardTileType.coast;
    } else{
      // mountain
      if(heightDif >= 2.5){
        tile.type = GameBoardTileType.mountain;
      }
      // land
      else{
        tile.type = GameBoardTileType.land;
      }
    }
  }

  private calcHeightAtPosition(pixels, point, rowLength){ 
    const pixelPosition = (point.y * rowLength + point.x) * 4;

    // every pixel contains 4 values, rgba
    // we ignore alpha
    const red = pixels[pixelPosition];
    const green = pixels[pixelPosition + 1];
    const blue = pixels[pixelPosition + 2];
    
    // calc average for greyscale image
    let colorValue = (red + green + blue) / 3;
    
    // we transform the value, this function is the same in the terrain vertex shader
    let heightValueBase = (colorValue / 255) + 1;
    // move 0.0-1.0 up to 1.0-2.0 so pow works, pow make lower parts flat, higher parts more step
    let heightValueScaled = Math.pow(Math.pow(heightValueBase, 4.0 ), heightValueBase );

    return heightValueScaled;
  }

  private buildTilesArray(heightMapTexture) {
    let tilesArray = [];

    const rowLength = this.resolution.x;
    const rows = this.resolution.y;

    const texturePixels = heightMapTexture.readPixels();      

    // tile size calculation
    let tileWidthHalf = 4 * this.tileSizeMultiplicator;
    let tileHeightHalf = 3 * this.tileSizeMultiplicator;
    let tileWidth = tileWidthHalf * 2.0;
    let tileHeight = tileHeightHalf * 2.0;
    let tilesDistanceX = 3 * tileWidthHalf; 
    

    // build tiles
    // loop through pixels, jump from hex center to hex center
    for (let r = tileHeightHalf; r < rows; r += tileHeightHalf) {
      for (let i = tileWidthHalf; i < rowLength; i += tilesDistanceX ) {
        const newTile = new GameBoardTile();

        // define hex center
        let centerX = i;
        const centerY = r;

        // shift x position if the row is an even number
        if (r % 2 === 0) {
          centerX +=  tilesDistanceX / 2.0;
          newTile.xPositionShifted = true;
        }

        newTile.worldPosition = new BABYLON.Vector3(centerX, centerY, 0);

        let hexPositions = [
            new BABYLON.Vector3(centerX - tileWidthHalf, centerY, 0),
            new BABYLON.Vector3(centerX, centerY),
            new BABYLON.Vector3(centerX - tileWidthHalf / 2.0, centerY + tileHeightHalf, 0),
            new BABYLON.Vector3(centerX + tileWidthHalf / 2.0, centerY + tileHeightHalf, 0),
            new BABYLON.Vector3(centerX + tileWidthHalf, centerY, 0),
            new BABYLON.Vector3(centerX + tileWidthHalf / 2.0, centerY - tileHeightHalf, 0),
            new BABYLON.Vector3(centerX - tileWidthHalf / 2.0, centerY - tileHeightHalf, 0)
        ]

        // calculate real world heights of points
        // we lookup every point of the hex on the texture to find the lowest and heightest point

        let heightSum = 0;
        let heightMax = 0;
        let heightMin = 999;

        hexPositions.forEach(position => {
          let height = this.calcHeightAtPosition(texturePixels, position, this.resolution.x);
          heightSum += height;
          if(height > heightMax){ heightMax = height};
          if(height < heightMin) { heightMin = height};
        });

        let heightDif = heightMax - heightMin;
        
        if(heightSum >= 10 && heightDif < 3.0){
          newTile.maxHeight = heightMax;
          newTile.minHeight = heightMin;
          this.defineTileTyp(newTile);
          tilesArray.push(newTile);
        }
      }
    }

    return tilesArray;
  }


  // builds the actual game board
  // loop through all landTiles, adds non Mountain Tiles
  private buildGameBoard(tilesArray) {
    let worldSize = 400;
    let gameBoardTilesArray = [];
    
    let oceanTilematerial = new BABYLON.StandardMaterial("oceanTilematerial", this.scene);
    oceanTilematerial.diffuseColor = new BABYLON.Color3(0, 0, 1);

    let mounainTilematerial = new BABYLON.StandardMaterial("mountainTilematerial", this.scene);
    mounainTilematerial.diffuseColor = new BABYLON.Color3(1, 0, 0);

    for(const tile of tilesArray){
      let tileName = "gameBoardTile-" + tile.worldPosition.x + "-" + tile.worldPosition.y;
      let newHexTile = BABYLON.MeshBuilder.CreateDisc(tileName, {radius: (4.0 * this.tileSizeMultiplicator / 1024 * worldSize) , tessellation: 6, updatable: true}, this.scene);
      
      newHexTile.material = new BABYLON.StandardMaterial("mat1",this.scene); 
      newHexTile.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.WORLD);

      newHexTile.position.x = (tile.worldPosition.x / 1024 * worldSize) - (worldSize / 2);
      newHexTile.position.z = (tile.worldPosition.y / 1024 * worldSize) - (worldSize / 2);

      newHexTile.position.y = tile.maxHeight + 1.0;
      newHexTile.visibility = 0;

      switch(tile.type){
        case GameBoardTileType.coast: 
          newHexTile.material = oceanTilematerial;
          break;
        case GameBoardTileType.mountain:
          newHexTile.material = mounainTilematerial;
          break;
        default:
          break;  
      }

      tile.mesh = newHexTile;
      gameBoardTilesArray.push(tile);
    }
    this.generatedGameBoardTilesSubject.next(gameBoardTilesArray);
  }

  public subscribeToGeneratedTiles(){
    return this.generatedGameBoardTilesSubject;
  }

  /*private findSurroundingTiles(tile: GameBoardTile) {
    let vectorArray = [];
    const surroundingTiles = [];
    const surroundingTilesCoordinates = [];

    if (tile.xPositionShifted) {
      vectorArray = this.surroundingTilesVectorsUp;
    } else {
      vectorArray = this.surroundingTilesVectorsDown;
    }

    // calculate position of surrounding tiles
    for (const vector of vectorArray) {
      // calculate surrounding tile position, vector + vector
      const surroundingTilePosition = tile.worldPosition.add(vector);
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
  }*/
}
