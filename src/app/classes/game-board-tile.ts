import Vector2 = BABYLON.Vector2;
import {GameBoardTileType} from '../enums/game-board-tile-type.enum';

export class GameBoardTile {
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

  get xPositionShifted(): boolean {
    return this._xPositionShifted;
  }

  set xPositionShifted(value: boolean) {
    this._xPositionShifted = value;
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

  public get worldPosition() {
    return this._worldPosition;
  }
  public set worldPosition(value) {
    this._worldPosition = value;
  }

  public get mesh() {
    return this._mesh;
  }
  public set mesh(value) {
    this._mesh = value;
  }

  private _type: GameBoardTileType;
  private _xPositionShifted = false;
  private _surroundingTiles: GameBoardTile[];
  private _maxHeight;
  private _minHeight;
  private _worldPosition;
  private _mesh;
}
