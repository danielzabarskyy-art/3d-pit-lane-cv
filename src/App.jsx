import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Text } from "@react-three/drei";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

const INTRO_PARAGRAPH =
  "I see myself as a motivated and hands-on person who enjoys understanding how things work in real life, not only in theory. I’m curious, practical, and I like solving problems by combining engineering thinking with actual testing and building. I enjoy working with physical systems, learning new technologies, and taking responsibility when something needs to move forward. I’m looking for a place where I can grow as a mechanical engineer, contribute to real product development, and be part of a team that works on challenging and meaningful technology.";

const MODEL_PATHS = {
  car: "./models/Car.fbx",
  carStylized: "./models/Car_stylized.fbx",
  police: "./models/Police.fbx",
  policeStylized: "./models/Police_stylized.fbx",
  taxi: "./models/Taxi.fbx",
  taxiStylized: "./models/Taxi_stylized.fbx",
};

const PLAYER_CARS = [
  { id: "police", label: "Police", model: "police", accent: "#60a5fa", description: "Clean, sharp, and professional." },
  { id: "taxi", label: "Taxi", model: "taxiStylized", accent: "#facc15", description: "Bold, visible, and fun." },
  { id: "classic", label: "Classic", model: "carStylized", accent: "#38bdf8", description: "Simple, balanced, and smooth." },
];

const CV_SECTIONS = [
  {
    id: "stratasys",
    label: "Stratasys",
    gate: "Gate 01",
    accent: "#38bdf8",
    title: "Stratasys Ltd. – Mechanical Engineering Student",
    period: "Feb 2025 – Present",
    bullets: [
      "Built a comprehensive understanding of engineering processes (ECR, ECO, DEV, MCO).",
      "Implemented and programmed a robotic arm, integrating control systems for automated operations.",
      "Participated in mechanical design tasks, including preparation and review of technical drawings and documentation.",
      "Worked with CAD and PLM systems (SolidWorks, Agile PLM, EPDM) to manage models, drawings, and engineering data.",
      "Supported maintenance of mechanical documentation, ensuring accuracy and consistency.",
    ],
  },
  {
    id: "bgracing",
    label: "BGRaicing",
    gate: "Gate 02",
    accent: "#facc15",
    title: "BGRaicing – System Engineer",
    period: "2024 – Present",
    bullets: [
      "Hands-on experience in a Formula Student project, encompassing end-to-end vehicle development from planning and design to production.",
      "Led integration between mechanical and electrical systems to ensure seamless functionality.",
      "Led and managed the Battery Systems and Electronic Packaging engineering teams.",
      "Supported prototype build, system testing, and issue resolution through hands-on engineering.",
    ],
  },
  {
    id: "education",
    label: "Education",
    gate: "Gate 03",
    accent: "#a78bfa",
    title: "B.Sc. Mechanical Engineering – Ben-Gurion University",
    period: "2023 – Present | Expected Graduation: 2026 | GPA: 81",
    bullets: ["Mechanical Engineering student at Ben-Gurion University."],
  },
  {
    id: "skills",
    label: "Skills",
    gate: "Gate 04",
    accent: "#22c55e",
    title: "Skills",
    period: "Technical stack",
    bullets: ["SolidWorks", "C", "MATLAB", "Agile PLM", "EPDM", "Oracle", "Microsoft Office"],
  },
  {
    id: "military",
    label: "Military",
    gate: "Gate 05",
    accent: "#f97316",
    title: "Combat Officer, Battalion 601 – Combat Engineering Corps",
    period: "2015 – 2020",
    bullets: [
      "Led detailed planning and execution of activities and arrests.",
      "Distinguished of specialized courses including Class Commanders, Senior Sergent, Officers (with excellence), and Commando training.",
    ],
  },
];

const TRACK_WIDTH = 7.2;
const SHOULDER_WIDTH = 9.8;
const LANE_LIMIT = 2.45;
const CURVE_POINTS = [
  new THREE.Vector3(0, 0, -72),
  new THREE.Vector3(7, 0, -58),
  new THREE.Vector3(16, 0, -44),
  new THREE.Vector3(10, 0, -28),
  new THREE.Vector3(-4, 0, -10),
  new THREE.Vector3(-16, 0, 8),
  new THREE.Vector3(-6, 0, 26),
  new THREE.Vector3(10, 0, 46),
  new THREE.Vector3(17, 0, 64),
  new THREE.Vector3(8, 0, 80),
];
const GATE_T = [0.16, 0.33, 0.5, 0.68, 0.84];
const START_T = 0.04;

const centerlineCurve = new THREE.CatmullRomCurve3(CURVE_POINTS, false, "catmullrom", 0.5);

function getTrackData(t) {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  const point = centerlineCurve.getPointAt(clamped);
  const tangent3 = centerlineCurve.getTangentAt(clamped).normalize();
  const tangent = new THREE.Vector3(tangent3.x, 0, tangent3.z).normalize();
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  return { point, tangent, normal };
}

function prepareFbxScene(fbx, targetSize = 2.4) {
  const model = clone(fbx);
  const root = new THREE.Group();

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.frustumCulled = false;
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          material.transparent = false;
          material.opacity = 1;
          material.side = THREE.DoubleSide;
          if ("roughness" in material) material.roughness = 0.45;
          if ("metalness" in material) material.metalness = 0.08;
          material.needsUpdate = true;
        });
      }
    }
  });

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  model.position.set(-center.x, -box.min.y, -center.z);
  root.add(model);
  const largest = Math.max(size.x, size.y, size.z) || 1;
  root.scale.setScalar(targetSize / largest);
  root.rotation.y = 0;
  root.animations = fbx.animations || [];
  return root;
}

function usePreparedFbx(path) {
  const fbx = useLoader(FBXLoader, path);
  return useMemo(() => prepareFbxScene(fbx), [fbx]);
}

function FbxCar({ type = "carStylized", scale = 1, ...props }) {
  const preparedModel = usePreparedFbx(MODEL_PATHS[type] || MODEL_PATHS.carStylized);
  const instance = useMemo(() => clone(preparedModel), [preparedModel]);
  const mixerRef = useRef(null);

  useEffect(() => {
    if (!instance.animations || instance.animations.length === 0) return;
    const mixer = new THREE.AnimationMixer(instance);
    mixerRef.current = mixer;
    instance.animations.forEach((clip) => mixer.clipAction(clip).reset().play());
    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [instance]);

  useFrame((_, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta);
  });

  return (
    <group scale={scale} {...props}>
      <primitive object={instance} />
    </group>
  );
}

function FallbackCar({ color = "#38bdf8", scale = 1, ...props }) {
  return (
    <group scale={scale} {...props}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[1.35, 0.42, 2.2]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.78, -0.1]} castShadow>
        <boxGeometry args={[0.9, 0.45, 0.95]} />
        <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.2} />
      </mesh>
      {[
        [-0.78, 0.2, 0.72], [0.78, 0.2, 0.72], [-0.78, 0.2, -0.72], [0.78, 0.2, -0.72],
      ].map((pos, index) => (
        <mesh key={index} position={pos} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.22, 24]} />
          <meshStandardMaterial color="#020617" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Car({ type, accent, ...props }) {
  return (
    <Suspense fallback={<FallbackCar color={accent} {...props} />}>
      <FbxCar type={type} {...props} />
    </Suspense>
  );
}

function makeRibbonGeometry(width) {
  const segments = 260;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const { point, normal } = getTrackData(t);
    const left = point.clone().add(normal.clone().multiplyScalar(-width / 2));
    const right = point.clone().add(normal.clone().multiplyScalar(width / 2));
    positions.push(left.x, 0, left.z, right.x, 0, right.z);
    uvs.push(0, t * 30, 1, t * 30);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, c, d, b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

function Ribbon({ width, color, y = 0, roughness = 0.9 }) {
  const geometry = useMemo(() => makeRibbonGeometry(width), [width]);
  return (
    <mesh geometry={geometry} position={[0, y, 0]} receiveShadow>
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}

function RoadMarkings() {
  const centerDashes = [];
  for (let t = 0.03; t <= 0.97; t += 0.022) {
    const { point, tangent } = getTrackData(t);
    const angle = Math.atan2(tangent.x, tangent.z);
    centerDashes.push(
      <mesh key={`c-${t}`} position={[point.x, 0.018, point.z]} rotation={[-Math.PI / 2, angle, 0]}>
        <planeGeometry args={[0.16, 1.15]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.42} />
      </mesh>
    );
  }

  const sideMarks = [];
  for (let t = 0.01; t <= 0.99; t += 0.015) {
    const { point, tangent, normal } = getTrackData(t);
    const angle = Math.atan2(tangent.x, tangent.z);
    const left = point.clone().add(normal.clone().multiplyScalar(-TRACK_WIDTH / 2 + 0.14));
    const right = point.clone().add(normal.clone().multiplyScalar(TRACK_WIDTH / 2 - 0.14));
    sideMarks.push(
      <mesh key={`l-${t}`} position={[left.x, 0.02, left.z]} rotation={[-Math.PI / 2, angle, 0]}>
        <planeGeometry args={[0.12, 1.3]} />
        <meshStandardMaterial color="#f1df74" roughness={0.45} />
      </mesh>
    );
    sideMarks.push(
      <mesh key={`r-${t}`} position={[right.x, 0.02, right.z]} rotation={[-Math.PI / 2, angle, 0]}>
        <planeGeometry args={[0.12, 1.3]} />
        <meshStandardMaterial color="#f1df74" roughness={0.45} />
      </mesh>
    );
  }

  return <group>{centerDashes}{sideMarks}</group>;
}

function Road() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#b7d49a" roughness={1} />
      </mesh>
      <Ribbon width={SHOULDER_WIDTH} color="#45526a" y={-0.012} roughness={0.95} />
      <Ribbon width={TRACK_WIDTH} color="#2d3950" y={0} roughness={0.9} />
      <RoadMarkings />
    </group>
  );
}

function GateSignText({ section }) {
  return (
    <group position={[0, 3.32, -0.19]} rotation={[0, Math.PI, 0]}>
      <Text position={[0, 0.17, 0]} fontSize={0.28} maxWidth={4.6} textAlign="center" anchorX="center" anchorY="middle">
        {section.gate}
        <meshBasicMaterial attach="material" color={section.accent} side={THREE.DoubleSide} toneMapped={false} />
      </Text>
      <Text position={[0, -0.18, 0]} fontSize={0.42} maxWidth={5.3} textAlign="center" anchorX="center" anchorY="middle">
        {section.label}
        <meshBasicMaterial attach="material" color="#f8fafc" side={THREE.DoubleSide} toneMapped={false} />
      </Text>
    </group>
  );
}

function Gate({ section, t, isActive, isPassed, onSelect }) {
  const accent = section.accent;
  const { point, tangent } = getTrackData(t);
  const angle = Math.atan2(tangent.x, tangent.z);

  return (
    <group position={[point.x, 0, point.z]} rotation={[0, angle, 0]} onClick={() => onSelect(section)}>
      <mesh position={[-TRACK_WIDTH / 2 + 0.35, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.24, 2.7, 0.24]} />
        <meshStandardMaterial color={isPassed ? accent : "#64748b"} roughness={0.5} />
      </mesh>
      <mesh position={[TRACK_WIDTH / 2 - 0.35, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.24, 2.7, 0.24]} />
        <meshStandardMaterial color={isPassed ? accent : "#64748b"} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[TRACK_WIDTH - 0.7, 0.28, 0.28]} />
        <meshStandardMaterial color={isActive ? accent : "#0f172a"} roughness={0.4} emissive={isActive ? accent : "#000000"} emissiveIntensity={isActive ? 0.25 : 0} />
      </mesh>
      <mesh position={[0, 3.28, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[4.25, 0.98, 0.1]} />
        <meshStandardMaterial color="#020617" roughness={0.38} metalness={0.1} emissive={isActive ? accent : "#000000"} emissiveIntensity={isActive ? 0.12 : 0} />
      </mesh>
      <GateSignText section={section} />
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TRACK_WIDTH - 0.3, 0.2]} />
        <meshStandardMaterial color={accent} transparent opacity={isPassed ? 0.95 : 0.45} />
      </mesh>
    </group>
  );
}

function PlayerCar({ onGatePassed, playerModel }) {
  const keys = useRef({});
  const groupRef = useRef();
  const carState = useRef({ progress: START_T, laneOffset: 0 });
  const passedIds = useRef(new Set());

  useEffect(() => {
    const down = (event) => {
      keys.current[event.key.toLowerCase()] = true;
    };
    const up = (event) => {
      keys.current[event.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    let { progress, laneOffset } = carState.current;
    const forward = (keys.current["w"] || keys.current["arrowup"]) ? 1 : 0;
    const backward = (keys.current["s"] || keys.current["arrowdown"]) ? 1 : 0;
    const left = (keys.current["a"] || keys.current["arrowleft"]) ? 1 : 0;
    const right = (keys.current["d"] || keys.current["arrowright"]) ? 1 : 0;

    progress += (forward - backward) * delta * 0.08;
    laneOffset += (left - right) * delta * 2.4;

    progress = THREE.MathUtils.clamp(progress, 0.001, 0.999);
    laneOffset = THREE.MathUtils.clamp(laneOffset, -LANE_LIMIT, LANE_LIMIT);

    carState.current.progress = progress;
    carState.current.laneOffset = laneOffset;

    const { point, tangent, normal } = getTrackData(progress);
    const pos = point.clone().add(normal.clone().multiplyScalar(laneOffset));
    group.position.copy(pos);
    group.position.y = 0.02;
    group.rotation.y = Math.atan2(tangent.x, tangent.z);

    CV_SECTIONS.forEach((section, index) => {
      const gateT = GATE_T[index];
      if (progress >= gateT && !passedIds.current.has(section.id)) {
        passedIds.current.add(section.id);
        onGatePassed(section);
      }
    });
  });

  return (
    <group ref={groupRef}>
      <Car type={playerModel} accent="#f8fafc" scale={1.1} />
    </group>
  );
}

function CameraRig({ targetRef }) {
  const { camera } = useThree();
  const desired = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const target = targetRef.current;
    if (!target) return;
    const forward = new THREE.Vector3(0, 0, 1).applyEuler(target.rotation);
    desired.copy(target.position).add(new THREE.Vector3(0, 5.8, 0)).add(forward.clone().multiplyScalar(-9));
    camera.position.lerp(desired, 0.07);
    lookAt.copy(target.position).add(forward.clone().multiplyScalar(4)).add(new THREE.Vector3(0, 1.0, 0));
    camera.lookAt(lookAt);
  });

  return null;
}

function Scene({ activeId, passedIds, onGatePassed, onSelect, playerModel }) {
  const playerRef = useRef();

  return (
    <>
      <color attach="background" args={["#87CEEB"]} />
      <fog attach="fog" args={["#87CEEB", 80, 190]} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[14, 20, 8]} intensity={2.4} castShadow shadow-mapSize={[2048, 2048]} />
      <Environment preset="park" />

      <Road />
      {CV_SECTIONS.map((section, index) => (
        <Gate
          key={section.id}
          section={section}
          t={GATE_T[index]}
          isActive={activeId === section.id}
          isPassed={passedIds.includes(section.id)}
          onSelect={onSelect}
        />
      ))}

      <group ref={playerRef}>
        <PlayerCar onGatePassed={onGatePassed} playerModel={playerModel} />
      </group>
      <CameraRig targetRef={playerRef} />

      <ContactShadows opacity={0.45} scale={36} blur={2.8} far={16} position={[0, 0.02, 0]} />
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
    </>
  );
}

function CvPanel({ activeSection, passedIds, onSelect }) {
  return (
    <aside className="cv-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Daniel Zabarsky</p>
          <h1>3D Gate CV</h1>
        </div>
        <span className="status">{passedIds.length}/5</span>
      </div>

      {!activeSection ? (
        <div className="empty-card">
          <p className="pit-name">Ready</p>
          <h2>Drive through Gate 01 to reveal the first CV section.</h2>
          <p className="period">Use WASD or arrow keys.</p>
        </div>
      ) : (
        <div className="active-card" style={{ "--accent": activeSection.accent }}>
          <p className="pit-name">{activeSection.gate}</p>
          <h2>{activeSection.title}</h2>
          <p className="period">{activeSection.period}</p>
          <ul>
            {activeSection.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="section-buttons">
        {CV_SECTIONS.map((section) => {
          const isUnlocked = passedIds.includes(section.id);
          return (
            <button
              key={section.id}
              className={`${activeSection?.id === section.id ? "selected" : ""} ${!isUnlocked ? "locked" : ""}`}
              onClick={() => isUnlocked && onSelect(section)}
              style={{ "--accent": section.accent }}
              disabled={!isUnlocked}
            >
              <span>{section.gate}</span>
              {section.label}
              {!isUnlocked && <em>locked</em>}
            </button>
          );
        })}
      </div>

      <div className="contact-box">
        <a href="mailto:danielzabarskyy@gmail.com">danielzabarskyy@gmail.com</a>
        <span>053-3372999</span>
        <span>Bror hail</span>
      </div>
    </aside>
  );
}

function CarSelectOverlay({ selectedCar, setSelectedCar, onStart }) {
  return (
    <div className="select-screen">
      <div className="select-card">
        <p className="eyebrow">Interactive resume</p>
        <h2>Daniel Zabarsky CV</h2>
        <p className="intro-paragraph">{INTRO_PARAGRAPH}</p>
        <div className="select-divider" />
        <h3>Choose your car</h3>
        <div className="car-select-grid">
          {PLAYER_CARS.map((car) => (
            <button
              key={car.id}
              className={`car-select-card ${selectedCar.id === car.id ? "selected" : ""}`}
              style={{ "--accent": car.accent }}
              onClick={() => setSelectedCar(car)}
            >
              <span className="car-icon">◆</span>
              <strong>{car.label}</strong>
              <small>{car.description}</small>
            </button>
          ))}
        </div>
        <button className="start-button" onClick={onStart}>Start driving</button>
      </div>
    </div>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState(null);
  const [passedIds, setPassedIds] = useState([]);
  const [selectedCar, setSelectedCar] = useState(PLAYER_CARS[0]);
  const [hasStarted, setHasStarted] = useState(false);

  const handleGatePassed = (section) => {
    setActiveSection(section);
    setPassedIds((current) => (current.includes(section.id) ? current : [...current, section.id]));
  };

  return (
    <main className="app">
      {hasStarted && (
        <Canvas shadows camera={{ position: [6.5, 6, -80], fov: 50 }}>
          <Suspense fallback={null}>
            <Scene
              activeId={activeSection?.id}
              passedIds={passedIds}
              onGatePassed={handleGatePassed}
              onSelect={setActiveSection}
              playerModel={selectedCar.model}
            />
          </Suspense>
        </Canvas>
      )}

      {hasStarted && (
        <>
          <CvPanel activeSection={activeSection} passedIds={passedIds} onSelect={setActiveSection} />
          <div className="hud">
            <strong>Drive:</strong> W/S = forward/back, A/D = lane shift
            <span>The car now follows the same curved road as the gates.</span>
          </div>
        </>
      )}

      {!hasStarted && (
        <CarSelectOverlay
          selectedCar={selectedCar}
          setSelectedCar={setSelectedCar}
          onStart={() => setHasStarted(true)}
        />
      )}
    </main>
  );
}
