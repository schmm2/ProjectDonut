
import { HexDirection } from '../enums/HexDirection.enum';
import { HexCoordinates } from './HexCoordinates';
import { HexDirectionExtension } from './HexDirectionExtension';
import { HexMetrics } from './HexMetrics';
import { EdgeVertices } from './EdgeVertices';
import { ThinSprite } from 'babylonjs/Sprites/thinSprite';
import { float } from 'babylonjs/types';

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
  public color: BABYLON.Color3;
  public colors: BABYLON.Color3[] = [];
  private terrainTypes: BABYLON.Vector3[] = [];
  public terrainTypeIndex: number;
  private terrainTypesFlatArray = [];

  static color1 = new BABYLON.Color3(1, 0, 0);
  static color2 = new BABYLON.Color3(0, 1, 0);
  static color3 = new BABYLON.Color3(0, 0, 1);

  distanceTo(otherCell) {
    return this.center.x - otherCell.center.x;
  }

  public getTerrainTypes(){
    return this.terrainTypesFlatArray;
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

  addTriangleColor(c1: BABYLON.Color3, c2: BABYLON.Color3, c3: BABYLON.Color3) {
    this.colors.push(c1);
    this.colors.push(c2);
    this.colors.push(c3);
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

  // per vertice one type
  addTriangleTerrainTypes(types: BABYLON.Vector3) {
    this.terrainTypes.push(types);
    this.terrainTypes.push(types);
    this.terrainTypes.push(types);
  }

  addQuadTerrainTypes(types: BABYLON.Vector3) {
    this.terrainTypes.push(types);
    this.terrainTypes.push(types);
    this.terrainTypes.push(types);
    this.terrainTypes.push(types);
  }

  addQuadColorDouble(c1: BABYLON.Color3, c2: BABYLON.Color3) {
    this.addQuadColor(c1, c1, c2, c2);
  }

  addQuadColor(c1: BABYLON.Color3, c2: BABYLON.Color3, c3: BABYLON.Color3, c4: BABYLON.Color3) {
    this.colors.push(c1);
    this.colors.push(c2);
    this.colors.push(c3);
    this.colors.push(c4);
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
    //if (!cell.isMountainCell && neighbor.isMountainCell) {
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
      //return;
    //}


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
    this.triangulateEdgeSlope(v1, e1, cell, v3, e3, neighbor, HexCell.color1, HexCell.color2);
    this.triangulateEdgeSlope(e1, e2, cell, e3, e4, neighbor, HexCell.color1, HexCell.color2);
    this.triangulateEdgeSlope(e2, v2, cell, e4, v4, neighbor, HexCell.color1, HexCell.color2);

    let nextNeighbor = cell.getNeighbor(HexDirectionExtension.next(direction));

    // handle mountain neighbor, no need for an edge triangle
    /*if (nextNeighbor && nextNeighbor.isMountainCell) {
      return;
    }*/

    
    // add corner triangles
    // Explenation from Tutorial: 
    // Because three cells share one triangular connection, we only need to add them for two connections. So just NE and E will do.
    if (direction <= HexDirection.E && nextNeighbor != null) {
      let bridge = HexMetrics.getBridge(HexDirectionExtension.next(direction));
      let v5 = v2.add(bridge);
      v5.y = nextNeighbor.elevation;

      if (cell.elevation <= neighbor.elevation) {
        if (cell.elevation <= nextNeighbor.elevation) {
          this.triangulateCorner(v2, cell, v4, neighbor, v5, nextNeighbor, HexCell.color1, HexCell.color2, HexCell.color3);
        }
        else {
          this.triangulateCorner(v5, nextNeighbor, v2, cell, v4, neighbor, HexCell.color1, HexCell.color2, HexCell.color3);
        }
      }
      else if (neighbor.elevation <= nextNeighbor.elevation) {
        this.triangulateCorner(v4, neighbor, v5, nextNeighbor, v2, cell, HexCell.color1, HexCell.color2, HexCell.color3);
      }
      else {
        this.triangulateCorner(v5, nextNeighbor, v2, cell, v4, neighbor, HexCell.color1, HexCell.color2, HexCell.color3);
      }
    }
  }

  triangulateEdgeSlope(
    beginLeft: BABYLON.Vector3, beginRight: BABYLON.Vector3, beginCell: HexCell,
    endLeft: BABYLON.Vector3, endRight: BABYLON.Vector3, endCell: HexCell,
    color1: BABYLON.Color3, color2: BABYLON.Color3,
  ) {
    let t1 = beginCell.terrainTypeIndex;
    let t2 = endCell.terrainTypeIndex;

    // first quads row
    let v3 = HexMetrics.TerraceLerp(beginLeft, endLeft, 1.0);
    let v4 = HexMetrics.TerraceLerp(beginRight, endRight, 1.0);
    let c2 = HexMetrics.TerraceLerpColor(color1, color2, 1.0);

    this.triangulateEdgeSlopePart(beginLeft, beginRight, v3, v4, color1, t1, c2, t2);

    // quad rows in between
    for (let i = 2.0; i < HexMetrics.terraceSteps; i++) {
      // need to create new object as JS will reference the objects
      let v1 = new BABYLON.Vector3(v3.x, v3.y, v3.z);
      let v2 = new BABYLON.Vector3(v4.x, v4.y, v4.z);
      let c1 = new BABYLON.Color3(c2.r, c2.g, c2.b);

      v3 = HexMetrics.TerraceLerp(beginLeft, endLeft, i);
      v4 = HexMetrics.TerraceLerp(beginRight, endRight, i);
      c2 = HexMetrics.TerraceLerpColor(color1, color2, i);

      this.triangulateEdgeSlopePart(v1, v2, v3, v4, c1, t1, c2, t2);
    }

    // last quads row
    this.triangulateEdgeSlopePart(v3, v4, endLeft, endRight, c2, t1, color2, t2);
  }

  triangulateEdgeSlopePart(
    v1: BABYLON.Vector3,
    v2: BABYLON.Vector3,
    v3: BABYLON.Vector3,
    v4: BABYLON.Vector3,
    c1: BABYLON.Color3,
    type1: any,
    c2: BABYLON.Color3,
    type2: any,
    hasRoad: Boolean = false
  ) {
    this.addQuad(v1, v2, v3, v4);
    this.addQuadColorDouble(c1, c2);

    let types = new BABYLON.Vector3(type1, type2, type1);
    this.addQuadTerrainTypes(types);
  }

  triangulateCorner(
    begin: BABYLON.Vector3, beginCell: HexCell,
    left: BABYLON.Vector3, leftCell: HexCell,
    right: BABYLON.Vector3, rightCell: HexCell,
    color1: BABYLON.Color3, color2: BABYLON.Color3, color3: BABYLON.Color3
  ) {
    let types = new BABYLON.Vector3(beginCell.terrainTypeIndex, leftCell.terrainTypeIndex, rightCell.terrainTypeIndex);

    // bottom -> red, left -> green, right -> blue
    let v5 = null;
    let v6 = null;
    let v7 = null;
    let v8 = null;

    // center color
    let c5 = HexMetrics.mix3Colors(color1, color2, color3);
    let c6 = null;
    let c7 = null;
    let c8 = null;
    let c9 = HexMetrics.TerraceLerpColor(color2, color3, 1.0);
    let c10 = HexMetrics.TerraceLerpColor(color2, color3, 2.0);
    let c11 = HexMetrics.TerraceLerpColor(color2, color3, 3.0);
    let c12 = HexMetrics.TerraceLerpColor(color2, color3, 4.0);
    let c13 = HexMetrics.TerraceLerpColor(color2, color3, 5.0);

    // first row, start triangle, at the bottom
    let v3 = HexMetrics.TerraceLerp(begin, left, 1.0);
    let v4 = HexMetrics.TerraceLerp(begin, right, 1.0);

    let c3 = HexMetrics.TerraceLerpColor(color1, color2, 1.0);
    let c4 = HexMetrics.TerraceLerpColor(color1, color3, 1.0);

    this.addTriangle(begin, v3, v4);
    this.addTriangleColor(color1, c3, c4);
    this.addTriangleTerrainTypes(types);

    for (let q = 2.0; q <= HexMetrics.terraceSteps; q++) {
      let v1 = new BABYLON.Vector3(v3.x, v3.y, v3.z);
      let v2 = new BABYLON.Vector3(v4.x, v4.y, v4.z);
      let c1 = new BABYLON.Color3(c3.r, c3.g, c3.b);
      let c2 = new BABYLON.Color3(c4.r, c4.g, c4.b);

      v3 = HexMetrics.TerraceLerp(begin, left, q);
      v4 = HexMetrics.TerraceLerp(begin, right, q);

      c3 = HexMetrics.TerraceLerpColor(color1, color2, q);
      c4 = HexMetrics.TerraceLerpColor(color1, color3, q);

      // add Quad Rows
      // all up to the last 3 rows
      if (q <= HexMetrics.terraceSteps - 3) {
        this.addQuad(v1, v2, v3, v4);
        this.addQuadColor(c1, c2, c3, c4);
        
        this.addQuadTerrainTypes(types);
      }

      // third last row, all triangles
      if (q == HexMetrics.terraceSteps - 2) {
        // get horizontal point
        v5 = HexMetrics.TerraceLerp(v3, v4, 3.0);

        this.addTriangle(v1, v3, v5); // left
        this.addTriangle(v5, v2, v1); // middle
        this.addTriangle(v2, v5, v4); // right

        this.addTriangleColor(c1, c3, c5); // left
        this.addTriangleColor(c5, c2, c1); // middle
        this.addTriangleColor(c2, c5, c4); // right

        this.addTriangleTerrainTypes(types);
        this.addTriangleTerrainTypes(types);
        this.addTriangleTerrainTypes(types);
      }

      // second last row
      if (q == HexMetrics.terraceSteps - 1) {
        // get horizontal point
        v6 = HexMetrics.TerraceLerp(v3, v4, 2.0); // left
        v7 = HexMetrics.TerraceLerp(v3, v4, 3.0); // middle
        v8 = HexMetrics.TerraceLerp(v3, v4, 4.0); // right

        // mix colors
        c6 = HexMetrics.mix2Colors(c1, c10);
        c7 = HexMetrics.mix2Colors(c5, c11);
        c8 = HexMetrics.mix2Colors(c2, c12);

        // triangles
        this.addTriangle(v1, v3, v6); // left
        this.addTriangle(v8, v4, v2); // right

        this.addTriangleColor(c1, c3, c6);
        this.addTriangleColor(c8, c4, c2);

        this.addTriangleTerrainTypes(types);
        this.addTriangleTerrainTypes(types);

        // quads
        this.addQuad(v1, v5, v6, v7); // left
        this.addQuad(v5, v2, v7, v8); // right

        this.addQuadColor(c1, c5, c6, c7);
        this.addQuadColor(c5, c2, c7, c8);

        this.addQuadTerrainTypes(types);
        this.addQuadTerrainTypes(types);
      }

      // last row
      if (q == HexMetrics.terraceSteps) {
        let v9 = HexMetrics.TerraceLerp(v3, v4, 1.0);
        let v10 = HexMetrics.TerraceLerp(v3, v4, 2.0);
        let v11 = HexMetrics.TerraceLerp(v3, v4, 3.0);
        let v12 = HexMetrics.TerraceLerp(v3, v4, 4.0);
        let v13 = HexMetrics.TerraceLerp(v3, v4, 5.0);

        this.addTriangle(v1, v3, v9); // left
        this.addTriangle(v2, v13, v4); // right

        this.addTriangleColor(c1, c3, c9);
        this.addTriangleColor(c2, c13, c4);

        this.addTriangleTerrainTypes(types);
        this.addTriangleTerrainTypes(types);

        this.addQuad(v8, v2, v12, v13);
        this.addQuad(v7, v8, v11, v12);
        this.addQuad(v6, v7, v10, v11);
        this.addQuad(v1, v6, v9, v10);

        this.addQuadColor(c8, c2, c12, c13);
        this.addQuadColor(c7, c8, c11, c12);
        this.addQuadColor(c6, c7, c10, c11);
        this.addQuadColor(c1, c6, c9, c10);

        this.addQuadTerrainTypes(types);
        this.addQuadTerrainTypes(types);
        this.addQuadTerrainTypes(types);
        this.addQuadTerrainTypes(types);      
      }
    }
  }

  triangulate(engine) {
    // hexagon is separated in 6 pieces
    for (let i = 0; i < 6; i++) {
      this.triangulateInner(i, this, this.terrainTypeIndex);
    }

    // merge verticedata to one single flat array
    this.vertices.forEach(verticeArray => {
      let verticeArrayRaw = [verticeArray.x, verticeArray.y, verticeArray.z];
      this.positions = this.positions.concat(verticeArrayRaw);
    })

    // merge verticedata to one single flat array
    this.terrainTypes.forEach(terrainTypeArrayElement => {
      this.terrainTypesFlatArray.push(terrainTypeArrayElement.x);
      this.terrainTypesFlatArray.push(terrainTypeArrayElement.y);
      this.terrainTypesFlatArray.push(terrainTypeArrayElement.z);
    })

    // merge color data to one single flat array
    let colorsFinal = [];
    this.colors.forEach(colorArrayElement => {
      colorsFinal.push(colorArrayElement.r);
      colorsFinal.push(colorArrayElement.g);
      colorsFinal.push(colorArrayElement.b);
      colorsFinal.push(1.0);
    })

    //Empty array to contain calculated values or normals added
    var normals = [];

    //Calculations of normals added
    BABYLON.VertexData.ComputeNormals(this.positions, this.indices, normals);

    let vertexData = new BABYLON.VertexData();
    vertexData.colors = colorsFinal;
    vertexData.positions = this.positions;
    vertexData.indices = this.indices;
    vertexData.normals = normals;
   
    vertexData.applyToMesh(this.mesh, true);
  }

  triangulateInner(direction: HexDirection, cell: HexCell, terrainType: number) {
    // inner vertices
    let v1 = this.center.add(HexMetrics.getFirstSolidCorner(direction));
    let v2 = this.center.add(HexMetrics.getSecondSolidCorner(direction));

    let e1 = BABYLON.Vector3.Lerp(v1, v2, 1.0 / 3.0);
    let e2 = BABYLON.Vector3.Lerp(v1, v2, 2.0 / 3.0);

    // add inner triangles, 3 pieces
    this.addTriangle(this.center, v1, e1)
    this.addTriangle(this.center, e1, e2)
    this.addTriangle(this.center, e2, v2)

    // add color
    this.addTriangleColor(HexCell.color1, HexCell.color1, HexCell.color1);
    this.addTriangleColor(HexCell.color1, HexCell.color1, HexCell.color1);
    this.addTriangleColor(HexCell.color1, HexCell.color1, HexCell.color1);

    // add terrainTypes
    let types = new BABYLON.Vector3(terrainType, terrainType, terrainType);
    this.addTriangleTerrainTypes(types);
    this.addTriangleTerrainTypes(types);
    this.addTriangleTerrainTypes(types);

    //if (cell.isMountainCell) {
      if (cell.neighbors[direction]) {
        //if (!cell.neighbors[direction].isMountainCell) {
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
       // }
      };
    //}

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