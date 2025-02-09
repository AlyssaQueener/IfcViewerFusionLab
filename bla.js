import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as CUI from "@thatopen/ui-obc";
import * as THREE from "three";
import * as WEBIFC from "web-ifc";


BUI.Manager.init();

const viewport = document.createElement("bim-viewport");
let comments = [];

const components = new OBC.Components();
const worlds = components.get(OBC.Worlds);
const world = worlds.create();

const sceneComponent = new OBC.SimpleScene(components);
sceneComponent.setup();
world.scene = sceneComponent;

const rendererComponent = new OBC.SimpleRenderer(components, viewport);
world.renderer = rendererComponent;

world.scene.setup({
    shadows: {
      cascade: 1,
      resolution: 1024,
    },
  });

const cameraComponent = new OBC.SimpleCamera(components);
world.camera = cameraComponent;

cameraComponent.controls.setLookAt(200, 200, 50, 0, 0, 0);


viewport.addEventListener("resize", () => {
    rendererComponent.resize();
    cameraComponent.updateAspect();
});

components.init();

const grids = components.get(OBC.Grids);
grids.create(world);
const fragments = components.get(OBC.FragmentsManager);
world.renderer.three.shadowMap.enabled = true;
world.renderer.three.shadowMap.type = THREE.PCFSoftShadowMap;
let uuid = "";

const file = await fetch("./finalModelwithBlocks.frag");
const data = await file.arrayBuffer();
const buffer = new Uint8Array(data);
const group = fragments.load(buffer);
world.scene.three.add(group);
uuid = group.uuid;

const axesHelper = new THREE.AxesHelper( 30 );
world.scene.three.add(axesHelper);

const properties = await fetch("./finalModelPropertieswithBlocks.json");
group.setLocalProperties(await properties.json());

const indexer = components.get(OBC.IfcRelationsIndexer);
delete indexer.relationMaps[group.uuid];

const relationsIndexFile = await fetch("./relations-index-finalBimWithBlocks.json");
const relationsIndex = indexer.getRelationsMapFromJSON(
  await relationsIndexFile.text()
);
indexer.setRelationMap(group, relationsIndex);

const [propertiesTable, updatePropertiesTable] = CUI.tables.elementProperties({
  components,
  fragmentIdMap: {}
});

propertiesTable.preserveStructureOnFilter = true;
propertiesTable.indentationInText = false;

const viewpoints = components.get(OBC.Viewpoints);
const viewpoint = viewpoints.create(world, { title: "My Viewpoint" });
const fragmentIdMap =  {'309aa274-3c53-4a05-b48e-9ba82c21b244': new Set([142106]), 'edbd9e68-5856-4780-9330-74e4e722ef70':new Set([2029]),'54b5a583-f953-4d07-a5ae-57b94786e4b4':new Set([806]),'4dd74822-a4f6-41ab-b633-f821d580e519': new Set([561]),'287e1cc3-f671-44d4-8c40-fd658e314634':new Set([141440]),'9219ecba-9068-45ae-bfcb-9092ef5cb6ab':new Set([142138]),'0464afdb-0a75-4b91-a434-b9a6099c0845': new Set([141650]),'1b439b1f-d9b5-4429-950f-1e827dad126c':new Set([141682]),'6abee5c5-6bb6-4699-9adb-dfd272336839':new Set([141744]),'443dc757-a105-4089-894d-e18ab284491f':new Set([141714]),'1adcb3a4-d16b-464a-8055-95d00a0aa2f0':new Set([1664]),'b05a4474-de47-41e3-b0ec-dc10ffb51c3e':new Set([1295])};
viewpoint.addComponentsFromMap(fragmentIdMap);

const view1 = () => {
    world.camera.controls.setLookAt(56, 80, -41, 10, 40, 9);
    viewpoint.updateCamera();
    viewpoint.go(world);
  
};

const view2 = () => {
    world.camera.controls.setLookAt(-275, -17, 82, 0, 0, 0);
    viewpoint.updateCamera(world);
    viewpoint.go();
  
};

const view3 = () => {
    world.camera.controls.setLookAt(-227, -19, 200, 0, 0, 0);
    viewpoint.updateCamera();
    viewpoint.go(world);
  
};
const view4= () => {
    world.camera.controls.setLookAt(-102, 34, 320, 0, 0, 0);
    viewpoint.updateCamera();
    viewpoint.go(world);
  
};

// Setup highlighter
const highlighter = components.get(OBF.Highlighter);
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

highlighter.selectable = {
    'select': fragmentIdMap,
    'hover' : fragmentIdMap
};

highlighter.events.select.onHighlight.add((fragmentIdMap) => {
    debugger;
    currentSelectedElementId = Object.keys(fragmentIdMap)[0];
    var slection = highlighter.selection;
    
    updatePropertiesTable({ fragmentIdMap });
    
    updateCommentSection(currentSelectedElementId);
    console.log(fragmentIdMap);

});

highlighter.events.select.onClear.add(() =>
    updatePropertiesTable({ fragmentIdMap: {} })
);

highlighter.events.select.onClear.add(() => {
    currentSelectedElementId = null;
    updateCommentSection(null);
});

let currentSelectedElementId = null;

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
                <bim-button @click=${view1} label="View 1"></bim-button>
                <bim-button @click=${view2} label="View 2"></bim-button>
                <bim-button @click=${view3} label="View 3"></bim-button>
                <bim-button @click=${view4} label="View 4"></bim-button>
            </bim-panel-section>
        </bim-panel>
    `;
});

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
        
        updateCommentSection(currentSelectedElementId);
    }
};







