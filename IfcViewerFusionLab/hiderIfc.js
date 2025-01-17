import * as BUI from "@thatopen/ui";
import * as WEBIFC from "web-ifc";
import * as OBC from "@thatopen/components";

// Setup container and basic components
const container = document.getElementById("viewerContainer");
const components = new OBC.Components();
const worlds = components.get(OBC.Worlds);
const world = worlds.create();

// Initialize scene, renderer, and camera
world.scene = new OBC.SimpleScene(components);
world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.SimpleCamera(components);

components.init();

world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);
world.scene.setup();

// Add grid to the scene
const grids = components.get(OBC.Grids);
grids.create(world);

// Set transparent background
world.scene.three.background = null;

// Initialize IFC loader
const ifcLoader = components.get(OBC.IfcLoader);
await ifcLoader.setup();

// Load IFC file
// Replace 'your-ifc-file.ifc' with the path to your IFC file
const file = await fetch('data/HDM Main.ifc');
const buffer = await file.arrayBuffer();
const model = await ifcLoader.load(new Uint8Array(buffer));
world.scene.three.add(model);

// Process model relations
const indexer = components.get(OBC.IfcRelationsIndexer);
await indexer.process(model);

// Initialize hider component
const hider = components.get(OBC.Hider);

// Setup classifier
const classifier = components.get(OBC.Classifier);
classifier.byEntity(model);
await classifier.bySpatialStructure(model, {
    isolate: new Set([WEBIFC.IFCBUILDINGSTOREY])
});

// Initialize UI
BUI.Manager.init();

// Create spatial structures object (floors)
const spatialStructures = {};
const structureNames = Object.keys(classifier.list.spatialStructures);
for (const name of structureNames) {
    spatialStructures[name] = true;
}

// Create classes object (categories)
const classes = {};
const classNames = Object.keys(classifier.list.entities);
for (const name of classNames) {
    classes[name] = true;
}

// Create main UI panel
const panel = BUI.Component.create(() => {
    return BUI.html`
        <bim-panel active label="IFC Model Visibility" class="options-menu">
            <bim-panel-section collapsed label="Controls">
                <bim-panel-section collapsed label="Floors" name="Floors">
                </bim-panel-section>
                <bim-panel-section collapsed label="Categories" name="Categories">
                </bim-panel-section>
            </bim-panel-section>
        </bim-panel>
    `;
});

document.body.append(panel);

// Get panel sections
const floorSection = panel.querySelector("bim-panel-section[name='Floors']");
const categorySection = panel.querySelector("bim-panel-section[name='Categories']");

// Create floor checkboxes
for (const name in spatialStructures) {
    const panel = BUI.Component.create(() => {
        return BUI.html`
            <bim-checkbox checked label="${name}"
                @change="${(event) => {
                    const target = event.target;
                    const found = classifier.list.spatialStructures[name];
                    if (found && found.id !== null) {
                        const foundIDs = indexer.getEntityChildren(model, found.id);
                        const meshes = model.getSubset(foundIDs);
                        hider.set(target.value, meshes);
                    }
                }}">
            </bim-checkbox>
        `;
    });
    floorSection.append(panel);
}

// Create category checkboxes
for (const name in classes) {
    const checkbox = BUI.Component.create(() => {
        return BUI.html`
            <bim-checkbox checked label="${name}"
                @change="${(event) => {
                    const target = event.target;
                    const found = classifier.find({ entities: [name] });
                    hider.set(target.value, found);
                }}">
            </bim-checkbox>
        `;
    });
    categorySection.append(checkbox);
}

