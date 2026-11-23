//import * as THREE from 'three';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
//import { GUI } from 'dat.gui';

// No imports version. Assumes THREE, THREE.OrbitControls, dat are already loaded.

//const composer = new SceneComposer(scene, camera, renderer);
//// later, to disable:
//// composer.dispose();

class SceneComposer {
    constructor(scene, camera, renderer, ownloop = false) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        //// this.worldProxy = { px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 };
        this.worldProxy = {
            px: 0, py: 0, pz: 0,
            rx: 0, ry: 0, rz: 0,
            s: 1   // single uniform scale value
        };
        this._tmpVec = new THREE.Vector3();
        this._tmpQuat = new THREE.Quaternion();
        this._tmpEuler = new THREE.Euler();

        this._objectControllers = [];

        // 1. Orbit Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        // 2. Global AxesHelper (optional, for world coordinate reference)
        this.scene.add(new THREE.AxesHelper(5));

        // 3. Selection State
        this.currentObject = null;
        this.currentAxesHelper = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // 4. dat.GUI
        this.gui = new dat.GUI({ width: 300 });
        this._initGui();

        // 5. Event Binding
        this.renderer.domElement.addEventListener('dblclick', (e) => this._onDoubleClick(e));

        // 6. Start Loop
        if (ownloop) {
            this._animate = this._animate.bind(this);
            requestAnimationFrame(this._animate);
        }
    }

    _onDoubleClick(event) {
        // Convert mouse position to NDC
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            // Find the topmost selectable Mesh (excluding helpers)
            const hit = intersects.find(i => i.object.isMesh);
            if (hit) this._selectObject(hit.object);
        }
    }

    _selectObject(obj) {
        // Remove old marker
        if (this.currentAxesHelper && this.currentObject) {
            this.currentObject.remove(this.currentAxesHelper);
        }

        this.currentObject = obj;

        // Create new AxesHelper and attach as child
        // Note: Size needs to be adjusted based on object scale, hardcoded small value here
        this.currentAxesHelper = new THREE.AxesHelper(0.5);
        // Ensure it renders on top (optional)
        this.currentAxesHelper.material.depthTest = false;
        this.currentAxesHelper.renderOrder = 999;
        this.currentObject.add(this.currentAxesHelper);

        // Refresh GUI to bind new object properties
        this._rebuildGuiForCurrentObject();
    }

    _initGui() {
        // Camera Controls (fixed)
        this.cameraFolder = this.gui.addFolder('Camera Position');
        this.cameraFolder.add(this.camera.position, 'x', -50, 50).listen();
        this.cameraFolder.add(this.camera.position, 'y', -50, 50).listen();
        this.cameraFolder.add(this.camera.position, 'z', -50, 50).listen();

        // Object Controls (dynamic refresh)
        this.objectFolder = this.gui.addFolder('Object Properties');

        this.posFolder = this.objectFolder.addFolder('World Position');
        this.rotFolder = this.objectFolder.addFolder('World Rotation (rad)');
        this.scaleFolder = this.objectFolder.addFolder('World Scale');
    }

    _rebuildGuiForCurrentObject() {
        // Clear ALL object-related controllers, wherever they live
        if (this._objectControllers) {
            this._objectControllers.forEach(c => c.remove());
            this._objectControllers = [];
        }

        if (!this.currentObject) {
            this.objectFolder.close();
            return;
        }

        const obj = this.currentObject;
        this.objectFolder.open();

        const nameCtrl = this.objectFolder.add(obj, 'name').name('Name').listen();
        this._objectControllers.push(nameCtrl);

        // --- World position ---
        const wp = this.worldProxy;

        this._objectControllers.push(this.posFolder.add(wp, 'px', -5, 5, 0.01)
            .name('X')
            .onChange(() => this._applyWorldPosition())
            .onFinishChange(() => this._applyWorldPosition())
        );

        this._objectControllers.push(this.posFolder.add(wp, 'py', -5, 5, 0.01)
            .name('Y')
            .onChange(() => this._applyWorldPosition())
            .onFinishChange(() => this._applyWorldPosition())
        );

        this._objectControllers.push(this.posFolder.add(wp, 'pz', -5, 5, 0.01)
            .name('Z')
            .onChange(() => this._applyWorldPosition())
            .onFinishChange(() => this._applyWorldPosition())
        );


        // --- World rotation (radians) ---
        this._objectControllers.push(this.rotFolder.add(wp, 'rx', -Math.PI, Math.PI, 0.01)
            .name('X')
            .onChange(() => this._applyWorldRotation())
            .onFinishChange(() => this._applyWorldRotation())
        );

        this._objectControllers.push(this.rotFolder.add(wp, 'ry', -Math.PI, Math.PI, 0.01)
            .name('Y')
            .onChange(() => this._applyWorldRotation())
            .onFinishChange(() => this._applyWorldRotation())
        );

        this._objectControllers.push(this.rotFolder.add(wp, 'rz', -Math.PI, Math.PI, 0.01)
            .name('Z')
            .onChange(() => this._applyWorldRotation())
            .onFinishChange(() => this._applyWorldRotation())
        );


        // --- World scale ---
        this._objectControllers.push(this.scaleFolder.add(wp, 's', 0.1, 20, 0.1)
            .name('Uniform Scale')
            .onChange(() => this._applyUniformScale())
            .onFinishChange(() => this._applyUniformScale()));

        // Populate proxy from the newly selected object
        this._syncProxyFromObject();

        // Push the new proxy values into the GUI
        this._objectControllers.forEach(c => c.updateDisplay());
    }

    _syncProxyFromObject() {
        if (!this.currentObject) return;
        const obj = this.currentObject;

        // World position
        obj.getWorldPosition(this._tmpVec.set(0, 0, 0));
        this.worldProxy.px = this._tmpVec.x;
        this.worldProxy.py = this._tmpVec.y;
        this.worldProxy.pz = this._tmpVec.z;

        // Uniform scale: read one axis from world scale
        obj.getWorldScale(this._tmpVec);
        this.worldProxy.s = this._tmpVec.x;

        // World rotation as Euler (XYZ order, same as Three's default)
        obj.getWorldQuaternion(this._tmpQuat);
        this._tmpEuler.setFromQuaternion(this._tmpQuat, 'XYZ');
        this.worldProxy.rx = this._tmpEuler.x;
        this.worldProxy.ry = this._tmpEuler.y;
        this.worldProxy.rz = this._tmpEuler.z;
    }

    _applyWorldPosition() {
        if (!this.currentObject) return;

        const p = this.worldProxy;
        const worldPos = this._tmpVec.set(p.px, p.py, p.pz).clone();
        // Convert world position to local position in the parent's space
        if (this.currentObject.parent) {
            this.currentObject.parent.worldToLocal(worldPos);
        }
        this.currentObject.position.copy(worldPos);
    }

    _applyUniformScale() {
        if (!this.currentObject) return;
        const s = this.worldProxy.s;
        const target = new THREE.Vector3(s, s, s);
        if (this.currentObject.parent) {
            const parentScale = this.currentObject.parent.getWorldScale(new THREE.Vector3());
            target.x = parentScale.x !== 0 ? target.x / parentScale.x : target.x;
            target.y = parentScale.y !== 0 ? target.y / parentScale.y : target.y;
            target.z = parentScale.z !== 0 ? target.z / parentScale.z : target.z;
        }
        this.currentObject.scale.copy(target);
    }

    _applyWorldRotation() {
        if (!this.currentObject) return;
        const r = this.worldProxy;
        // Build world quaternion from Euler
        this._tmpQuat.setFromEuler(new THREE.Euler(r.rx, r.ry, r.rz, 'XYZ'));
        if (this.currentObject.parent) {
            const parentQuat = this.currentObject.parent.getWorldQuaternion(new THREE.Quaternion());
            // local = parentWorld^-1 * world
            this._tmpQuat.premultiply(parentQuat.clone().invert());
        }
        this.currentObject.quaternion.copy(this._tmpQuat);
    }

    _animate() {
        requestAnimationFrame(this._animate);

        this.update();

        this.renderer.render(this.scene, this.camera);
    }

    // expose update() for external loop: composer.update();
    update() {
        // Camera follow logic
        if (this.currentObject) {
            this.currentObject.getWorldPosition(this.controls.target);
            this._syncProxyFromObject();   // keep GUI numbers live
        } else {
            this.controls.target.set(0, 0, 0);
        }
        this.controls.update();
    }

    // Destroy (call when disabling the tool)
    dispose() {
        this.gui.destroy();
        this.controls.dispose();
        this.renderer.domElement.removeEventListener('dblclick', this._onDoubleClick);
        if (this.currentAxesHelper && this.currentObject) {
            this.currentObject.remove(this.currentAxesHelper);
        }
    }
}