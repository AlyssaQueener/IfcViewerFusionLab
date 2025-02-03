
import * as WEBIFC from "web-ifc";
import * as BUI from "@thatopen/ui";

import * as OBC from "@thatopen/components";


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
  OBC.SimpleRenderer
>();

world.scene = new OBC.SimpleScene(components);
world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.SimpleCamera(components);

components.init();

world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

world.scene.setup();

const grids = components.get(OBC.Grids);
grids.create(world);

/* MD

  We'll make the background of the scene transparent so that it looks good in our docs page, but you don't have to do that in your app!

*/

world.scene.three.background = null;

/* MD
  ### 🚗🏎️ Getting IFC and fragments
  ---
  When we read an IFC file, we convert it to a geometry called Fragments. Fragments are a lightweight representation of geometry built on top of THREE.js `InstancedMesh` to make it easy to work with BIM data efficiently. All the BIM geometry you see in our libraries are Fragments, and they are great: they are lightweight, they are fast and we have tons of tools to work with them. But fragments are not used outside our libraries. So how can we convert an IFC file to fragments? Let's check out how:
  */

const fragments = components.get(OBC.FragmentsManager);
const fragmentIfcLoader = components.get(OBC.IfcLoader);

/* MD
  :::info Why not just IFC?

  IFC is nice because it lets us exchange data with many tools in the AECO industry. But your graphics card doesn't understand IFC. It only understands one thing: triangles. So we must convert IFC to triangles. There are many ways to do it, some more efficient than others. And that's exactly what Fragments are: a very efficient way to display the triangles coming from IFC files.

  :::

  Once Fragments have been generated, you can export them and then load them back directly, without needing the original IFC file. Why would you do that? Well, because fragments can load +10 times faster than IFC. And the reason is very simple.   When reading an IFC, we must parse the file, read the implicit geometry, convert it to triangles (Fragments) and send it to the GPU. When reading fragments, we just take the triangles and send them, so it's super fast.

  :::danger How to use Fragments?

  If you want to find out more about Fragments, check out the Fragments Manager tutorial.

  :::


  ### 🔭🔧 Calibrating the converter
  ---
  Now, we need to configure the path of the WASM files. What's WASM? It's a technology that lets us run C++ on the browser, which means that we can load IFCs super fast! These files are the compilation of our `web-ifc` library. You can find them in the github repo and in NPM. These files need to be available to our app, so you have 2 options:

  - Download them and serve them statically.
  - Get them from a remote server.

  The easiest way is getting them from unpkg, and the cool thing is that you don't need to do it manually! It can be done directly by the tool just by writing the following:
  */

await fragmentIfcLoader.setup();

// If you want to the path to unpkg manually, then you can skip the line
// above and set them manually as below:
// fragmentIfcLoader.settings.wasm = {
//   path: "https://unpkg.com/web-ifc@0.0.66/",
//   absolute: true,
// };



/* MD
  We can further configure the conversion using the `webIfc` object. In this example, we will make the IFC model go to the origin of the scene (don't worry, this supports model federation):
  */

fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;

/* MD
  ### 🚗🔥 Loading the IFC
  ---
  Next, let's define a function to load the IFC programmatically. We have hardcoded the path to one of our IFC files, but feel free to do this with any of your own files!

 :::info Opening local IFCs

  Keep in mind that the browser can't access the file of your computer directly, so you will need to use the Open File API to open local files.

  :::
*/

async function loadIfc() {
  const file = await fetch(
    "./Bim_Model_site_walls 311.ifc",
  );
  const data = await file.arrayBuffer();
  const buffer = new Uint8Array(data);
  const model = await fragmentIfcLoader.load(buffer);
  model.name = "example";
  world.scene.three.add(model);
}

/* MD
  If you want to get the resulted model every time a new model is loaded, you can subscribe to the following event anywhere in your app:
*/

fragments.onFragmentsLoaded.add((model) => {
  console.log(model);
});

/* MD
  ### 🎁 Exporting the result to fragments
  ---
  Once you have your precious fragments, you might want to save them so that you don't need to open this IFC file each time your user gets into your app. Instead, the next time you can load the fragments directly. Defining a function to export fragments is as easy as this:
*/

function download(file: File) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function exportFragments() {
  if (!fragments.groups.size) {
    return;
  }
  debugger;
  const group = Array.from(fragments.groups.values())[0];
  const data = fragments.export(group);
  download(new File([new Blob([data])], "finalModel.frag"));

  const properties = group.getLocalProperties();
  if (properties) {
    download(new File([JSON.stringify(properties)], "finalModelProperties.json"));
  }
}

/* MD
  ### 🧠🧼 Cleaning memory
  ---
  Now, just like in the `FragmentManager` tutorial, you will need to dispose the memory if your user wants to reset the state of the scene, especially if you are using Single Page Application technologies like React, Angular, Vue, etc. To do that, you can simply call the `dispose` method:
*/

function disposeFragments() {
  fragments.dispose();
}

/* MD
  That's it! Congrats, now you can load IFC files into your app, generate the 3D geometry and property data for them and navigate them in 3D. In other tutorials, you'll find tons of tools to work with them and create amazing BIM apps! See you there. 💪

  ### ⏱️ Measuring the performance (optional)
  ---

  We'll use the [Stats.js](https://github.com/mrdoob/stats.js) to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.
*/


/* MD
  ### 🧩 Adding some UI
  ---

  We will use the `@thatopen/ui` library to add some simple and cool UI elements to our app. First, we need to call the `init` method of the `BUI.Manager` class to initialize the library:
*/

BUI.Manager.init();

/* MD
Now we will add some UI to load and unload our BIM model. For more information about the UI library, you can check the specific documentation for it!
*/

const panel = BUI.Component.create<BUI.PanelSection>(() => {
  return BUI.html`
  <bim-panel active label="IFC Loader Tutorial" class="options-menu">
    <bim-panel-section collapsed label="Controls">
      <bim-panel-section style="padding-top: 12px;">
      
        <bim-button label="Load IFC"
          @click="${() => {
            loadIfc();
          }}">
        </bim-button>  
            
        <bim-button label="Export fragments"
          @click="${() => {
            exportFragments();
          }}">
        </bim-button>  
            
        <bim-button label="Dispose fragments"
          @click="${() => {
            disposeFragments();
          }}">
        </bim-button>
      
      </bim-panel-section>
      
    </bim-panel>
  `;
});

document.body.append(panel);

