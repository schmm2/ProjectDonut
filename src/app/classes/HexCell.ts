
import { HexDirection } from '../enums/HexDirection.enum';
import { HexDirectionExtension} from './HexDirectionExtension';
import { HexMetrics } from './HexMetrics';

export class HexCell {
  public mesh;
  public name;
  private indices = [];
  private vertices = [];
  private positions = [];
  public neighbors: HexCell[] = [];
  private center;
  public elevation;


  public getNeighbor(direction: HexDirection) {
    //console.log(this.neighbors);
    return this.neighbors[direction];
  }

  public setNeighbor(direction: HexDirection, cell: HexCell) {
    this.neighbors[direction] = cell;
    cell.neighbors[HexDirectionExtension.opposite(direction)] = this;
  }

  addTriangle(vec1: BABYLON.Vector3, vec2: BABYLON.Vector3, vec3: BABYLON.Vector3) {
    let verticesLength = this.vertices.length;

    // add vertices
    this.vertices.push(this.perturb(vec1));
    this.vertices.push(this.perturb(vec2));
    this.vertices.push(this.perturb(vec3));

    // add 3 new indices
    this.indices.push(verticesLength);
    this.indices.push(verticesLength + 1);
    this.indices.push(verticesLength + 2);
  }

  addQuad(v1: BABYLON.Vector3, v2: BABYLON.Vector3, v3: BABYLON.Vector3, v4: BABYLON.Vector3) {
    let verticesLength = this.vertices.length;

    // add vertices
    this.vertices.push(this.perturb(v1));
    this.vertices.push(this.perturb(v2));
    this.vertices.push(this.perturb(v3));
    this.vertices.push(this.perturb(v4));

    // add new indices

    this.indices.push(verticesLength);
    this.indices.push(verticesLength + 2);
    this.indices.push(verticesLength + 1);
    this.indices.push(verticesLength + 1);
    this.indices.push(verticesLength + 2);
    this.indices.push(verticesLength + 3);
  }

  triangulateConnection(direction: HexDirection, cell: HexCell, v1: BABYLON.Vector3, e1: BABYLON.Vector3, e2: BABYLON.Vector3, v2: BABYLON.Vector3) {
    let neighbor = cell.getNeighbor(direction);

    if (neighbor == null) {
      return;
    }

    // console.log(neighbor);
    // console.log(v1);
    // console.log(v2);

    // build bridge
    let bridge = HexMetrics.getBridge(direction);
    // console.log(bridge);
    // v3: upper left vector of bridge
    let v3 = v1.add(bridge);
    // v4: pper right vector of bridge
    let v4 = v2.add(bridge);
    v3.y = v4.y = neighbor.elevation;

    // calculate extra edges (splited hexagon in 18sides)
    let e3 = BABYLON.Vector3.Lerp(v3, v4, 1.0 / 3.0);
    let e4 = BABYLON.Vector3.Lerp(v3, v4, 2.0 / 3.0);

    this.addQuad(v1, e1, v3, e3);
    this.addQuad(e1, e2, e3, e4);
    this.addQuad(e2, v2, e4, v4);

    let nextNeighbor = cell.getNeighbor(HexDirectionExtension.next(direction));

    // add corner triangles
    // Not yet, as we're now producing overlapping triangles. Because three cells share one triangular connection, we only need to add them for two connections. So just NE and E will do.
    if (direction <= HexDirection.E && nextNeighbor != null) {
      let bridge = HexMetrics.getBridge(HexDirectionExtension.next(direction));
      let v5 = v2.add(bridge);
      v5.y = nextNeighbor.elevation;
      this.addTriangle(v2, v4, v5);
    }
  }

  triangulate() {
    for (let i = 0; i < 6; i++) {
      this.triangulateInner(i, this);
    }

    // merge verticedata to one single flat array
    this.vertices.forEach(verticeArray => {
      let verticeArrayRaw = [verticeArray.x, verticeArray.y, verticeArray.z];
      this.positions = this.positions.concat(verticeArrayRaw);
    })

    //Empty array to contain calculated values or normals added
    var normals = [];

    //Calculations of normals added
    BABYLON.VertexData.ComputeNormals(this.positions, this.indices, normals);

    let vertexData = new BABYLON.VertexData();
    vertexData.positions = this.positions;
    vertexData.indices = this.indices;
    vertexData.normals = normals;

    vertexData.applyToMesh(this.mesh, true);
  }

  triangulateInner(direction: HexDirection, cell: HexCell) {
    // inner vertices
    let v1 = this.center.add(HexMetrics.getFirstSolidCorner(direction));
    let v2 = this.center.add(HexMetrics.getSecondSolidCorner(direction));

    let e1 = BABYLON.Vector3.Lerp(v1, v2, 1.0 / 3.0);
    let e2 = BABYLON.Vector3.Lerp(v1, v2, 2.0 / 3.0);

    // add inner triangle
    this.addTriangle(
      this.center,
      v1,
      e1
    )

    this.addTriangle(
      this.center,
      e1,
      e2
    )

    this.addTriangle(
      this.center,
      e2,
      v2
    )

    // build bridges
    if (direction <= HexDirection.SE) {
      this.triangulateConnection(direction, this, v1, e1, e2, v2);
    }
  }


  perturb(position: BABYLON.Vector3) {
    // we want all points which share a location on the map to be pertubed the same
    // first we need to find the world position of this vertex
    let vertexWorldPosition = new BABYLON.Vector3(this.center.x + position.x, position.y, this.center.z + position.z);

    // sample noise
    let noise = HexMetrics.sampleNoise(vertexWorldPosition);

    // console.log(noise);

    // perturb vertex
    let newPositionX = position.x + ((noise.x / 255.0) * 2.0 - 1.0) * HexMetrics.cellPerturbStrength;
    // y stays the same
    let newPositionZ = position.z + ((noise.z / 255.0) * 2.0 - 1.0) * HexMetrics.cellPerturbStrength;

    return new BABYLON.Vector3(newPositionX, position.y, newPositionZ);
  }

  constructor(position) {
    this.center = position;
    this.name = "hexcell-" + position.x + "-" + position.z;
    this.mesh = new BABYLON.Mesh(this.name);
    this.elevation = position.y;
  }
}