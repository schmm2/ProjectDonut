import { HexCell } from "../classes/HexCell";
import { HexMetrics } from "../classes/HexMetrics";
import { HexDirection } from "../enums/HexDirection.enum";
import { Subject } from "rxjs";
import { AssetLoaderService } from "../services/asset-loader.service";

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

  private enableRTT = false;
  
  private stepHeight = 4.0;

  getMergedMesh() {
    return this.mergedMesh;
  }

  private build(){
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

        // create cell
        this.createCell(x, z, i++, height);
      }
    }

    let tmpMeshes = [];
    // triangulate
    this.cells.forEach((cell) => {
      // console.log("TRIANGULATE CELL: " + cell.name);
      // console.log(cell);

      cell.triangulate();
      tmpMeshes.push(cell.mesh);
    });

    this.mergedMesh = BABYLON.Mesh.MergeMeshes(tmpMeshes, true);
  }

  constructor(gridWidth, gridHeight, heightMapTexture, scene) {

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

    if(this.enableRTT){
      const planeRTT = BABYLON.MeshBuilder.CreatePlane('rttPlane', {width: 50, height: 50}, this.scene);
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

    let cell = (this.cells[i] = new HexCell(position));

    // set hex object world position
    // x & z only -> we will mess uf y
    cell.mesh.position.x = position.x;
    cell.mesh.position.z = position.z;

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
    //this.scene.meshes.push(cell.mesh);
  }
}
