import { HexCell } from '../classes/HexCell';
import { HexMetrics } from '../classes/HexMetrics';
import { HexDirection } from '../enums/HexDirection.enum';
import {Subject} from 'rxjs';

export class HexGrid {
  private cells: HexCell[];
  private scene;
  private mat;
  private width;
  private height;
  private mergedMesh;

  private generatedTerrainSubject : Subject<any> = new Subject();
  

  getMergedMesh(){
    return this.mergedMesh;
  }

  constructor(gridWidth, gridHeight, heightMapTexture, scene) {
    //console.log(heightMapResolution);
    //console.log(HexMetrics.outerRadius);
    let heightMapResolution = heightMapTexture.getSize();
    let heightMapStepsWidth = Math.floor(heightMapResolution.width / gridWidth);
    let heightMapStepsHeight = Math.floor(heightMapResolution.height / gridHeight);
    

    let heightMapPixels = heightMapTexture.readPixels();
    console.log(heightMapPixels);
    //let gridHeight = Math.floor(heightMapResolution / HexMetrics.outerRadius);
    //let gridWidth = Math.floor(heightMapResolution / HexMetrics.innerRadius);

    console.log(gridWidth);
    console.log(gridHeight);

    this.scene = scene;
    this.cells = new Array(gridHeight * gridWidth);
    this.width = gridWidth;
    this.height = gridHeight;

    var texture = new BABYLON.Texture("https://catlikecoding.com/unity/tutorials/hex-map/part-4/noise/noise.png", scene);
    texture.onLoadObservable.add(() => {
      HexMetrics.noiseTexturePixels = texture.readPixels();
      HexMetrics.noiseTextureSize = texture.getSize();

      // i, index, ongoing number
      for (let z = 0, i = 0; z < gridHeight; z++) {
        for (let x = 0; x < gridWidth; x++) {
          // find the index
          let heightMapPixelIndex = ((z * heightMapStepsHeight * heightMapResolution.height) + (x * heightMapStepsWidth)) * 4;
          
          // get color of pixels, add them up and calc. average
          // color value 0-255, so we divide by 255 to get the values between 0-1.0
          let heightBase = (heightMapPixels[heightMapPixelIndex] + heightMapPixels[heightMapPixelIndex + 1] + heightMapPixels[heightMapPixelIndex + 2]) / 3.0 / 255.0;
          
          // Height calculation 
          let height = heightBase * 2.0 - 1.0;
          height = Math.pow(height, 3.0) * 20.0;
          
          // create stepps in 3points
          
          console.log(height);
          height = Math.ceil(height/4) * 4;
          console.log(height)

          // create cell
          this.createCell(x, z, i++, height);
          
        }
      }

      let tmpMeshes = [];
      // triangulate
      this.cells.forEach(cell => {
        // console.log("TRIANGULATE CELL: " + cell.name);
        // console.log(cell);

        cell.triangulate();
        tmpMeshes.push(cell.mesh);

        /*let mat = new BABYLON.StandardMaterial('mat', this.scene);
        mat.diffuseColor = new BABYLON.Color3(1, 0, 1);
        mat.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        mat.ambientColor = new BABYLON.Color3(0.23, 0.98, 0.53);
        mat.wireframe = true;

        let numberOfNeighbors = Object.keys(cell.neighbors).length;
        //numberOfNeighbors = 7;

        switch (numberOfNeighbors.toString()) {
          case '1': {
            mat.emissiveColor = new BABYLON.Color3(1, 0, 1);
            break;
          }
          case '2': {
            mat.emissiveColor = new BABYLON.Color3(0, 0.5, 0.96);
            break;
          }
          case '3': {
            mat.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
            break;
          }
          case '4': {
            mat.emissiveColor = new BABYLON.Color3(0, 0, 1);
            break;
          }
          case '5': {
            mat.emissiveColor = new BABYLON.Color3(0, 1, 0);
            break;
          }
          case '6': {
            mat.emissiveColor = new BABYLON.Color3(1, 0, 0);
            break;
          }
          default: {
            break;
          }
        }


        cell.mesh.material = mat;*/
      })
       
      
      this.mergedMesh = BABYLON.Mesh.MergeMeshes(tmpMeshes, true);
      console.log("MERGED");
      this.generatedTerrainSubject.next(this.mergedMesh)

    });
  }

  subscribe(){
    return this.generatedTerrainSubject;
  }

  createCell(x, z, i, elevation) {
    let position = new BABYLON.Vector3;

    // offset odd rows
    if (z % 2.0 != 0) {
      position.x = (x + 0.5) * HexMetrics.innerRadius;
    } else {
      position.x = x * HexMetrics.innerRadius;
    }

    position.y = elevation; //* HexMetrics.elevationStep;
    position.z = z * HexMetrics.outerRadius * 0.75;

    let cell = this.cells[i] = new HexCell(position);

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
      }
      else {
        cell.setNeighbor(HexDirection.SW, this.cells[i - this.width]);
        if (x < this.width - 1) {
          cell.setNeighbor(HexDirection.SE, this.cells[i - this.width + 1]);
        }
      }
    }

    //console.log(cell.neighbors);

    this.scene.meshes.push(cell.mesh);
  }
}