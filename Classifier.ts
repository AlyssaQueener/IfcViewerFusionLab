import * as THREE from "three";
import * as BUI from "@thatopen/ui";
import * as WEBIFC from "web-ifc";
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
  ### 🧳 Loading a BIM model
  ---

 We'll start by adding a BIM model to our scene. That model is already converted to fragments, so it will load much faster than if we loaded the IFC file.

  :::tip Fragments?

    If you are not familiar with fragments, check out the IfcLoader tutorial!

  :::
*/

const fragments = new OBC.FragmentsManager(components);
const file = await fetch(
  "./finalModelwithBlocks.frag",
);
const data = await file.arrayBuffer();
const buffer = new Uint8Array(data);
const model = fragments.load(buffer);
world.scene.three.add(model);

const indexer = components.get(OBC.IfcRelationsIndexer);
const relationsIndexFile = await fetch("./relations-index-finalBimWithBlocks.json");
const relationsIndex = indexer.getRelationsMapFromJSON(
  await relationsIndexFile.text()
);
indexer.setRelationMap(model, relationsIndex);
console.log(indexer.relationMaps);

const properties = await fetch(
  "./finalModelPropertieswithBlocks.json",
);
model.setLocalProperties(await properties.json());

/* MD
  ### 🗃️ Classifiying the BIM model
  ---

 Next, we will set up a classifier that will help us identify the objects in the scene by their classification (e.g. their spatial structure or their category). Although you can instantiate the classifier by hand, we will use components.get() to get the classifier. All components are meant to be singletons by Components instance, and this method will make sure that this is the case.
*/

const classifier = components.get(OBC.Classifier);

/* MD
Now we can classify the BIM model. The classifier includes 3 methods:
- `byEntity`: classifies the model by IFC category.
- `byIfcrel`: classifies the model by an indirect relationship. In this case, we'll classify the model by its spatial structure (project, site, storey an space).
- `byModel`: classifies the model by model. This might seem redundant, but it's useful if you have multiple BIM models in the same scene and want to quickly select all the objects of one of them.
*/

classifier.byEntity(model);
classifier.byIfcRel(model, WEBIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE, "storeys");


var classes = classifier.list.entities;
console.log(classes);
console.log('RELATIONS');
var relations = classifier.list.storeys;
console.log(relations);
debugger;

const furniture = classifier.find({
    entities: ["IFCMEMBER"],
  });

var color = new THREE.Color().setHex( "#f57542")
classifier.setColor(furniture,new THREE.Color().setHex( "#f57542"),true);


/* MD
Now, to get the fragments set that belong to a certain classification, we can use the `find()` method. This method allows us to pass an object with filters. For example, to get all items of category "IFCWALLSTANDARDCASE", we can do: 
*/


/* MD
  ### 🧩 Adding some UI
  ---

  We will use the `@thatopen/ui` library to add some simple and cool UI elements to our app. First, we need to call the `init` method of the `BUI.Manager` class to initialize the library:
*/

BUI.Manager.init();

/* MD
Now we will add some UI to control the color of the classified elements fetched above. We'll also add a button to reset the color of all items to the original state. For more information about the UI library, you can check the specific documentation for it!
*/

const color = new THREE.Color();

const panel = BUI.Component.create<BUI.PanelSection>(() => {
  return BUI.html`
    <bim-panel active label="Classifier Tutorial" class="options-menu">
      <bim-panel-section collapsed label="Controls">


      </bim-panel-section>
    </bim-panel>
    `;
});

document.body.append(panel);

/* MD
  And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.
*/

