/* ============================================================
   background.js — shared Three.js scene
   A drifting starfield + a constellation of connected "nodes"
   (a nod to graphs / data structures), with an optional glowing
   centerpiece shape for the hero. Subtle camera parallax follows
   the mouse. Respects prefers-reduced-motion.
   ============================================================ */

function initSpaceBackground(config){
  config = Object.assign({
    starCount: 900,
    nodeCount: 36,
    centerpiece: false,
    ambientShape: false,
    parallax: true,
    startWarped: false
  }, config || {});

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.getElementById('bg-canvas');
  if(!canvas || typeof THREE === 'undefined') return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  var HOME_Z = 420;
  var WARP_Z = 34;
  camera.position.z = (config.startWarped && !reduceMotion) ? WARP_Z : HOME_Z;

  /* ---------- starfield ---------- */
  var starGeo = new THREE.BufferGeometry();
  var starPos = new Float32Array(config.starCount * 3);
  for(var i = 0; i < config.starCount; i++){
    starPos[i*3]   = (Math.random() - 0.5) * 1800;
    starPos[i*3+1] = (Math.random() - 0.5) * 1800;
    starPos[i*3+2] = (Math.random() - 0.5) * 1200 - 200;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  var starMat = new THREE.PointsMaterial({ color: 0x9fb4ff, size: 1.6, transparent: true, opacity: 0.65, sizeAttenuation: true });
  var stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* ---------- node graph (DSA motif) ---------- */
  var nodeGroup = new THREE.Group();
  var nodePts = [];
  var spread = 480;
  for(var n = 0; n < config.nodeCount; n++){
    var p = new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread * 0.6,
      (Math.random() - 0.5) * 260 - 80
    );
    nodePts.push(p);
  }
  var nodeGeo = new THREE.BufferGeometry();
  var nodeArr = new Float32Array(nodePts.length * 3);
  nodePts.forEach(function(p, idx){
    nodeArr[idx*3] = p.x; nodeArr[idx*3+1] = p.y; nodeArr[idx*3+2] = p.z;
  });
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodeArr, 3));
  var nodeMat = new THREE.PointsMaterial({ color: 0x5b8cff, size: 4.2, transparent: true, opacity: 0.85 });
  nodeGroup.add(new THREE.Points(nodeGeo, nodeMat));

  /* connect nearby nodes with thin glowing edges */
  var linePositions = [];
  var maxDist = 150;
  for(var a = 0; a < nodePts.length; a++){
    for(var b = a + 1; b < nodePts.length; b++){
      if(nodePts[a].distanceTo(nodePts[b]) < maxDist){
        linePositions.push(nodePts[a].x, nodePts[a].y, nodePts[a].z);
        linePositions.push(nodePts[b].x, nodePts[b].y, nodePts[b].z);
      }
    }
  }
  var lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
  var lineMat = new THREE.LineBasicMaterial({ color: 0x4a5fc7, transparent: true, opacity: 0.28 });
  nodeGroup.add(new THREE.LineSegments(lineGeo, lineMat));
  scene.add(nodeGroup);

  /* ---------- optional glowing centerpiece (hero only) ---------- */
  var centerpiece = null;
  var satellites = [];
  if(config.centerpiece){
    var geo = new THREE.IcosahedronGeometry(86, 1);
    var mat = new THREE.MeshBasicMaterial({ color: 0x7c5cff, wireframe: true, transparent: true, opacity: 0.55 });
    centerpiece = new THREE.Mesh(geo, mat);
    centerpiece.position.set(0, 0, -40);
    scene.add(centerpiece);

    var coreGeo = new THREE.IcosahedronGeometry(58, 1);
    var coreMat = new THREE.MeshBasicMaterial({ color: 0x5b8cff, wireframe: true, transparent: true, opacity: 0.3 });
    var core = new THREE.Mesh(coreGeo, coreMat);
    core.position.copy(centerpiece.position);
    scene.add(core);
    centerpiece.userData.core = core;

    /* tilted orbital ring, like a sci-fi planetary halo */
    var ringGeo = new THREE.TorusGeometry(146, 0.9, 8, 120);
    var ringMat = new THREE.MeshBasicMaterial({ color: 0x46e0c4, transparent: true, opacity: 0.32 });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(centerpiece.position);
    ring.rotation.x = Math.PI / 2.6;
    ring.rotation.y = 0.3;
    scene.add(ring);
    centerpiece.userData.ring = ring;

    var ring2 = ring.clone();
    ring2.material = ringMat.clone();
    ring2.material.opacity = 0.16;
    ring2.scale.setScalar(1.32);
    ring2.rotation.x = -Math.PI / 2.3;
    ring2.rotation.y = -0.4;
    scene.add(ring2);
    centerpiece.userData.ring2 = ring2;

    /* small satellites orbiting the centerpiece on independent paths */
    var satCount = 4;
    for(var s = 0; s < satCount; s++){
      var satGeo = new THREE.OctahedronGeometry(7 + (s % 2) * 3, 0);
      var satColor = s % 2 === 0 ? 0x5b8cff : 0x46e0c4;
      var satMat = new THREE.MeshBasicMaterial({ color: satColor, wireframe: true, transparent: true, opacity: 0.8 });
      var sat = new THREE.Mesh(satGeo, satMat);
      sat.userData.radius = 130 + s * 26;
      sat.userData.speed = 0.18 - s * 0.025;
      sat.userData.offset = s * (Math.PI * 2 / satCount);
      sat.userData.tilt = 0.3 + s * 0.18;
      scene.add(sat);
      satellites.push(sat);
    }
  }

  /* ---------- ambient drifting shape (sub-pages) ---------- */
  var ambient = null;
  if(config.ambientShape){
    var aGeo = new THREE.TorusKnotGeometry(34, 9, 110, 10);
    var aMat = new THREE.MeshBasicMaterial({ color: 0x5b8cff, wireframe: true, transparent: true, opacity: 0.22 });
    ambient = new THREE.Mesh(aGeo, aMat);
    ambient.position.set(260, 120, -180);
    scene.add(ambient);
    ambient.userData.baseY = ambient.position.y;
  }

  /* ---------- mouse parallax ---------- */
  var mouseX = 0, mouseY = 0;
  if(config.parallax && !reduceMotion){
    window.addEventListener('mousemove', function(e){
      mouseX = (e.clientX / window.innerWidth - 0.5);
      mouseY = (e.clientY / window.innerHeight - 0.5);
    });
  }

  window.addEventListener('resize', function(){
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  var clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    if(!reduceMotion){
      stars.rotation.y = t * 0.01;
      nodeGroup.rotation.y = t * 0.015;
      nodeGroup.rotation.x = Math.sin(t * 0.05) * 0.05;

      if(centerpiece){
        centerpiece.rotation.y = t * 0.12;
        centerpiece.rotation.x = t * 0.07;
        centerpiece.userData.core.rotation.y = -t * 0.09;
        centerpiece.userData.core.rotation.x = -t * 0.05;
        centerpiece.userData.ring.rotation.z = t * 0.06;
        centerpiece.userData.ring2.rotation.z = -t * 0.045;

        satellites.forEach(function(sat){
          var ang = t * sat.userData.speed + sat.userData.offset;
          var r = sat.userData.radius;
          var tilt = sat.userData.tilt;
          sat.position.x = Math.cos(ang) * r;
          sat.position.z = Math.sin(ang) * r * Math.cos(tilt) - 40;
          sat.position.y = Math.sin(ang) * r * Math.sin(tilt);
          sat.rotation.x = t * 0.6;
          sat.rotation.y = t * 0.4;
        });
      }
      if(ambient){
        ambient.rotation.y = t * 0.08;
        ambient.rotation.x = t * 0.05;
        ambient.position.y = ambient.userData.baseY + Math.sin(t * 0.25) * 14;
      }
      camera.position.x += (mouseX * 60 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 40 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
    }
    renderer.render(scene, camera);
  }
  animate();

  /* ---------- page-transition "warp" API ----------
     warpOut: camera flies toward the node graph as the page exits.
     warpIn: camera pulls back out as the new page settles in.
     This is what makes the next page feel like it emerges from
     the current page's 3D scene, rather than a hard page jump. */
  function animateValue(from, to, duration, onUpdate, onDone){
    if(reduceMotion){ onUpdate(to); if(onDone) onDone(); return; }
    var start = null;
    function step(ts){
      if(!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = p < 1 ? 1 - Math.pow(1 - p, 3) : 1;
      onUpdate(from + (to - from) * eased);
      if(p < 1){ requestAnimationFrame(step); } else if(onDone){ onDone(); }
    }
    requestAnimationFrame(step);
  }

  window.spaceBG = {
    warpOut: function(duration, onDone){
      animateValue(camera.position.z, WARP_Z, duration || 620, function(v){
        camera.position.z = v;
        lineMat.opacity = 0.28 + (1 - (v - WARP_Z) / (HOME_Z - WARP_Z)) * 0.55;
      }, onDone);
    },
    warpIn: function(duration){
      animateValue(camera.position.z, HOME_Z, duration || 750, function(v){
        camera.position.z = v;
        lineMat.opacity = 0.28 + (1 - (v - WARP_Z) / (HOME_Z - WARP_Z)) * 0.55;
      });
    }
  };
}
