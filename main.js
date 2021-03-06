'use strict';

function createBullet(iniPos = { x: -3, y: 4, z: -10 }, iniDir = new THREE.Vector3(0, 0, 1)) {
  var geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  var material = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  var daCube = new THREE.Mesh(geometry, material);
  daCube.position.x = iniPos.x;
  daCube.position.y = iniPos.y;
  daCube.position.z = iniPos.z;
  scene.add(daCube);

  var shape = new CANNON.Box(new CANNON.Vec3(0.2, 0.2, 0.2));
  var mass = 1;
  var body = new CANNON.Body({
    mass
  });
  body.position.x = daCube.position.x;
  body.position.y = daCube.position.y;
  body.position.z = daCube.position.z;

  const targetVelocity =iniDir.multiplyScalar(3);
  body.velocity.x = targetVelocity.x;
  body.velocity.y = targetVelocity.y;
  body.velocity.z = targetVelocity.z;
  body.addShape(shape);
  world.addBody(body);

  return [
    daCube,
    body
  ];
}

function getForwardVector(mesh) {
  var matrix = new THREE.Matrix4();
  matrix.extractRotation(mesh.matrix);

  var direction = new THREE.Vector3(0, 0, 1);
  return matrix.multiplyVector3(direction);
}
function getUpVector(mesh) {
  var matrix = new THREE.Matrix4();
  matrix.extractRotation(mesh.matrix);

  var direction = new THREE.Vector3(0, 1, 0);
  return matrix.multiplyVector3(direction);
}

if ('bluetooth' in navigator === false) {

  button.style.display = 'none';
  message.textContent = 'This browser doesn\'t support the Web Bluetooth API :(';

}

var sensorfusion = new MadgwickAHRS();
sensorfusion.setQuaternion([0.7071067811865475, 0, 0, 0.7071067811865475]); // Hack-ish: Rotate internal quaternion

button.addEventListener('click', function () {

  var controller = new DaydreamController();
  controller.onStateChange(function (state) {

    textarea.textContent = JSON.stringify(state, null, '\t');

    sensorfusion.update(
      state.xGyro, state.yGyro, state.zGyro,
      state.xAcc, state.yAcc, state.zAcc,
      state.xOri, state.yOri, state.zOri
    );

    if (mesh !== undefined) {
      mesh.quaternion.fromArray(sensorfusion.getQuaternion());
      mesh.rotation.x -= Math.PI / 2; // Hack: Don't know how to change rotate gyro/acc/ori.

      button1.material.emissive.g = state.isClickDown ? 0.5 : 0;
      button2.material.emissive.g = state.isAppDown ? 0.5 : 0;
      button3.material.emissive.g = state.isHomeDown ? 0.5 : 0;

      touch.position.x = (state.xTouch * 2 - 1) / 1000;
      touch.position.y = - (state.yTouch * 2 - 1) / 1000;

      touch.visible = state.xTouch > 0 && state.yTouch > 0;
    }

    if (state.isAppDown) {
      gameObjects.push(createBullet(touch.position, getForwardVector(touch)));
    }
  });
  controller.connect();

});

/**For debug purposes */
document.addEventListener('click', (e) => {
  gameObjects.push(createBullet({ x: 0, y: 1, z: -2 }, getUpVector(touch)));
});

var moveDelta = 0.01;
function animateEnemyCube() {
  enemyCube.position.x += moveDelta;

  if (enemyCube.position.x < -4 || enemyCube.position.x > 4) {
    moveDelta *= -1;
  }
}

// 3D

var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(canvas.width, canvas.height);

var scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

var light = new THREE.HemisphereLight(0xddddff, 0x808080, 0.7);
light.position.set(0, 1, 0);
scene.add(light);

var light = new THREE.DirectionalLight(0xffffff, 0.6);
light.position.set(1, 1, 1);
scene.add(light);

var light = new THREE.DirectionalLight(0xffffff, 0.4);
light.position.set(1, -1, 1);
scene.add(light);

var camera = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 0.001, 10);
camera.position.z = 0.015;


var cubeGeom = new THREE.BoxGeometry(1, 1, 1);
var texture = new THREE.ImageUtils.loadTexture("files/gato.jpg");
var cubeMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
var enemyCube = new THREE.Mesh(cubeGeom, cubeMat);
enemyCube.position.x = 1;
enemyCube.position.y = 1;
enemyCube.position.z = -5;
scene.add(enemyCube);

var timeStep = 1 / 60;
initCannon();
var gameObjects = [];
var go = createBullet();
gameObjects.push(go);
console.log('gameObjects=', gameObjects);

var mesh, button1, button2, button3, touch;
var loader = new THREE.BufferGeometryLoader();
loader.load('files/daydream.json', function (geometry) {

  var material = new THREE.MeshPhongMaterial({ color: 0x888899, shininess: 15, side: THREE.DoubleSide });
  mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  scene.add(mesh);

  geometry = new THREE.CircleBufferGeometry(0.00166, 24);
  button1 = new THREE.Mesh(geometry, material.clone());
  button1.position.y = 0.0002;
  button1.position.z = - 0.0035;
  button1.rotation.x = - Math.PI / 2;
  mesh.add(button1);

  geometry = new THREE.CircleBufferGeometry(0.00025, 24);
  touch = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ blending: THREE.AdditiveBlending, opacity: 0.2, transparent: true }));
  touch.position.z = 0.0001;
  touch.visible = false;
  button1.add(touch);

  geometry = new THREE.CircleBufferGeometry(0.0005, 24);
  button2 = new THREE.Mesh(geometry, material.clone());
  button2.position.y = 0.0002;
  button2.position.z = - 0.0008;
  button2.rotation.x = - Math.PI / 2;
  mesh.add(button2);

  button3 = new THREE.Mesh(geometry, material.clone());
  button3.position.y = 0.0002;
  button3.position.z = 0.0008;
  button3.rotation.x = - Math.PI / 2;
  mesh.add(button3);
});

var world, mass, body;

function initCannon() {
  world = new CANNON.World();
  world.gravity.set(0, -6, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;
}

function updatePhysics() {
  // Step the physics world
  world.step(timeStep);
  // Copy coordinates from Cannon.js to Three.js
  for (const go of gameObjects) {
    const [mesh, body] = go;
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  }
}

function animate() {
  animateEnemyCube();
  updatePhysics();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);