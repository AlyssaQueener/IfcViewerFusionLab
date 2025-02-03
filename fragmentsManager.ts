/* MD
### 🚀 Handling BIM models like a boss
---

In this tutorial, you'll learn how to load your BIM models in Fragment format. Fragment is an [open source geometry system](https://github.com/ThatOpen/engine_fragment/) that we created on top of [Three.js](https://threejs.org/) to display BIM models fast, while keeping control over the individual items of the model. The idea is simple: a BIM model is a FragmentsGroup, which is (like the name implies) a collection of fragments. A fragment is a set of identical geometries instantiated around the scene.

:::tip How do I get a BIM model in Fragment format?

The IfcLoader component does exactly that! It converts IFC models to Fragments. Check out that tutorial if you are starting out with IFC files. Of course, you can just use the IfcLoader in your app, but loading fragments is more than x10 faster than loading IFC files. Our recommendation is to convert your IFC files to fragments just once, store the fragment somewhere (frontent of backend) and then load the fragments instead of teh IFC models directly.

:::

In this tutorial, we will import:

- `Three.js` to get some 3D entities for our app.
- `@thatopen/ui` to add some simple and cool UI menus.
- `@thatopen/components` to set up the barebone of our app.
- `Stats.js` (optional) to measure the performance of our app.
*/

import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";
import * as OBF from "@thatopen/components-front";

/* MD
  ### 🌎 Setting up a simple scene
  ---

  We will start by creating a simple scene with a camera and a renderer. If you don't know how to set up a scene, you can check the Worlds tutorial.

*/
BUI.Manager.init();
const container = document.getElementById("viewerContainer")!;

const viewport = document.createElement("bim-viewport");

const components = new OBC.Components();

const worlds = components.get(OBC.Worlds);

const world = worlds.create();
const sceneComponent = new OBC.SimpleScene(components);
sceneComponent.setup();
world.scene = sceneComponent;

const rendererComponent = new OBC.SimpleRenderer(components, viewport);
world.renderer = rendererComponent;

const cameraComponent = new OBC.SimpleCamera(components);
world.camera = cameraComponent;
cameraComponent.controls.setLookAt(10, 5.5, 5, -4, -1, -6.5);

viewport.addEventListener("resize", () => {
  rendererComponent.resize();
  cameraComponent.updateAspect();
});

components.init();

const grids = components.get(OBC.Grids);
grids.create(world);



/* MD
  ### 🧶 Loading a fragments model
  ---

  Let's begin by getting the FragmentsManager, which is the component to load, export, get and dispose Fragments in your app.🏭

  */

const fragments = components.get(OBC.FragmentsManager);

/* MD
  Now we can load a fragment from a file. We will fetch the model data and use the `load` method of the FragmentsManager to get the fragment object. Then, we'll add it to the scene of the current world. We will also create an UUID of the model to later get it somewhere else.
*/

let uuid = "";


const file = await fetch(
      "./finalModel.frag",
);
const data = await file.arrayBuffer();
const buffer = new Uint8Array(data);
const group = fragments.load(buffer);
world.scene.three.add(group);
uuid = group.uuid;
const properties = await fetch(
  "./finalModelProperties.json",
);
group.setLocalProperties(await properties.json());
const indexer = components.get(OBC.IfcRelationsIndexer);

delete indexer.relationMaps[group.uuid];
const relationsIndexFile = await fetch(
    "./relations-index-finalBim.json",
  );
  const relationsIndex = indexer.getRelationsMapFromJSON(
    await relationsIndexFile.text(),
  );
//await indexer.process(model);
indexer.setRelationMap(group, relationsIndex);
console.log(indexer.relationMaps);
const [propertiesTable, updatePropertiesTable] = CUI.tables.elementProperties({
  components,
  fragmentIdMap: {},
});

propertiesTable.preserveStructureOnFilter = true;
propertiesTable.indentationInText = false;

/* MD
  :::tip

  The `elementProperties` functional component is a simplified version that shows any model entity data. However, if you like a more complete properties table, use the `entityAttributes` component.

  :::

  Cool! properties table created. Then after, let's tell the properties table to update each time the user makes a selection over the model. For it, we will use the highlighter from `@thatopen/components-front`:
  */

const highlighter = components.get(OBF.Highlighter);
highlighter.setup({ world });
debugger;
highlighter.events.select.onHighlight.add((fragmentIdMap) => {
  updatePropertiesTable({ fragmentIdMap });
});

highlighter.events.select.onClear.add(() =>
  updatePropertiesTable({ fragmentIdMap: {} }),
);

/* MD
  ### Creating a panel to append the table
  Allright! Let's now create a BIM Panel to control some aspects of the properties table and to trigger some functionalities like expanding the rows children and copying the values to TSV, so you can paste your element values inside a spreadsheet application 😉
  */

const propertiesPanel = BUI.Component.create(() => {
  const onTextInput = (e: Event) => {
    const input = e.target as BUI.TextInput;
    propertiesTable.queryString = input.value !== "" ? input.value : null;
  };

  const expandTable = (e: Event) => {
    const button = e.target as BUI.Button;
    propertiesTable.expanded = !propertiesTable.expanded;
    button.label = propertiesTable.expanded ? "Collapse" : "Expand";
  };

  

  return BUI.html`
    <bim-panel label="Properties">
      <bim-panel-section label="Element Data">
        <div style="display: flex; gap: 0.5rem;">
          <bim-button @click=${expandTable} label=${propertiesTable.expanded ? "Collapse" : "Expand"}></bim-button> 
        </div> 
        <bim-text-input @input=${onTextInput} placeholder="Search Property" debounce="250"></bim-text-input>
        ${propertiesTable}
      </bim-panel-section>
    </bim-panel>
  `;
});

/* MD
  Finally, let's create a BIM Grid element and provide both the panel and the viewport to display everything.
  */

const app = document.createElement("bim-grid");
app.layouts = {
  main: {
    template: `
    "propertiesPanel viewport"
    /25rem 1fr
    `,
    elements: { propertiesPanel, viewport },
  },
};

app.layout = "main";
container.append(app);


/* MD

  ### 📤 Storing Fragments
  ---

  Let's see how you can export fragments as a file. First, we'll define a function to download a file:

  */

function download(file: File) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/* MD
 **Fragments Manager** can export fragments using the `export` method. The method takes the UUID of a fragment as an argument and returns a **[Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob)**, which can be used to generate a File and then download it using the function defined just before.↗️
 */

function exportFragments() {
  if (!fragments.groups.size) {
    return;
  }
  const group = fragments.groups.get(uuid);
  if (!group) {
    return;
  }
  const data = fragments.export(group);
  const blob = new Blob([data]);
  const file = new File([blob], "small.frag");
  download(file);
}

/* MD

  ### 🧹 Discard Fragment and Clean the Scene
  ---

  When your user "closes" one or many BIM models, you'll need to discard that FragmetsGroup. You can dispose a specific FragmentsGroup using the `disposeGroup` method, or dispose all FragmentsGroups using the `dispose` method.

  */

function disposeFragments() {
  fragments.dispose();
}

/* MD
  ### ⏱️ Measuring the performance (optional)
  ---

  We'll use the [Stats.js](https://github.com/mrdoob/stats.js) to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.
*/


/* MD
  ### 🧩 Adding some UI
  ---

  We will use the `@thatopen/ui` library to add some simple and cool UI elements to our app. First, we need to call the `init` method of the `BUI.Manager` class to initialize the library:

*/


/* MD
  Now we will create a simple panel with a set of buttons that call the previously defined functions. For more information about the UI library, you can check the specific documentation for it!
*/

const panel = BUI.Component.create<BUI.PanelSection>(() => {
  return BUI.html`
    <bim-panel active label="Fragments Manager Tutorial" class="options-menu">
      <bim-panel-section collapsed label="Controls">
    
        <bim-button 
          label="Dispose fragments" 
          @click="${() => {
            disposeFragments();
          }}">
        </bim-button>
        
        <bim-button 
          label="Export fragments" 
          @click="${() => {
            exportFragments();
          }}">
        </bim-button>
        
      </bim-panel-section>
    </bim-panel>
    `;
});

document.body.append(panel);

