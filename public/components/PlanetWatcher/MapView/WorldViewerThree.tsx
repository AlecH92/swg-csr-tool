import React, { useEffect, useRef, useContext } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'stats.js';

import { PlanetWatcherContext } from '../DataProvider';
import mapConfigs from '../data/maps';

import ObjectLayer from './ObjectLayer';
import NodeLayer from './NodeLayer';

const WorldViewerThree: React.FC = () => {
  const data = useContext(PlanetWatcherContext);
  const renderElem = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!renderElem.current) {
      return;
    }

    const stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    renderElem.current!.appendChild(stats.dom);
    stats.dom.style.position = 'absolute';

    const rect = renderElem.current!.getBoundingClientRect();

    const mapConfig = mapConfigs.find(map => map.id === data.planet);

    const FRUSTRUM_SIZE = (mapConfig?.planetMap?.size ?? 16384) / 2;

    const scene = new THREE.Scene();
    const aspect = rect.width / rect.height;
    const camera = new THREE.OrthographicCamera(
      -FRUSTRUM_SIZE * aspect,
      FRUSTRUM_SIZE * aspect,
      FRUSTRUM_SIZE,
      -FRUSTRUM_SIZE,
      0,
      10000
    );

    camera.position.set(0, -50, 0);
    camera.lookAt(scene.position);
    camera.zoom = 1;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    renderer.setSize(rect.width, rect.height);
    renderElem.current!.appendChild(renderer.domElement);

    window.addEventListener('resize', () => {
      const renderRect = renderElem.current!.getBoundingClientRect();
      const newAspect = renderRect.width / renderRect.height;

      camera.left = -FRUSTRUM_SIZE * newAspect;
      camera.right = FRUSTRUM_SIZE * newAspect;
      camera.top = FRUSTRUM_SIZE;
      camera.bottom = -FRUSTRUM_SIZE;

      camera.updateProjectionMatrix();

      renderer.setSize(renderRect.width, renderRect.height);
    });

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableRotate = false;
    orbit.enablePan = true;
    // @ts-expect-error
    orbit.mouseButtons = { LEFT: THREE.MOUSE.PAN };
    // @ts-expect-error
    orbit.touches = {
      ONE: THREE.TOUCH.DOLLY_PAN,
    };
    orbit.maxPolarAngle = Math.PI;
    orbit.minPolarAngle = Math.PI;
    orbit.zoomSpeed = 5;
    orbit.minDistance = 50;

    const texture = new THREE.TextureLoader().load(
      `https://swg-map-viewer.geit.uk/${mapConfig?.raster?.backgroundImage}`
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    const planeGeo = new THREE.PlaneGeometry(FRUSTRUM_SIZE * 2, FRUSTRUM_SIZE * 2);
    const planeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture, side: THREE.FrontSide });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.setRotationFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    plane.position.set(mapConfig?.planetMap?.offset.x ?? 0, 50, mapConfig?.planetMap?.offset.z ?? 0);
    scene.add(plane);

    const instancedObjects = new ObjectLayer(data, camera, renderer.domElement);
    scene.add(instancedObjects);

    const nodeLayer = new NodeLayer(data);
    scene.add(nodeLayer);

    camera.position.z = 50;

    let rafId = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      stats.begin();

      renderer.render(scene, camera);
      stats.end();
    };
    animate();

    const mountingRef = renderElem.current;

    return function cleanup() {
      if (mountingRef) {
        cancelAnimationFrame(rafId);
        scene.clear();
        renderer.dispose();
        mountingRef.removeChild(renderer.domElement);
      }
    };
  }, [data]);

  return (
    <div
      id="planetWatcherRender"
      style={{ width: '100%', position: 'relative', height: '100%' }}
      ref={renderElem}
    ></div>
  );
};

export default WorldViewerThree;
