/* MD
### 🖼️ 2D inside 3D
---

Sometimes we need to see a 2D element inside our 3D world. For instance, imagine a Digital Twin application that has some icons representing a set of measurement devices inside a building. In this tutorial, we'll learn to use the Marker, which will allow us to easily create and cluster 2D elements inside the 3D scene.

:::tip 2D inside 3D?

We will achieve this using Three.js CSS2DElements. They allow you to "embed" any HTML element in your 3D scene, automatically adjusting it's position to the 3D camera.

:::

In this tutorial, we will import:

- `three` to create some 3D items.
- `@thatopen/components` to set up the barebone of our app.
- `@thatopen/components-front` to use some frontend-oriented components.
- `Stats.js` (optional) to measure the performance of our app.
*/

import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";


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

world.camera.controls.setLookAt(5, 5, 5, 0, 0, 0);
world.scene.setup();

const grids = components.get(OBC.Grids);
grids.create(world);

/* MD

  We'll make the background of the scene transparent so that it looks good in our docs page, but you don't have to do that in your app!

*/

world.scene.three.background = null;

/* MD
  ### 🖌️ Creating the marker
  ---

  Now we will get the marker instance. The threshold is the minimum distance that the marker will use to "cluster" the 2D elements together. You can create elements that are not clustered by defining them as static in the `create` method. You can disable clustering alltogether by using the autoCluster option.
*/

const marker = components.get(OBCF.Marker);

marker.threshold = 10;

/* MD
  ### ✨ Creating 2D elements
  ---

  Now we will create a bunch of 2D elements in random positions using the create method.
*/


marker.create(world, "🚀", new THREE.Vector3(10, 30, 0));
marker.create(world, "🚀", new THREE.Vector3(0, 10, 0));
marker.create(world, "🚀", new THREE.Vector3(10, 0, 10));
marker.create(world, "🚀", new THREE.Vector3(10, 0, 0));
debugger;
console.log(marker.getWorldMarkerList(world));
const fragments = components.get(OBC.FragmentsManager);

let uuid = "";






const file = await fetch(
      "./finalModel-2.frag",
);
const data = await file.arrayBuffer();
const buffer = new Uint8Array(data);
const group = fragments.load(buffer);
console.log(group);
world.scene.three.add(group);


/* MD 
  ### ⏱️ Measuring the performance (optional)
  ---

  We'll use the [Stats.js](https://github.com/mrdoob/stats.js) to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.
*/



/* MD
  ### 🎉 Wrap up
  ---

  That's it! You have created an app that can display 2D elements inside the 3D scene. Congratulations!
*/