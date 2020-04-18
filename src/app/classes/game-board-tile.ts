import Vector2 = BABYLON.Vector2;
import {GameBoardTileType} from '../enums/game-board-tile-type.enum';

export class GameBoardTile {
  get isMountainCenter() {
    return this._isMountainCenter;
  }

  set isMountainCenter(value) {
    this._isMountainCenter = value;
  }
  get coastStyleCode() {
    return this._coastStyleCode;
  }

  set coastStyleCode(value) {
    this._coastStyleCode = value;
  }
  get surroundingTiles(): GameBoardTile[] {
    return this._surroundingTiles;
  }

  set surroundingTiles(value: GameBoardTile[]) {
    this._surroundingTiles = value;
  }
  public constructor() {}

  get type(): GameBoardTileType {
    return this._type;
  }

  set type(value: GameBoardTileType) {
    this._type = value;
  }

  get mapCoordinates(): BABYLON.Vector2 {
    return this._mapCoordinates;
  }

  set mapCoordinates(value: BABYLON.Vector2) {
    this._mapCoordinates = value;
  }

  get yPositionShifted(): boolean {
    return this._yPositionShifted;
  }

  set yPositionShifted(value: boolean) {
    this._yPositionShifted = value;
  }

  get name() {
    return ('tile' + this._mapCoordinates.x + '-' + this._mapCoordinates.y);
  }

  private _type: GameBoardTileType;
  private _mapCoordinates: Vector2;
  private _yPositionShifted = false;
  private _surroundingTiles: GameBoardTile[];
  private _coastStyleCode;
  private _name;
  private _isMountainCenter = false;
}
