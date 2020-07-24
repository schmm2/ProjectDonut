import Vector2 = BABYLON.Vector2;
import {GameBoardTileType} from '../enums/game-board-tile-type.enum';

export class GameBoardTile {
  get evelation() {
    return this._evelation;
  }

  set evelation(value) {
    this._evelation = value;
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

  get xPositionShifted(): boolean {
    return this._xPositionShifted;
  }

  set xPositionShifted(value: boolean) {
    this._xPositionShifted = value;
  }

  get name() {
    return ('tile' + this._mapCoordinates.x + '-' + this._mapCoordinates.y);
  }

  public get hex() {
    return this._hex;
  }
  public set hex(value) {
    this._hex = value;
  }

  public get heights() {
    return this._heights;
  }
  public set heights(value) {
    this._heights = value;
  }

  private _type: GameBoardTileType;
  private _mapCoordinates: Vector2;
  private _xPositionShifted = false;
  private _surroundingTiles: GameBoardTile[];
  private _evelation;
  private _hex;
  private _heights;
  private _maxHeight;
  private _minHeight;
  private _tileType;
  public get tileType() {
    return this._tileType;
  }
  public set tileType(value) {
    this._tileType = value;
  }

  public get minHeight() {
    return this._minHeight;
  }
  public set minHeight(value) {
    this._minHeight = value;
  }
  
  public get maxHeight() {
    return this._maxHeight;
  }
  public set maxHeight(value) {
    this._maxHeight = value;
  }
  
}
