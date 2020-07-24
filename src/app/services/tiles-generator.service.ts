import {Injectable} from '@angular/core';
import {AssetLoaderService} from './asset-loader.service';
import {GameBoardTile} from '../classes/game-board-tile';
import {GameBoardTileType} from '../enums/game-board-tile-type.enum';
import {BehaviorSubject} from 'rxjs';
import {TerrainGeneratorService} from './terrain-generator.service';

@Injectable({
  providedIn: 'root'
})
export class TilesGeneratorService {

  public constructor(
    private assetLoaderService: AssetLoaderService,
    private terrainGeneratorService: TerrainGeneratorService
  ) {

    this.assetLoaderService.subscribeToAssetsLoadState().subscribe((isLoaded) => {
      if (isLoaded) {
        //this.init();
      }
    });

  }

  private mountainsOccurrenceFactor = 0.05;

  private resolution: BABYLON.Vector2;
  private assetPrefix = 'terrain-';
  private tilesArray: any[];
  private landTilesArray: GameBoardTile[] = [];
  // land + coast tiles, no water, mountains
  private gameBoardTilesArray: GameBoardTile[] = [];

  private generatedGameBoardTiles: BehaviorSubject<GameBoardTile[]> = new BehaviorSubject(this.gameBoardTilesArray);
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

  private heightMapTextures;

  private scene;

  private tileSizeMultiplicator = 3.0;

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

  public subscribeToGeneratedGameBoardTiles() {
    return this.generatedGameBoardTiles;
  }

  public subscribeToGeneratedLandTiles() {
    return this.generatedLandTiles;
  }

  public init(heightMapTexture, scene) {
    console.log("dsdsdsd");
    this.scene = scene;
    this.heightMapTextures = [];
    this.heightMapTextures.push(heightMapTexture);
    this.resolution = new BABYLON.Vector2(1024, 1024);
    const time1 = performance.now();
    this.tilesArray = [];
    // const textures = this.assetLoaderService.loadTexturesOfCategory(this.assetPrefix);
    // defines all tiles
    console.log(this.heightMapTextures);
    this.buildTilesArray();

    // checks which tile is a coast tile
    this.defineTileTypes();
    
    this.buildGameBoard();

    const time2 = performance.now();
    console.log('Tiles Generator: Creating Tiles took ' + (time2 - time1) + ' milliseconds.');
  }

  private defineTileTypes(){
    this.tilesArray.forEach(tile =>{
      let heightDif = tile.maxHeight - tile.minHeight;

      console.log(tile);
      if(tile.minHeight <= 1.5){
        // one vertice is connected to water
        tile.type = GameBoardTileType.coast;
      } else{
        if(heightDif >= 2.5){
          tile.type = GameBoardTileType.mountain;
          console.log("MOUNTAAAAAAIIN");
        }else{
          tile.type = GameBoardTileType.land;
        }
      }
    })
  }

  private calcHeightAtPosition(pixels, point, rowLength){
    //console.log(point);
    const pixelPosition = (point.y * rowLength + point.x) * 4;
    const red = pixels[pixelPosition];
    const green = pixels[pixelPosition + 1];
    const blue = pixels[pixelPosition + 2];
    // we ignore alpha
    //console.log(pixelPosition);
    let colorValue = (red + green + blue) / 3;
    
    //console.log(colorValue);

    // calculate height, same calculation as in terrain vertex shader
    //colorValue = colorValue * 3.0;

    // calculate new position
    //console.log(colorValue);
    let heightValueBase = (colorValue / 255) + 1;
   // move 0.0-1.0 up to 1.0-2.0 so pow works, pow make lower parts flat, higher parts more step
    let heightValueScaled = Math.pow(Math.pow(heightValueBase, 4.0 ), heightValueBase );

    //console.log(heightValueScaled);
    return heightValueScaled;
  }

  private buildTilesArray() {
    console.log(this.heightMapTextures);

    this.heightMapTextures.forEach(terrainTexture => {
      //console.log(terrainTexture.isReady());
      
      const rowLength = this.resolution.x;
      const rows = this.resolution.y;
      console.log(rowLength);
      console.log(rows);


      /*const planeRTT = BABYLON.MeshBuilder.CreatePlane('rttPlane', {width: 50, height: 50}, this.scene);
      planeRTT.setPositionWithLocalVector(new BABYLON.Vector3(100, 50, 0));

      const rttMaterial = new BABYLON.StandardMaterial('RTT material', this.scene);
      rttMaterial.emissiveTexture = terrainTexture;
      rttMaterial.disableLighting = true;
      planeRTT.material = rttMaterial;

      const texturePixels = rttMaterial.emissiveTexture.readPixels();*/
      const texturePixels = terrainTexture.readPixels();      

      console.log(this.tileSizeMultiplicator);

      let tileWidthHalf = 4 * this.tileSizeMultiplicator;
      let tileHeightHalf = 3 * this.tileSizeMultiplicator;
      let tileWidth = tileWidthHalf * 2.0;
      let tileHeight = tileHeightHalf * 2.0;
      let tilesDistanceX = 3 * tileWidthHalf; 
      

      // build tiles
      // loop through pixels, jump from hex center to hex center
      for (let r = tileHeightHalf; r < rows; r += tileHeightHalf) {
        for (let i = tileWidthHalf; i < rowLength; i += tilesDistanceX ) {
          // define hex center
          let centerX = i;
          const centerY = r;
          const newTile = new GameBoardTile();
          newTile.heights = [];

          // shift x position if the row is an even number
          if (r % 2 === 0) {
            centerX +=  tilesDistanceX / 2.0;
            newTile.xPositionShifted = true;
          }

          // find all points of this center point
          const hex = {
            center: new BABYLON.Vector3(centerX, centerY, 0),
            positions: [],
            neighbors: []
          };

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
            //console.log(newTile.heights);
            newTile.hex = hex;
            newTile.maxHeight = heightMax;
            newTile.minHeight = heightMin;
            this.tilesArray.push(newTile);
          }
        }
      }
      console.log(this.tilesArray);
    });
  }


  // builds the actual game board
  // loop through all landTiles, adds non Mountain Tiles
  private buildGameBoard() {
    let worldSize = 400;
    let index = 0;
    for(const tile of this.tilesArray){
      let discTemplate = BABYLON.MeshBuilder.CreateDisc("disc-template", {radius: (4.0 * this.tileSizeMultiplicator / 1024 * worldSize) , tessellation: 6, updatable: true}, this.scene);
      
      discTemplate.material = new BABYLON.StandardMaterial("mat1",this.scene); 
      discTemplate.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.WORLD);

      discTemplate.position.x = (tile.hex.center.x/1024*worldSize )- (worldSize /2);
      discTemplate.position.z = (tile.hex.center.y/1024*worldSize )- (worldSize /2 );
      discTemplate.position.y = tile.maxHeight + 1.0;

      if(tile.type == GameBoardTileType.coast){
        let oceanTilematerial = new BABYLON.StandardMaterial("oceanTilematerial", this.scene);
        oceanTilematerial.diffuseColor = new BABYLON.Color3(0, 0, 1);
        discTemplate.material = oceanTilematerial;
      }

      if(tile.type == GameBoardTileType.mountain){
        let mounainTilematerial = new BABYLON.StandardMaterial("mountainTilematerial", this.scene);
        mounainTilematerial.diffuseColor = new BABYLON.Color3(1, 0, 0);
        discTemplate.material = mounainTilematerial;
      }
    }
  }

  private findSurroundingTiles(tile: GameBoardTile) {
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
