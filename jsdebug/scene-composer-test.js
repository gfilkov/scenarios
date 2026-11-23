// Testing SceneComposer.js - suggested by DeepSeek on my description of the features.

const tblpath = 'models/table/';	// local folder
const tabletopY = 2.415;	// 2.444;

const pathbee = 'models/Bee.glb';
const pathpot = 'models/pot_scan_01.glb';

const beescale = 0.007;

let jar = null;		// Group/Object3D
let table = null;
let bee = null;

let renderer, scene, camera;
let mixer = null;
let animationManager;

let composer;

// Load textures
const textureLoader = new THREE.TextureLoader();
const lambert6SGAlbedo = textureLoader.load(tblpath + 'lambert6SG_albedo.jpg');
const lambert6SGNormal = textureLoader.load(tblpath + 'lambert6SG_normal.png');
const lambert6SGAO = textureLoader.load(tblpath + 'lambert6SG_AO.jpg');

const lambert7SGAlbedo = textureLoader.load(tblpath + 'lambert7SG_albedo.jpg');
const lambert7SGNormal = textureLoader.load(tblpath + 'lambert7SG_normal.png');

// Create materials
const mattable = new THREE.MeshLambertMaterial({
	map: lambert6SGAlbedo,
	normalMap: lambert6SGNormal,
});

const matcloth = new THREE.MeshLambertMaterial({
	map: lambert7SGAlbedo,
	normalMap: lambert7SGNormal,
	aoMap: lambert6SGAO,
});

const gltfloader = new THREE.GLTFLoader();

// jar
gltfloader.load(
	pathpot,
	(gltf) => {
		jar = gltf.scene;
		jar.scale.set(1, 0.75, 1); // Adjust scale

		// jar is Group (or Object3D). Extract mesh.
		jar.traverse(function (child) {
			if (child.isMesh) {
				meshPot = child;
			}
		});

		// scene.add(jar); => init()
		// checkAssets(assets, ++assetsCount, 'jar');
		init();
	},
	(xhr) => {
		//console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
	},
	(error) => {
		console.log(error);
	}
);

// bee
gltfloader.load(
	pathbee,
	(gltf) => {
		bee = gltf.scene;
		bee.scale.set(beescale, beescale, beescale); // Adjust scale
		bee.position.y = tabletopY;

		// Access the animations
		animations = gltf.animations;

		// Check available animations
		console.log('Available animations:', animations.map(anim => anim.name));

		// Create an AnimationMixer
		mixer = new THREE.AnimationMixer(bee);
		animationManager = new AnimationManager(mixer, gltf.animations);

		// scene.add(bee);
		// checkAssets(assets, ++assetsCount, 'bee');
		init();
	},
	(xhr) => {
		//console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
	},
	(error) => {
		console.log(error);
	}
);

function loadTable() {
	// Load OBJ file from local folder
	const objLoader = new THREE.OBJLoader();
	objLoader.load('models/table/Table.obj', (object) => {
		// 2 child meshes: 'table' and 'tablecloth'
		object.traverse((child) => {
			if (child.isMesh) {
				if (child.name.includes('cloth')) {
					child.material = matcloth;

					// down a bit
					child.position.y = -0.03;
				} else {
					child.material = mattable;
				}
			}
		});

		table = object;
		table.rotation.y = Math.PI / 2;

		//scene.add(table);

		// checkAssets(assets, ++assetsCount, 'table');
		init();
	});

}
function init() {
	console.log(": init()");

	if (!jar)
		return;
	if (!bee)
		return;
	if (!table)
		return;

	//let colorMG = 0xe0e0e0;	// milky-gray: 0xe0e0e0
	//let colorMB = 0x113755;	// Deep, muted blue
	//let colorPB = 0xb0d5f5; // Pale blue, transition from day

	let colorDB = 0x364092; // dark blue

	scene = new THREE.Scene();
	scene.background = new THREE.Color(colorDB);
	scene.fog = new THREE.Fog(colorDB, 1, 20);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	// Lighting
	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(1, 1, 1).normalize();
	scene.add(light);

	const ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);

	camera = new THREE.PerspectiveCamera(60 /* 75 */, window.innerWidth / window.innerHeight, 0.1, 1000);

	//renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setSize(window.innerWidth, window.innerHeight);

	document.body.appendChild(renderer.domElement);	// REMOVE if using createCanvases()

	camera.position.set(0.4, 4, 2.7);

	// Force matrix updates
	jar.updateMatrixWorld(true);

	jar.rotation.y = -Math.PI / 4;
	jar.position.set(-1.5, tabletopY, -0.8);
	meshPot.material.color = new THREE.Color(0xcb6843);	// terracota

	scene.add(jar);
	scene.add(bee);
	scene.add(table);

	// constructor(scene, camera, renderer, ownloop = false)	// use own internal loop
	composer = new SceneComposer(scene, camera, renderer);	// default: external loop
}

loadTable();
//init(); - loaders' callback

const clock = new THREE.Clock();
function animate() {
	requestAnimationFrame(animate);

	// update*() here

	composer?.update();

	mixer?.update(clock.getDelta());

	render();
}

function render() {
	// camera, size updates here
	renderer?.render(scene, camera);
}
animate();
