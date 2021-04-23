export class HexCoordinates {
  private x;
  private z;
  private y;

  constructor(x, z) {
    this.x = x;
    this.z = z;
    this.y = -this.x - this.z
  }

  static fromOffsetCoordinates(x, z) {
    /*console.log(x+"-"+z);
    console.log((x - z / 2)+"-"+ z)*/
    return new HexCoordinates(x - z / 2, z);
  }

  toString () {
		return this.x + "-" + this.y + "-" + this.z;
	}
}