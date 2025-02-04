import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as CUI from "@thatopen/ui-obc";
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
const fragments = components.get(OBC.FragmentsManager);

let uuid = "";

const file = await fetch("./finalModel.frag");
const data = await file.arrayBuffer();
const buffer = new Uint8Array(data);
const group = fragments.load(buffer);
world.scene.three.add(group);
uuid = group.uuid;

const properties = await fetch("./finalModelProperties.json");
group.setLocalProperties(await properties.json());

const indexer = components.get(OBC.IfcRelationsIndexer);
delete indexer.relationMaps[group.uuid];

const relationsIndexFile = await fetch("./relations-index-finalBim.json");
const relationsIndex = indexer.getRelationsMapFromJSON(
  await relationsIndexFile.text()
);
indexer.setRelationMap(group, relationsIndex);
console.log(indexer.relationMaps);

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
    const commentWrapper = propertiesPanel.querySelector('#comment-wrapper');
    
    // Show/hide entire comment wrapper based on element selection
    if (elementId) {
        commentWrapper.style.display = 'block';
        commentControls.style.display = 'block';
        
        // Filter and display comments for the current element
        const elementComments = comments.filter(comment => comment.elementId === elementId);
        commentContainer.innerHTML = elementComments.length > 0 
            ? elementComments.map(comment => `
                <div style="border-bottom: 1px solid #eee; padding: 8px 0;">
                    <p>${comment.text}</p>
                    <small style="color: gray;">${comment.timestamp.toLocaleString()}</small>
                </div>
            `).join('') 
            : '<p>No comments for this element</p>';
    } else {
        commentWrapper.style.display = 'none';
    }
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
                <div id="comment-wrapper" style="display: none;">
                 <div id="comment-controls" style="display: none;">
                    <textarea 
                        id="comment-textarea" 
                        placeholder="Leave a comment..." 
                        style="width: 90%; 
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
                </div>
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
        </bim-panel>
    `;
});

// Setup bounding box
const fragmentBbox = components.get(OBC.BoundingBoxer);
fragmentBbox.add(group);
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

/*
"propertiesPanel viewport"
        /25rem 1fr
        `,
*/


app.layout = "main";
var viewer = document.getElementById("viewerContainer");
viewer.append(app);







