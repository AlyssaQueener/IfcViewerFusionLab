// TUM CMS 2025
// Sebastian Esser and André Borrmann

// import nodejs packages that you must have installed using npm install beforehand.
// you can run npm i .
// all relevant packages are specified in the package.json file.

import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/components-front";
import * as WEBIFC from "web-ifc";
import * as CUI from "@thatopen/ui-obc";
import * as OBF from "@thatopen/components-front";

// The following output checks if all packages are successfully imported.
// console.log(THREE);
// console.log(WEBIFC);
// console.log(BUI);
// console.log(OBC);

// get the viewer container from the html document
const container = document.getElementById("viewerContainer");




// check if the viewer container is found in the html file.
//const container = viewerContainer;
if (!container) {
  throw new Error("HTML container element not found!");
}

// specify some variables that will be used later on.
let components, world, fragmentIfcLoader, fragments;

// create a new instance of the ThatOpenCompany components class and initialize it.
components = new OBC.Components();
components.init();

// create a new world component. -> root object to build up scene
const worlds = components.get(OBC.Worlds);
world = worlds.create();

// create a new scene, renderer and camera component (very similar to the three.js concepts).
world.scene = new OBC.SimpleScene(components);
world.scene.setup();
world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.SimpleCamera(components); //already enables some controls


// set the defailt camera position setLookat(cameraposition, target)
world.camera.controls.setLookAt(10, 5.5, 5, -4, -1, -6.5);

// optionally: add a grid to the scene.
const grids = components.get(OBC.Grids);
grids.create(world);

// ---- ---- so far, it was more or less Three.js setup ---- ----
//Converting IFC to Fragments first makes things faster -> api available
// create a new fragment manager and ifc loader component.
// Here, the processing of the IFC file starts.
fragments = components.get(OBC.FragmentsManager);
fragmentIfcLoader = components.get(OBC.IfcLoader);

await fragmentIfcLoader.setup();

// optionally, specify IFC classes that should be excluded from the loading process.

const excludedCats = [
  WEBIFC.IFCREINFORCINGELEMENT,
  // WEBIFC.IFCWALLSTANDARDCASE
];

for (const cat of excludedCats) {
  fragmentIfcLoader.settings.excludedCategories.add(cat);
}

// load the IFC file from the specified URL.

try {
  // you can fetch any IFC model from any server using the technology discussed in the AJAX lecture.
  // A potential way is to create an express server that serves the IFC file along with the html
  const file = await fetch("data/AC20-FZK-Haus.ifc");
  // process the response
  const data = await file.arrayBuffer();
  const buffer = new Uint8Array(data);
  // create fragments from the IFC file.
  // The fragments are the actual 3D objects that are displayed in the viewer.
  const model = await fragmentIfcLoader.load(buffer);
  // add the model to the scene and specify a name for it.
  model.name = "house";
  world.scene.three.add(model);
} catch (error) {
  console.error("Error loading IFC:", error);
}

// --- --- --- --- ---
//    -   -   -   -
// --- --- --- --- ---
//Bounding Boxer 

const fragmentBbox = components.get(OBC.BoundingBoxer);
fragmentBbox.add(model);
const bbox = fragmentBbox.getMesh();
fragmentBbox.reset();

BUI.Manager.init();
const panel = BUI.Component.create<BUI.PanelSection>(() => {
  return BUI.html`
    <bim-panel active label="Bounding Boxes Tutorial" class="options-menu">
      <bim-panel-section collapsed label="Controls">
         
        <bim-button 
          label="Fit BIM model" 
          @click="${() => {
            world.camera.controls.fitToSphere(bbox, true);
          }}">  
        </bim-button>  

      </bim-panel-section>
    </bim-panel>
    `;
});

container.appendChild(panel);

// Simple control panel to demonstrate adding THREE objects to the scene
document.getElementById("load-cube").addEventListener("click", loadCube);
document.getElementById("remove-cube").addEventListener("click", removeCube);
document.getElementById("dispose-fragments").addEventListener("click", disposeFragments);

function loadCube() {
  console.log("Loading cube...");
  const material = new THREE.MeshLambertMaterial({ color: "#6528D7" });
  const geometry = new THREE.BoxGeometry();
  const cube = new THREE.Mesh(geometry, material);
  const lightDirectional = new THREE.DirectionalLight(0xffffff, 50);
  cube.name = "cube";
  world.scene.three.add(cube);
  world.scene.three.add(lightDirectional);

  const spotLight = new THREE.SpotLight(0xffffff, 1);
  world.scene.three.add(spotLight);

  document.getElementById("remove-cube").style.visibility = "visible";
}

function removeCube() {
  console.log("Removing cube...");
  try {
    const cube = world.scene.three.getObjectByName("cube");
    const lightDirectional = world.scene.three.getObjectByName("lightDirectional");
    world.scene.three.remove(cube);
    world.scene.three.remove(lightDirectional);
  } catch (error) {
    console.error("Error deleting cube:", error);
  }
  document.getElementById("remove-cube").style.visibility = "hidden";
}

function disposeFragments() {
  if (fragments) {
    fragments.dispose();
  }
}

export { loadCube, removeCube, disposeFragments };
