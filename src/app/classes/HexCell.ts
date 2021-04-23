
import { HexDirection } from '../enums/HexDirection.enum';
import { HexCoordinates } from './HexCoordinates';
import { HexDirectionExtension } from './HexDirectionExtension';
import { HexMetrics } from './HexMetrics';

export class HexCell {
  public mesh;
  public name;
  private indices = [];
  public vertices = [];
  private positions = [];
  public coordinates: HexCoordinates;
  public neighbors: HexCell[] = [];
  private center;
  public elevation;
  public isMountainCell: boolean = false;
  public isMountainEdgeCell: boolean = false;
  public mountainPath = [];
  public distance;

  distanceTo(otherCell) {
    return this.center.x - otherCell.center.x;
  }

  public isAMountainAroundMe() {
    for (let i = 0; i < this.neighbors.length; i++) {
      if (this.neighbors[i].isMountainCell) {
        return true;
      }
      return false;
    }
  }

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

  // build quad bridge and edge triangle
  triangulateConnection(direction: HexDirection, cell: HexCell, v1: BABYLON.Vector3, e1: BABYLON.Vector3, e2: BABYLON.Vector3, v2: BABYLON.Vector3) {
    let neighbor = cell.getNeighbor(direction);

    // no neighbor => no connection needed
    if (!neighbor) {
      return;
    }

    // build bridge
    let bridge = HexMetrics.getBridge(direction);
    // console.log(bridge);
    // v3: upper left vector of bridge
    let v3 = v1.add(bridge);
    // v4: upper right vector of bridge
    let v4 = v2.add(bridge);
    v3.y = v4.y = neighbor.elevation;

    // calculate extra edges (splited hexagon side in 3 pieces => 4 vertices)
    let e3 = BABYLON.Vector3.Lerp(v3, v4, 1.0 / 3.0);
    let e4 = BABYLON.Vector3.Lerp(v3, v4, 2.0 / 3.0);

    // im a normal hex cell and my neighbor is a mountain cell
    if (!cell.isMountainCell && neighbor.isMountainCell) {
      /*
      // store vertices next to mountain, they belong to the mountain path
      let mountainPatObject = {
        vertices: [
          v2,
          v1
        ]
      };
     
      let oppositeDirection = HexDirectionExtension.opposite(direction);
      console.log("direction is" + direction, " opposite"+ oppositeDirection );
      console.log(mountainPatObject);
      console.log(cell.name);
      console.log(neighbor.name);
      neighbor.mountainPath[oppositeDirection] = mountainPatObject;
      neighbor.isMountainEdgeCell = true;*/
      return;
    }


    /*
    // seems fine
    // handle i am a mountain and my neighbor is a normal hex cell
    if (cell.isMountainCell && !neighbor.isMountainCell) {
      // store vertices next to mountain, they belong to the mountain path
      let mountainPatObject = {
        vertices: [
         v3,
         v4
        ]
      };
      cell.mountainPath[direction] = mountainPatObject;
      cell.isMountainEdgeCell = true;
      return;
    }
    }*/

    // console.log(neighbor);
    // console.log(v1);
    // console.log(v2);

    // connection bridge contains 3 quads
    this.triangulateEdgeTerraces(v1, e1, cell, v3, e3, neighbor);
    this.triangulateEdgeTerraces(e1, e2, cell, e3, e4, neighbor);
    this.triangulateEdgeTerraces(e2, v2, cell, e4, v4, neighbor);/*
    /*this.addQuad(v1, e1, v3, e3);
    this.addQuad(e1, e2, e3, e4);
    this.addQuad(e2, v2, e4, v4);*/

    let nextNeighbor = cell.getNeighbor(HexDirectionExtension.next(direction));

    // handle mountain neighbor, no need for an edge triangle
    if (nextNeighbor && nextNeighbor.isMountainCell) {
      return;
    }

    // add corner triangles
    // Not yet, as we're now producing overlapping triangles. Because three cells share one triangular connection, we only need to add them for two connections. So just NE and E will do.
    if (direction <= HexDirection.E && nextNeighbor != null) {
      let bridge = HexMetrics.getBridge(HexDirectionExtension.next(direction));
      let v5 = v2.add(bridge);
      v5.y = nextNeighbor.elevation;

      if (cell.elevation <= neighbor.elevation) {
        if (cell.elevation <= nextNeighbor.elevation) {
          this.triangulateCorner(v2, cell, v4, neighbor, v5, nextNeighbor);
        }
        else {
          this.triangulateCorner(v5, nextNeighbor, v2, cell, v4, neighbor);
        }
      }
      else if (neighbor.elevation <= nextNeighbor.elevation) {
        this.triangulateCorner(v4, neighbor, v5, nextNeighbor, v2, cell);
      }
      else {
        this.triangulateCorner(v5, nextNeighbor, v2, cell, v4, neighbor);
      }
    }
  }

  triangulateEdgeTerraces(
    beginLeft: BABYLON.Vector3, beginRight: BABYLON.Vector3, beginCell: HexCell,
    endLeft: BABYLON.Vector3, endRight: BABYLON.Vector3, endCell: HexCell
  ) {
    let v3 = HexMetrics.TerraceLerp(beginLeft, endLeft, 1.0);
    let v4 = HexMetrics.TerraceLerp(beginRight, endRight, 1.0);
    //let c2 = HexMetrics.TerraceLerp(beginCell.color, endCell.color, 1);

    this.addQuad(beginLeft, beginRight, v3, v4);

    for (let i = 2.0; i < HexMetrics.terraceSteps; i++) {
      let v1 = new BABYLON.Vector3(v3.x, v3.y, v3.z);
      let v2 = new BABYLON.Vector3(v4.x, v4.y, v4.z);
      //let c1 = c2;
      v3 = HexMetrics.TerraceLerp(beginLeft, endLeft, i);
      v4 = HexMetrics.TerraceLerp(beginRight, endRight, i);
      //c2 = HexMetrics.TerraceLerp(beginCell.color, endCell.color, i);
      this.addQuad(v1, v2, v3, v4);
      //AddQuadColor(c1, c2);
    }

    this.addQuad(v3, v4, endLeft, endRight);
    //this.addQuad(beginLeft, beginRight, endLeft, endRight);
    // AddQuadColor(beginCell.color, endCell.color);
  }

  triangulateCorner(
    lowest: BABYLON.Vector3, bottomCell: HexCell,
    middle: BABYLON.Vector3, leftCell: HexCell,
    highest: BABYLON.Vector3, rightCell: HexCell
  ) {
    //this.addTriangle(bottom, left, right);

    // find center of the three triangle edges
    let xCenter = (lowest.x + middle.x + highest.x) / 3;
    let yCenter = (lowest.y + middle.y + highest.y) / 3;
    let zCenter = (lowest.z + middle.z + highest.z) / 3;

    let center = new BABYLON.Vector3(xCenter, yCenter, zCenter);

    this.triangulateCornerTerraces(
      lowest, bottomCell, middle, leftCell, highest, rightCell, center
    )
  }

  triangulateCornerTerraces(
    lowest: BABYLON.Vector3, lowestCell: HexCell,
    middle: BABYLON.Vector3, middleCell_: HexCell,
    higest: BABYLON.Vector3, higestCell: HexCell,
    center: BABYLON.Vector3
  ) {
    let v4 = HexMetrics.TerraceLerp(lowest, middle, 1.0);
    let v5 = HexMetrics.TerraceLerp(middle, higest, 1.0);
    let v6 = HexMetrics.TerraceLerp(higest, lowest, 1.0);

    // start triangle
    this.addTriangle(center, lowest, v4);
    this.addTriangle(center, middle, v5);
    this.addTriangle(center, higest, v6);

    // triangle per steps
    for (let i = 2.0; i < HexMetrics.terraceSteps; i++) {
      let v1 = new BABYLON.Vector3(v4.x, v4.y, v4.z);
      let v2 = new BABYLON.Vector3(v5.x, v5.y, v5.z);
      let v3 = new BABYLON.Vector3(v6.x, v6.y, v6.z);

      v4 = HexMetrics.TerraceLerp(lowest, middle, i);
      v5 = HexMetrics.TerraceLerp(middle, higest, i);
      v6 = HexMetrics.TerraceLerp(higest, lowest, i);
      

      this.addTriangle(center, v1, v4);
      this.addTriangle(center, v2, v5);
      this.addTriangle(center, v3, v6);
    }

    // end triangle
    this.addTriangle(middle, center, v4);
    this.addTriangle(higest, center, v5);
    this.addTriangle(lowest, center, v6);
  }

  triangulate() {
    // hexagon is separated in 6 pieces
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

    // add inner triangles, 3 pieces
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

    if (cell.isMountainCell) {
      if (cell.neighbors[direction]) {
        if (!cell.neighbors[direction].isMountainCell) {
          // build bridge
          let bridge = HexMetrics.getBridge(direction);
          // console.log(bridge);
          // v3: upper left vector of bridge
          let v3 = v1.add(bridge);
          // v4: upper right vector of bridge
          let v4 = v2.add(bridge);
          v3.y = v4.y = cell.neighbors[direction].elevation;

          // calculate extra edges (splited hexagon side in 3 pieces => 4 vertices)
          let e3 = BABYLON.Vector3.Lerp(v3, v4, 1.0 / 3.0);
          let e4 = BABYLON.Vector3.Lerp(v3, v4, 2.0 / 3.0);

          let mountainPatObject = {}
          // found flat land remember vertices
          if (direction > 2) {
            mountainPatObject = {
              vertices: [
                this.perturb(v4),
                this.perturb(e4),
                this.perturb(e3),
                this.perturb(v3)
              ]
            };
            cell.mountainPath[HexDirectionExtension.mirrorAtXAxis(direction)] = mountainPatObject;

          } else {
            mountainPatObject = {
              vertices: [
                this.perturb(v3),
                this.perturb(e3),
                this.perturb(e4),
                this.perturb(v4)
              ]
            };
            cell.mountainPath[direction] = mountainPatObject;
          }

          cell.isMountainEdgeCell = true;
        }
      };
    }

    // build bridges and edge triangle
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

  constructor(position, isMountainCell) {
    this.center = position;
    this.name = "hexcell-" + position.x + "-" + position.z;
    this.mesh = new BABYLON.Mesh(this.name);
    this.elevation = position.y;
    this.isMountainCell = isMountainCell;
  }
}