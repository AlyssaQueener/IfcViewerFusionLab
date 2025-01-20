import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as CUI from "@thatopen/ui-obc";
import ifcUrl from './hdmMain.ifc?url'

BUI.Manager.init();

const viewport = document.createElement("bim-viewport");

//const viewport = document.getElementById("viewerContainer");

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
cameraComponent.controls.setLookAt(200, 50, 50, -4, -1, -6.5);

viewport.addEventListener("resize", () => {
    rendererComponent.resize();
    cameraComponent.updateAspect();
});

components.init();

const grids = components.get(OBC.Grids);
grids.create(world);

// Set transparent background
world.scene.three.background = null;

// Load and setup the IFC model
const ifcLoader = components.get(OBC.IfcLoader);
await ifcLoader.setup();
const file = await fetch(
    ifcUrl,
);
const buffer = await file.arrayBuffer();
const typedArray = new Uint8Array(buffer);
const model = await ifcLoader.load(typedArray);
world.scene.three.add(model);
debugger;
/*const geometry = new THREE.PlaneGeometry(15, 25, 1);
const material = new THREE.MeshLambertMaterial({ color: "#0000FF" });
const plane = new THREE.Mesh(geometry,material);
world.scene.three.add(plane);*/
// Process model relations
const indexer = components.get(OBC.IfcRelationsIndexer);
await indexer.process(model);
debugger;
// Create properties table
const [propertiesTable, updatePropertiesTable] = CUI.tables.elementProperties({
    components,
    fragmentIdMap: {}
});

propertiesTable.preserveStructureOnFilter = true;
propertiesTable.indentationInText = false;

// Setup highlighter
const highlighter = components.get(OBF.Highlighter);
highlighter.setup({ world });

highlighter.events.select.onHighlight.add((fragmentIdMap) => {
    updatePropertiesTable({ fragmentIdMap });
});

highlighter.events.select.onClear.add(() =>
    updatePropertiesTable({ fragmentIdMap: {} })
);
// Hider
// Initialize hider component
const hider = components.get(OBC.Hider);

// Setup classifier
const classifier = components.get(OBC.Classifier);
classifier.byEntity(model);

//Hider

// Create properties panel component
const propertiesPanel = BUI.Component.create(() => {
    const onTextInput = (e) => {
        const input = e.target;
        propertiesTable.queryString = input.value !== "" ? input.value : null;
    };

    const expandTable = (e) => {
        const button = e.target;
        propertiesTable.expanded = !propertiesTable.expanded;
        button.label = propertiesTable.expanded ? "Collapse" : "Expand";
    };

    return BUI.html`
        <bim-panel style="font-family:verdana;" label="Explore the Model">
            <bim-panel-section label="Element Data">
                <div style="display: flex; gap: 0.5rem;">
                    <bim-button @click=${expandTable} label=${propertiesTable.expanded ? "Collapse" : "Expand"}></bim-button>
                </div>
                <bim-text-input @input=${onTextInput} placeholder="Search Property" debounce="250"></bim-text-input>
                ${propertiesTable}
            </bim-panel-section>
            <bim-panel-section collapsed label="Controls">
                <bim-button 
                    label="Fit BIM model" 
                    @click="${() => {
                        world.camera.controls.fitToSphere(bbox, true);
                    }}">
                </bim-button>
            </bim-panel-section>
            <bim-panel-section collapsed label="Hide Elements">
                <bim-panel-section collapsed label="Categories" name="Categories">
                </bim-panel-section>
            </bim-panel-section>
        </bim-panel>
    `;
});

// Setup bounding box
const fragmentBbox = components.get(OBC.BoundingBoxer);
fragmentBbox.add(model);
const bbox = fragmentBbox.getMesh();
fragmentBbox.reset();

// Create and setup the application grid
const app = document.createElement("bim-grid");
app.layouts = {
    main: {
        template: `
        "propertiesPanel viewport"
        /25rem 1fr
        `,
        elements: { propertiesPanel, viewport}
    }
};

app.layout = "main";
var viewer = document.getElementById("viewerContainer");
viewer.append(app);
//document.body.append(app);


// Create classes object (categories)
const classes = {};
const classNames = Object.keys(classifier.list.entities);
for (const name of classNames) {
    classes[name] = true;
}

/*Create main UI panel
const panel = BUI.Component.create(() => {
    return BUI.html`
        <bim-panel active label="IFC Model Visibility" class="options-menu">
            <bim-panel-section collapsed label="Controls">
                <bim-panel-section collapsed label="Categories" name="Categories">
                </bim-panel-section>
            </bim-panel-section>
        </bim-panel>
    `;
});

document.body.append(panel);*/

// Get panel sections
const categorySection = propertiesPanel.querySelector("bim-panel-section[name='Categories']");



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



