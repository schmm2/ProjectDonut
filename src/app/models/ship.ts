export class Ship {
  private name;
  private type;
  private meshes;
  private cot;
  private speed = 2.0;

  public constructor(name, type, meshes, cot) {
    this.name = name;
    this.type = type;
    this.meshes = meshes;
    this.cot = cot;
  }
}
