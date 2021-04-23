import { nextTick } from "node:process";
import { HexCell } from "../classes/HexCell";
import { HexMetrics } from "../classes/HexMetrics";
import { HexDirection } from "../enums/HexDirection.enum";
import { HexCoordinates } from "./HexCoordinates";
import * as BABYLON from "babylonjs";
import MeshWriter from "meshwriter";
import * as earcut from "earcut";
(window as any).earcut = earcut;


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
  public colors = [];
  public defaultColor = new BABYLON.Color3(1,1,0);

  
  private enableRTT = true;

  private stepHeight = 0.3;
  private mountainHeight = 5.0;

  getCells(){
    return this.cells;
  }

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

      cell.mesh.flipFaces(true);
      
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

    //this.mergedMesh = BABYLON.Mesh.MergeMeshes(tmpMeshes, true, true);
    // todo: find out why the faces point downwards

    //this.mergedMesh.wireframe =true;
    //this.mergedMesh.flipFaces(true);
    //this.mergedMesh.forceSharedVertices();
    //this.mergedMesh.increaseVertices(20);
    //console.log(this.mergedMesh)
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

    cell.color = this.defaultColor;

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
