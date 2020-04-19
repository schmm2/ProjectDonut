export class Ship {
  private id;
  private name;
  private type;
  private mesh;
  private speed = 2.0;

  public constructor(id, name, type, mesh) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.mesh = mesh;
  }

  public getMesh() {
    return this.mesh;
  }
}
