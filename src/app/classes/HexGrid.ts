import { nextTick } from "node:process";
import { HexCell } from "../classes/HexCell";
import { HexMetrics } from "../classes/HexMetrics";
import { HexDirection } from "../enums/HexDirection.enum";
import { HexCoordinates } from "./HexCoordinates";
import * as BABYLON from "babylonjs";
import MeshWriter from "meshwriter";
import * as earcut from "earcut";
(window as any).earcut = earcut;

function increaseFacets(mesh, pps) { //pps points per side        
  var _gaps = pps + 1;
  var _n = _gaps + 1;
  var _fvs = [];
  for (var _i = 0; _i < _n; _i++) {
    _fvs[_i] = [];
  }
  var _A, _B;
  var _d = { x: 0, y: 0, z: 0 };
  var _u = { x: 0, y: 0 };
  var _indices = [];
  var _vertexIndex = [];
  var _side = [];
  var _l; //holds lengths
  var _uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
  var _meshIndices = mesh.getIndices();
  var _positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  var _normals = [];

  for (var _i = 0; _i < _meshIndices.length; _i += 3) {
    _vertexIndex[0] = _meshIndices[_i];
    _vertexIndex[1] = _meshIndices[_i + 1];
    _vertexIndex[2] = _meshIndices[_i + 2];
    for (var _j = 0; _j < 3; _j++) {
      _A = _vertexIndex[_j];
      _B = _vertexIndex[(_j + 1) % 3];
      if (_side[_A] === undefined && _side[_B] === undefined) {
        _side[_A] = [];
        _side[_B] = [];
      }
      else {
        if (_side[_A] === undefined) {
          _side[_A] = [];
        }
        if (_side[_B] === undefined) {
          _side[_B] = [];
        }
      }
      if (_side[_A][_B] === undefined && _side[_B][_A] === undefined) {
        _side[_A][_B] = [];
        _d.x = (_positions[3 * _B] - _positions[3 * _A]) / _gaps;
        _d.y = (_positions[3 * _B + 1] - _positions[3 * _A + 1]) / _gaps;
        _d.z = (_positions[3 * _B + 2] - _positions[3 * _A + 2]) / _gaps;
        _u.x = (_uvs[2 * _B] - _uvs[2 * _A]) / _gaps;
        _u.y = (_uvs[2 * _B + 1] - _uvs[2 * _A + 1]) / _gaps;
        _side[_A][_B].push(_A);
        for (var _k = 1; _k < _gaps; _k++) {
          _side[_A][_B].push(_positions.length / 3);
          _positions.push(_positions[3 * _A] + _k * _d.x, _positions[3 * _A + 1] + _k * _d.y, _positions[3 * _A + 2] + _k * _d.z);
          _uvs.push(_uvs[2 * _A] + _k * _u.x, _uvs[2 * _A + 1] + _k * _u.y);
        }
        _side[_A][_B].push(_B);
        _side[_B][_A] = [];
        _l = _side[_A][_B].length;
        for (var _a = 0; _a < _l; _a++) {
          _side[_B][_A][_a] = _side[_A][_B][_l - 1 - _a];
        }
      }
      else {
        if (_side[_A][_B] === undefined) {
          _side[_A][_B] = [];
          _l = _side[_B][_A].length;
          for (var _a = 0; _a < _l; _a++) {
            _side[_A][_B][_a] = _side[_B][_A][_l - 1 - _a];
          }
        }
        if (_side[_B][_A] === undefined) {
          _side[_B][_A] = [];
          _l = _side[_A][_B].length;
          for (var _a = 0; _a < _l; _a++) {
            _side[_B][_A][_a] = _side[_A][_B][_l - 1 - _a];
          }
        }
      }
    }
    _fvs[0][0] = _meshIndices[_i];
    _fvs[1][0] = _side[_meshIndices[_i]][_meshIndices[_i + 1]][1];
    _fvs[1][1] = _side[_meshIndices[_i]][_meshIndices[_i + 2]][1];
    for (var _k = 2; _k < _gaps; _k++) {
      _fvs[_k][0] = _side[_meshIndices[_i]][_meshIndices[_i + 1]][_k];
      _fvs[_k][_k] = _side[_meshIndices[_i]][_meshIndices[_i + 2]][_k];
      _d.x = (_positions[3 * _fvs[_k][_k]] - _positions[3 * _fvs[_k][0]]) / _k;
      _d.y = (_positions[3 * _fvs[_k][_k] + 1] - _positions[3 * _fvs[_k][0] + 1]) / _k;
      _d.z = (_positions[3 * _fvs[_k][_k] + 2] - _positions[3 * _fvs[_k][0] + 2]) / _k;
      _u.x = (_uvs[2 * _fvs[_k][_k]] - _uvs[2 * _fvs[_k][0]]) / _k;
      _u.y = (_uvs[2 * _fvs[_k][_k] + 1] - _uvs[2 * _fvs[_k][0] + 1]) / _k;
      for (var _j = 1; _j < _k; _j++) {
        _fvs[_k][_j] = _positions.length / 3;
        _positions.push(_positions[3 * _fvs[_k][0]] + _j * _d.x, _positions[3 * _fvs[_k][0] + 1] + _j * _d.y, _positions[3 * _fvs[_k][0] + 2] + _j * _d.z);
        _uvs.push(_uvs[2 * _fvs[_k][0]] + _j * _u.x, _uvs[2 * _fvs[_k][0] + 1] + _j * _u.y);
      }
    }
    _fvs[_gaps] = _side[_meshIndices[_i + 1]][_meshIndices[_i + 2]];

    _indices.push(_fvs[0][0], _fvs[1][0], _fvs[1][1]);
    for (var _k = 1; _k < _gaps; _k++) {
      for (var _j = 0; _j < _k; _j++) {
        _indices.push(_fvs[_k][_j], _fvs[_k + 1][_j], _fvs[_k + 1][_j + 1]);
        _indices.push(_fvs[_k][_j], _fvs[_k + 1][_j + 1], _fvs[_k][_j + 1]);
      }
      _indices.push(_fvs[_k][_j], _fvs[_k + 1][_j], _fvs[_k + 1][_j + 1]);
    }

  }

  var vertexData = new BABYLON.VertexData();
  vertexData.positions = _positions;
  vertexData.indices = _indices;
  vertexData.uvs = _uvs;

  BABYLON.VertexData.ComputeNormals(_positions, _indices, _normals);
  vertexData.normals = _normals;

  vertexData.applyToMesh(mesh);

}
export class HexGrid {
  private cells: HexCell[];
  private scene;
  private mat;
  private width;
  private height;
  private mergedMesh;
  private heightMapResolution;
  private heightMapStepsWidth;
  private heightMapStepsHeight;
  private heightMapPixels;
  private writer;

  private enableRTT = true;

  private stepHeight = 0.3;
  private mountainHeight = 5.0;



  findDistancesTo(cell: HexCell) {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i].distance = 0;
    }
  }

  getMergedMesh() {
    return this.mergedMesh;
  }

  private build() {
    // i, index, ongoing number
    for (let z = 0, i = 0; z < this.height; z++) {
      for (let x = 0; x < this.width; x++) {
        // find the index
        let heightMapPixelIndex =
          (z * this.heightMapStepsHeight * this.heightMapResolution.height +
            x * this.heightMapStepsWidth) *
          4;

        // get color of pixels, add them up and calc. average
        // color value 0-255, so we divide by 255 to get the values between 0-1.0
        let heightBase =
          (this.heightMapPixels[heightMapPixelIndex] +
            this.heightMapPixels[heightMapPixelIndex + 1] +
            this.heightMapPixels[heightMapPixelIndex + 2]) /
          3.0 /
          255.0;

        // Height calculation
        let height = heightBase * 2.0 - 1.0;
        height = Math.pow(height, 3.0) * 20.0;

        // create steps
        height = Math.ceil(height / this.stepHeight) * this.stepHeight;

        // Todo: fix water wave issue

        // create cell
        this.createCell(x, z, i++, height);
      }
    }

    let tmpMeshes = [];
    let mountainCells = [];
    let mountainMeshed = [];

    // triangulate
    this.cells.forEach((cell) => {
      // console.log("TRIANGULATE CELL: " + cell.name);
      // console.log(cell);

      cell.triangulate();

      // this cell is on the edge of a mountain
      if (cell.isMountainCell) {
        mountainCells.push(cell);
      }

      // hex mountain cells are not rendered 
      if (!cell.isMountainCell) {
        tmpMeshes.push(cell.mesh);
      }
    });

    console.log(mountainCells);

    // build mountains
    mountainCells.forEach((cell) => {
      console.log(cell);
      let out = [];
      // we found a lonely mountain
      if (cell.mountainPath.length == 6 && cell.isMountainEdgeCell) {
        let mountainName = "mountain_" + cell.name;
        console.log(cell.mountainPath)
        let tmp1 = [];
        let tmp2 = [];

        console.log(JSON.stringify(cell.mountainPath))

        for (let i = 0; i < cell.mountainPath.length /2; i++) {
          if (cell.mountainPath[i] && cell.mountainPath[i].vertices) {
            cell.mountainPath[i].vertices.forEach(element => {
              if (element) {
                tmp1.push(element);
              }
              let newObject = {
                x: element.x,
                y: element.y,
                z: element.z
              }
            
              out.push(newObject);
     
            });
          }
        }

        
        for (let e = cell.mountainPath.length / 2; e < cell.mountainPath.length; e++) {
          if (cell.mountainPath[e] && cell.mountainPath[e].vertices) {
            cell.mountainPath[e].vertices.forEach(element => {
              if (element) {
                tmp2.push(element);
                let newObject = {
                  x: element.x,
                  y: element.y,
                  z: element.z
                }
              
                out.push(newObject);
              }
            });
          }
        }

        /*console.log(JSON.stringify(out));
        console.log(JSON.stringify(tmp1));
        console.log(JSON.stringify(tmp2));*/

        let mountainMesh = null;
        if (tmp1.length == tmp2.length) {
          mountainMesh = BABYLON.MeshBuilder.CreateRibbon(mountainName, { pathArray: [tmp1, tmp2], updatable: true}, this.scene);
          mountainMesh.position = new BABYLON.Vector3(-200, 6, -200);
          mountainMesh.material = new BABYLON.StandardMaterial("test", this.scene);
          mountainMesh.material.wireframe = true;
          mountainMesh.increaseVertices(2);
        }


        /*
        cell.mountainPath.forEach((mountainPath) => {
          mountainPath.vertices.forEach(element => {
            tmp.push(element);

          });
        })*/


        //mountainMesh.material.wireframe = true;
        //increaseFacets(mountainMesh,2);
        //mountainMesh.increaseVertices(2);

        //mountainMesh.position.x = mountainMesh.position.x - 200;
        //mountainMesh.position.z = mountainMesh.position.z - 200;
        //console.log(mountainMesh);
        //let mountainObject = 

        //const polygon_triangulation = new BABYLON.PolygonMeshBuilder("POLYGON222" + cell.name, tmp, this.scene);
        //const polygon = polygon_triangulation.build();

        //polygon.position = new BABYLON.Vector3(-200,6,-200);
      }
    });

    this.mergedMesh = BABYLON.Mesh.MergeMeshes(tmpMeshes, true, true);
    // todo: find out why the faces point downwards

    this.mergedMesh.wireframe =true;
    this.mergedMesh.flipFaces(true);
    //this.mergedMesh.forceSharedVertices();
    //this.mergedMesh.increaseVertices(20);
    console.log(this.mergedMesh)
  }

  constructor(gridWidth, gridHeight, heightMapTexture, scene) {

    //this.writer = MeshWriter(scene, { scale: .25, defaultFont: "Arial" });

    this.heightMapResolution = heightMapTexture.getSize();
    this.heightMapStepsWidth = Math.floor(this.heightMapResolution.width / gridWidth);
    this.heightMapStepsHeight = Math.floor(
      this.heightMapResolution.height / gridHeight
    );

    this.heightMapPixels = heightMapTexture.readPixels();

    this.scene = scene;
    this.cells = new Array(gridHeight * gridWidth);
    this.width = gridWidth;
    this.height = gridHeight;

    this.build();

    if (this.enableRTT) {
      const planeRTT = BABYLON.MeshBuilder.CreatePlane('rttPlane', { width: 50, height: 50 }, this.scene);
      planeRTT.setPositionWithLocalVector(new BABYLON.Vector3(100, 50, -50));

      const rttMaterial = new BABYLON.StandardMaterial('RTT material', this.scene);
      // @ts-ignore
      rttMaterial.emissiveTexture = heightMapTexture;
      rttMaterial.disableLighting = true;
      planeRTT.material = rttMaterial;
    }
  }

  createCell(x, z, i, elevation) {
    let position = new BABYLON.Vector3();

    // offset odd rows
    if (z % 2.0 != 0) {
      position.x = (x + 0.5) * HexMetrics.innerRadius;
    } else {
      position.x = x * HexMetrics.innerRadius;
    }

    position.y = elevation; //* HexMetrics.elevationStep;
    position.z = z * HexMetrics.outerRadius * 0.75;

    let isMountainCell = false;
    if (elevation >= this.mountainHeight) {
      isMountainCell = true;
    }

    let cell = (this.cells[i] = new HexCell(position, isMountainCell));

    // set hex object world position
    // x & z only -> we will mess uf y
    cell.mesh.position.x = position.x;
    cell.mesh.position.z = position.z;

    // set hex coordinates
    let coordinates = HexCoordinates.fromOffsetCoordinates(x, z);
    cell.coordinates = coordinates;


    /*
    //Set width an height for plane
    var planeWidth = 7;
    var planeHeight = 7;

    //Create plane
    var plane = BABYLON.MeshBuilder.CreatePlane("plane", { width: planeWidth, height: planeHeight }, this.scene);

    //Set width and height for dynamic texture using same multiplier
    var DTWidth = planeWidth * 60;
    var DTHeight = planeHeight * 60;

    //Create dynamic texture
    var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", { width: DTWidth, height: DTHeight }, this.scene, false);

    //Set font type
    var font_type = "Arial";

    //Check width of text for given font type at any size of font
    var ctx = dynamicTexture.getContext();
    var size = 12; //any value will work
    ctx.font = size + "px " + font_type;
    var textWidth = ctx.measureText(coordinates.toString()).width;

    //Calculate ratio of text width to size of font used
    var ratio = textWidth / size;

    //set font to be actually used to write text on dynamic texture
    var font_size = Math.floor(DTWidth / (ratio * 1)); //size of multiplier (1) can be adjusted, increase for smaller text
    var font = font_size + "px " + font_type;

    //Draw text
    dynamicTexture.drawText(coordinates.toString(), null, null, font, "#000000", "#ffffff", true);

    //create material
    var mat = new BABYLON.StandardMaterial("mat", this.scene);
    mat.diffuseTexture = dynamicTexture;

    //apply material
    plane.material = mat;
    plane.position.x = position.x;
    plane.position.z = position.z;
    //plane.position.y = elevation + 1.0;*/

    // find neighbors
    if (x > 0) {
      cell.setNeighbor(HexDirection.W, this.cells[i - 1]);
    }
    if (z > 0) {
      if ((z & 1) == 0) {
        cell.setNeighbor(HexDirection.SE, this.cells[i - this.width]);
        if (x > 0) {
          cell.setNeighbor(HexDirection.SW, this.cells[i - this.width - 1]);
        }
      } else {
        cell.setNeighbor(HexDirection.SW, this.cells[i - this.width]);
        if (x < this.width - 1) {
          cell.setNeighbor(HexDirection.SE, this.cells[i - this.width + 1]);
        }
      }
    }
  }
}
