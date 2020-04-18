import Vector2 = BABYLON.Vector2;

enum GameBoardTileType {
  water,
  land,
  coast
}

export class GameBoardTile {
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

  get tileYShifted(): boolean {
    return this._tileYShifted;
  }

  set tileYShifted(value: boolean) {
    this._tileYShifted = value;
  }

  private _type: GameBoardTileType;
  private _mapCoordinates: Vector2;
  private _tileYShifted = false;
}
