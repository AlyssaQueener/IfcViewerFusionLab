import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as THREE from "three";

/* MD
  ### 🌎 Setting up a simple scene
  ---

  We will start by creating a simple scene with a camera and a renderer. If you don't know how to set up a scene, you can check the Worlds tutorial.
*/

const container = document.getElementById("viewerContainer")!;

const components = new OBC.Components();

const worlds = components.get(OBC.Worlds);

const world = worlds.create<
  OBC.SimpleScene,
  OBC.SimpleCamera,
  OBCF.PostproductionRenderer
>();

world.scene = new OBC.SimpleScene(components);
world.renderer = new OBCF.PostproductionRenderer(components, container);
world.camera = new OBC.SimpleCamera(components);

components.init();

world.renderer.postproduction.enabled = true;

world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

world.scene.setup();

const grids = components.get(OBC.Grids);
const grid = grids.create(world);
world.renderer.postproduction.customEffects.excludedMeshes.push(grid.three);

/* MD

  We'll make the background of the scene transparent so that it looks good in our docs page, but you don't have to do that in your app!

*/

world.scene.three.background = null;


const fragments = new OBC.FragmentsManager(components);
const file = await fetch(
  "./finalModelwithBlocks.frag",
);
const data = await file.arrayBuffer();
const buffer = new Uint8Array(data);
const model = fragments.load(buffer);
world.scene.three.add(model);


const highlighter = components.get(OBCF.Highlighter);
const selectionColor = new THREE.Color().setRGB(
    16/255, // Convert from 0-255 to 0-1 range
    66/255,
    35/255
);

const hoverColor = new THREE.Color().setRGB(
    64/255,  // Convert from 0-255 to 0-1 range
    50/255,
    168/255
);
highlighter.setup({selectionColor, hoverColor, world });
highlighter.zoomToSelection = true;


var exclude = {'309aa274-3c53-4a05-b48e-9ba82c21b244': new Set([142106]), 'edbd9e68-5856-4780-9330-74e4e722ef70':new Set([2029]),'54b5a583-f953-4d07-a5ae-57b94786e4b4':new Set([806]),'4dd74822-a4f6-41ab-b633-f821d580e519': new Set([561]),'287e1cc3-f671-44d4-8c40-fd658e314634':new Set([141440]),'9219ecba-9068-45ae-bfcb-9092ef5cb6ab':new Set([142138]),'0464afdb-0a75-4b91-a434-b9a6099c0845': new Set([141650]),'1b439b1f-d9b5-4429-950f-1e827dad126c':new Set([141682]),'6abee5c5-6bb6-4699-9adb-dfd272336839':new Set([141744]),'443dc757-a105-4089-894d-e18ab284491f':new Set([141714]),'1adcb3a4-d16b-464a-8055-95d00a0aa2f0':new Set([1664]),'b05a4474-de47-41e3-b0ec-dc10ffb51c3e':new Set([1295])};

highlighter.selectable = {
    'select': exclude,
    'hover' : exclude
};



/*const outliner = components.get(OBCF.Outliner);
outliner.world = world;
outliner.enabled = true;

outliner.create(
  "example",
  new THREE.MeshBasicMaterial({
    color: 0x4032a8,
    //transparent: true,
    opacity: 0.5,
  }),
);

highlighter.events.select.onHighlight.add((data) => {
    console.log(data);
  outliner.clear("example");
  outliner.add("example", data);
});

highlighter.events.select.onClear.add(() => {
  outliner.clear("example");
});*/


