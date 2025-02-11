/* MD
### 🔁 Getting relations (easy)
---

 If you're aware of the IFC schema, you should know that all the possible information an entity have is not directly inside its attributes. For example, the property sets, classifications, materials, etc, of a wall (or any other element) are not directly in the wall attributes 🤯 but in other entities which are related to the wall using relations.


:::tip Why so much indirection?

 Indirection is perfect for an schema like the IFC which aims to store all the building data within a single text file in the easiest way possible. However, is not that easy to work just because you need to find the relations you want to get to the element data you're looking for 😪. Luckily for you, the `IfcRelationsIndexer` already gives you an easy way to get the entities which are related with your elements thanks to the inverse attributes! 🔥🔥

:::

In this tutorial, we will import:

- `@thatopen/ui` to add some simple and cool UI menus.
- `@thatopen/components` to set up the barebone of our app.
- `Stats.js` (optional) to measure the performance of our app.
*/

import * as BUI from "@thatopen/ui";
import * as WEBIFC from "web-ifc";
import * as OBC from "@thatopen/components";


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


world.scene.three.background = null;

const ifcSettings = new OBC.IfcFragmentSettings;
ifcSettings.excludedCategories.add(WEBIFC.IFCPLATE);
const ifcLoader = components.get(OBC.IfcLoader);
await ifcLoader.setup(ifcSettings);
const file = await fetch(
  "./250210_Model_Base_materia_RENDERwalls nooo tree.ifc",
);
const buffer = await file.arrayBuffer();
const typedArray = new Uint8Array(buffer);
const model = await ifcLoader.load(typedArray);
world.scene.three.add(model);



const indexer = components.get(OBC.IfcRelationsIndexer);
await indexer.process(model);

const downloadJSON = (json: string, name: string) => {
  const file = new File([json], name);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(a.href);
};

const json = indexer.serializeModelRelations(model);
console.log(json);
const allRelationsJSON = indexer.serializeAllRelations();

BUI.Manager.init();

const panel = BUI.Component.create<BUI.PanelSection>(() => {
  return BUI.html`
  <bim-panel active label="IFC Relations Indexer Tutorial" class="options-menu">
  <bim-panel-section collapsed label="Controls">
      <bim-panel-section style="padding-top: 10px;">
      
        <bim-button 
          label="Download relations" 
          @click="${async () => {
            downloadJSON(allRelationsJSON, "relations-index-finalBimWithBlocks.json");
          }}">  
        </bim-button>        

        <bim-button 
          label="Download Model" 
          @click="${async () => {
            const propsManager = components.get(OBC.IfcPropertiesManager);
            try {
              const newIfc = await propsManager.saveToIfc(model, typedArray);
              const ifcFile = new File([newIfc], "new.ifc");
              const a = document.createElement("a");
              a.href = URL.createObjectURL(ifcFile);
              a.download = ifcFile.name;
              a.click();
              URL.revokeObjectURL(a.href);
            } catch (error) {
              alert(error);
            }
          }}">  
        </bim-button>        

      </bim-panel-section>
    </bim-panel>
    `;
});

document.body.append(panel);

/* MD
  And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.
*/

const button = BUI.Component.create<BUI.PanelSection>(() => {
  return BUI.html`
      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"
        @click="${() => {
          if (panel.classList.contains("options-menu-visible")) {
            panel.classList.remove("options-menu-visible");
          } else {
            panel.classList.add("options-menu-visible");
          }
        }}">
      </bim-button>
    `;
});

document.body.append(button);

/* MD
  ### 🎉 Wrap up
  ---

  That's it! Now you know how to get an easy way to get the relations of your model. Keep going with more tutorials! 💪
*/