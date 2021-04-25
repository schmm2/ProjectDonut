export class EdgeVertices {
  public v1: BABYLON.Vector3;
  public v2: BABYLON.Vector3;
  public v3: BABYLON.Vector3;
  public v4: BABYLON.Vector3;
  public v5: BABYLON.Vector3;

  constructor(corner1: BABYLON.Vector3, corner2: BABYLON.Vector3){
    this.v1 = corner1;
    this.v2 = BABYLON.Vector3.Lerp(corner1, corner2, 0.25);
    this.v3 = BABYLON.Vector3.Lerp(corner1, corner2, 0.5);
    this.v4 = BABYLON.Vector3.Lerp(corner1, corner2, 0.75);
    this.v5 = corner2;
  } 
}