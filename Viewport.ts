/* MD
  ### Storing View Information 👁‍🗨
  ---
  Something that is pretty common in pretty much all 3D applications is to store the camera position to easily retrieve it later. When it comes to BIM apps, an important addition is not only to store the camera position but also the selected elements and filtered elements. Currently, there is not an isolated standard to define those things; however, the BCF schema (which is an standard for communication between different BIM apps) includes both topics and viewpoints.
  
  :::info

  In a nutshell, topics stores information about the communication (such as title, type, status, assignee, comments, etc) and the viewpoint stores the camera location, target, selected elements, isolations, etc.

  :::
  
  Despite there is not an isolated schema to define camera position and related elements, viewpoints in the BCF schema describes that! In That Open Engine we made a Viewpoints component, which is pretty much an extraction of the BCF viewpoints and you will learn how to use them right now!

  ### 🚧 Scaffolding a BIM App
  ---
  Before we dive in, let's create a very simple app with the engine. Start by including the dependencies:
  */

// eslint-disable-next-line import/no-extraneous-dependencies
import * as BUI from "@thatopen/ui";
import * as THREE from "three";
import * as WEBIFC from "web-ifc";
// You have to import from @thatopen/components
import * as OBC from "@thatopen/components";

/* MD
  Then, initialize components:
  */

// To have the possibility to use some plug n play UI, initialize the user interface library
BUI.Manager.init();

const container = document.getElementById("viewerContainer")!;

const components = new OBC.Components();

const worlds = components.get(OBC.Worlds);
const world = worlds.create<
  OBC.SimpleScene,
  OBC.SimpleCamera,
  OBC.SimpleRenderer
>();

world.scene = new OBC.SimpleScene(components);
world.scene.setup();

world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.SimpleCamera(components);

const viewerGrids = components.get(OBC.Grids);
viewerGrids.create(world);

components.init();

await world.camera.controls.setLookAt(-588, 55, 130, 0, 2, -2);

/* MD
  Believe it or not, viewpoints can be used without any model. However, it is way more convenient when you use it in conjuction with IFC files. So, let's load a pretty basic IFC model from a remote repository to get started:
  */


const fragments = components.get(OBC.FragmentsManager);

let uuid = "";
  
  
const file = await fetch(
     "./finalModelwithBlocks.frag",  );
const data = await file.arrayBuffer();
const buffer = new Uint8Array(data);
const model= fragments.load(buffer);
world.scene.three.add(model);

/* MD
  ### 👀 Creating Viewpoints
  ---
  Creating viewpoints is extremely simple, and it can be done is just these few lines of code:
  */

const viewpoints = components.get(OBC.Viewpoints);
const viewpoint = viewpoints.create(world, { title: "My Viewpoint" }); // You can set an optional title for UI purposes

/* MD
  By default the viewpoint position will be set based on the world's camera. In case you need to update it, then you can change the camera position and trigger the corresponding method. For demostration purposes, let's create a general function that we can trigger later using a button:
*/

const updateViewpointCamera = async () => {
  console.log("Position before updating", viewpoint.position);
  viewpoint.updateCamera();
  console.log("Position after updating", viewpoint.position);
};

/* MD
  :::tip

  Of course, you don't have to create a function to trigger the update method in the viewpoint. You can just trigger it right away. We wrap it in a function to log the position before and after.

  :::

  Also, set the camera back to the viewpoint position is really easy. Once again, let's create a very simple function to trigger from the UI:
  */

const setWorldCamera = async () => {
  const initialPosition = new THREE.Vector3();
  world.camera.controls.getPosition(initialPosition);
  console.log("Camera position before updating", initialPosition);
  await viewpoint.go(world);
  const finalPosition = new THREE.Vector3();
  world.camera.controls.getPosition(finalPosition);
  console.log("Camera position before updating", finalPosition);
};


/* MD
  That method is fine if you are transfering selections between different BIM apps as the main way to do it is through GUIDs. However, using solely That Open Engine the most common way to get selections is through the use of FragmentIdMaps. Most of them comes from the Highlighter (see the related tutorial!) as it reports model selections. In this case, for simplicity purposes, let's programatically generate a FragmentIdMap for all walls in the model and add it to the viewpoint:
  */


const fragmentIdMap =  {'309aa274-3c53-4a05-b48e-9ba82c21b244': new Set([142106]), 'edbd9e68-5856-4780-9330-74e4e722ef70':new Set([2029]),'54b5a583-f953-4d07-a5ae-57b94786e4b4':new Set([806]),'4dd74822-a4f6-41ab-b633-f821d580e519': new Set([561]),'287e1cc3-f671-44d4-8c40-fd658e314634':new Set([141440]),'9219ecba-9068-45ae-bfcb-9092ef5cb6ab':new Set([142138]),'0464afdb-0a75-4b91-a434-b9a6099c0845': new Set([141650]),'1b439b1f-d9b5-4429-950f-1e827dad126c':new Set([141682]),'6abee5c5-6bb6-4699-9adb-dfd272336839':new Set([141744]),'443dc757-a105-4089-894d-e18ab284491f':new Set([141714]),'1adcb3a4-d16b-464a-8055-95d00a0aa2f0':new Set([1664]),'b05a4474-de47-41e3-b0ec-dc10ffb51c3e':new Set([1295])};
viewpoint.addComponentsFromMap(fragmentIdMap);


/* MD
  :::info

  In BCF, the elements related to a viewpoint are called components.

  :::

  If you inspect the viewpoint components (elements it includes) you will notice not only the two GUIDs we added before, but also new GUIDs representing the walls we added previously based on the FragmentIdMap. Let's create a pretty basic function to print into console the selection components both as GUIDs and as a FragmentIdMap you can use with components like the Highlighter or the Hider:
  */

const reportComponents = () => {
    world.camera.controls.setLookAt(-230, -30, 90, 0, 0, 0);
    viewpoint.updateCamera();
    viewpoint.go();
  
};

const view2 = () => {
    world.camera.controls.setLookAt(36, 44, -20, 0, 0, 0);
    viewpoint.updateCamera();
    viewpoint.go();
  
};

const view3 = () => {
    world.camera.controls.setLookAt(-227, -19, 200, 0, 0, 0);
    viewpoint.updateCamera();
    viewpoint.go();
  
};
const view4= () => {
    world.camera.controls.setLookAt(-102, 34, 320, 0, 0, 0);
    viewpoint.updateCamera();
    viewpoint.go();
  
};
/* MD
  ### 🔗 Relating Viewpoints and Topics
  ---
  One of the most common uses of a viewpoint is to relate it with a topic to further describe a communication. Topics and viewpoints are always created separately, but then you can decide which viewpoints belongs to which topics (not the other way around). The relation is defined by adding one or several viewpoint GUID to the topic, and it can be done as follows:
  */



/* MD
  ### Wrapping Up ✅
  ---
  To complete this tutorial, let's create a very simple panel to include buttons that triggers the import and export funcionalities, and also setup the app content like this:
  */

const panel = BUI.Component.create<BUI.PanelSection>(() => {
  return BUI.html`
    <bim-panel active label="Viewpoints Tutorial" class="options-menu">
      <bim-panel-section collapsed label="Controls">
        <bim-button @click=${updateViewpointCamera} label="Update Viewpoint Camera"></bim-button> 
        <bim-button @click=${setWorldCamera} label="Set World Camera"></bim-button>
        <bim-button @click=${reportComponents} label="View 1"></bim-button>
        <bim-button @click=${view2} label="View 2"></bim-button>
        <bim-button @click=${view3} label="View 2"></bim-button>
        <bim-button @click=${view4} label="View 2"></bim-button>
      </bim-panel-section>
    </bim-panel>
    `;
});

document.body.append(panel);



/* MD
  Congratulations! You already have the tools you need to create viewpoints in your app. Let's continue with more tutorials!
  */