import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as CUI from "@thatopen/ui-obc";
import ifcUrl from './Final_Bim_Model.ifc?url'
import * as THREE from "three";
import * as WEBIFC from "web-ifc";

BUI.Manager.init();

const viewport = document.createElement("bim-viewport");
let comments = [];

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
console.log(indexer.relationMaps);
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


// Modify highlighter event to capture selected element
highlighter.events.select.onHighlight.add((fragmentIdMap) => {
    // Get the first selected element's ID
    currentSelectedElementId = Object.keys(fragmentIdMap)[0];
    
    // Update properties table
    updatePropertiesTable({ fragmentIdMap });
    
    // Clear previous comments and load comments for this element
    updateCommentSection(currentSelectedElementId);
});

highlighter.events.select.onClear.add(() =>
    updatePropertiesTable({ fragmentIdMap: {} })
);

highlighter.events.select.onClear.add(() => {
    currentSelectedElementId = null;
    updateCommentSection(null);
});

let currentSelectedElementId = null;

function updateCommentSection(elementId) {
    const commentContainer = propertiesPanel.querySelector('#comment-section');
    const commentControls = propertiesPanel.querySelector('#comment-controls');
    
    // Filter comments for the current element
    const elementComments = comments.filter(comment => comment.elementId === elementId);
    
    // Show comment controls only when an element is selected
    if (elementId) {
        commentControls.style.display = 'block';
    } else {
        commentControls.style.display = 'none';
    }
    
    // Clear previous comments
    commentContainer.innerHTML = elementComments.length > 0 
        ? elementComments.map(comment => `
            <div style="border-bottom: 1px solid #eee; padding: 8px 0;">
                <p>${comment.text}</p>
                <small style="color: gray;">${comment.timestamp.toLocaleString()}</small>
            </div>
        `).join('') 
        : '<p>No comments for this element</p>';
};

function submitComment() {
    const commentTextarea = propertiesPanel.querySelector('#comment-textarea');
    const commentText = commentTextarea.value.trim();
    
    if (commentText && currentSelectedElementId) {
        const comment = {
            text: commentText,
            elementId: currentSelectedElementId,
            timestamp: new Date()
        };
        
        comments.push(comment);
        commentTextarea.value = ''; // Clear textarea
        
        // Update comments display for current element
        updateCommentSection(currentSelectedElementId);
    }
};

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
        <bim-panel style="font-family: Yanone Kaffeesatz;" label="Explore the Model">
            <bim-panel-section label="Element Data">
                <div style="display: flex; gap: 0.5rem;">
                    <bim-button @click=${expandTable} label=${propertiesTable.expanded ? "Collapse" : "Expand"}></bim-button>
                </div>
                <bim-text-input @input=${onTextInput} placeholder="Search Property" debounce="250"></bim-text-input>
                 <div id="comment-controls" style="display: none;">
                    <textarea 
                        id="comment-textarea" 
                        placeholder="Leave a detailed comment about this element..." 
                        style="width: 100%; 
                               min-height: 100px; 
                               margin-bottom: 10px; 
                               padding: 8px; 
                               border: 1px solid #ddd; 
                               border-radius: 4px;"
                    ></textarea>
                    <bim-button 
                        label="Submit Comment" 
                        @click="${submitComment}"
                        style="width: 100%; margin-bottom: 15px;"
                    ></bim-button>
                </div>
                <div id="comment-section" style="max-height: 200px; overflow-y: auto;"></div>
                ${propertiesTable}
            </bim-panel-section>
            <bim-panel-section collapsed label="Controls">
                <bim-color-input 
                    label="Background Color" 
                    color="#202932" 
                    @input="${(event) => { 
                        const target = event.target;
                        world.scene.config.backgroundColor = new THREE.Color(target.color); 
                    }}"
                ></bim-color-input>
        
                <bim-number-input 
                    slider 
                    step="0.1" 
                    label="Directional lights intensity" 
                    value="1.5" 
                    min="0.1" 
                    max="10" 
                    @change="${(event) => { 
                        const target = event.target;
                        world.scene.config.directionalLight.intensity = target.value; 
                    }}"
                ></bim-number-input>
        
                <bim-number-input 
                    slider 
                    step="0.1" 
                    label="Ambient light intensity" 
                    value="1" 
                    min="0.1" 
                    max="5" 
                    @change="${(event) => { 
                        const target = event.target;
                        world.scene.config.ambientLight.intensity = target.value; 
                    }}"
                ></bim-number-input>
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
debugger;
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



