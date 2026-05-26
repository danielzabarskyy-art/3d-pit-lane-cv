import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Stars, ContactShadows, Environment, Text } from "@react-three/drei";
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
  {
    id: "police",
    label: "Police",
    model: "police",
    accent: "#60a5fa",
    description: "Clean, sharp, and professional.",
  },
  {
    id: "taxi",
    label: "Taxi",
    model: "taxiStylized",
    accent: "#facc15",
    description: "Bold, visible, and fun.",
  },
  {
    id: "classic",
    label: "Classic",
    model: "carStylized",
    accent: "#38bdf8",
    description: "Simple, balanced, and smooth.",
  },
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

// Longer track: bigger spacing between gates.
const GATE_Z = [-22, -11, 0, 11, 22];
const TRACK_START_Z = -31;
const TRACK_END_Z = 31;

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

    instance.animations.forEach((clip) => {
      mixer.clipAction(clip).reset().play();
    });

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
      {[[-0.78, 0.2, 0.72], [0.78, 0.2, 0.72], [-0.78, 0.2, -0.72], [0.78, 0.2, -0.72]].map((pos, index) => (
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

function Road() {
  const dashCount = 25;
  const dashSpacing = (TRACK_END_Z - TRACK_START_Z) / dashCount;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[18, 72]} />
        <meshStandardMaterial color="#020617" roughness={0.95} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
        <planeGeometry args={[6.2, 66]} />
        <meshStandardMaterial color="#172033" roughness={0.9} />
      </mesh>

      {Array.from({ length: dashCount }).map((_, index) => (
        <mesh key={index} position={[0, 0.01, TRACK_START_Z + index * dashSpacing + 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.14, 1.05]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.45} />
        </mesh>
      ))}

      <mesh position={[-3.2, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.13, 66]} />
        <meshStandardMaterial color="#facc15" roughness={0.5} />
      </mesh>

      <mesh position={[3.2, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.13, 66]} />
        <meshStandardMaterial color="#facc15" roughness={0.5} />
      </mesh>

      <Html position={[0, 0.15, TRACK_START_Z]} center>
        <div className="track-marker">START</div>
      </Html>

      <Html position={[0, 0.15, TRACK_END_Z]} center>
        <div className="track-marker">FINISH</div>
      </Html>
    </group>
  );
}

function GateSignText({ section }) {
  return (
    <group position={[0, 3.32, -0.19]} rotation={[0, Math.PI, 0]}>
      <Text
        position={[0, 0.17, 0]}
        fontSize={0.28}
        maxWidth={4.6}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
      >
        {section.gate}
        <meshBasicMaterial attach="material" color={section.accent} side={THREE.DoubleSide} toneMapped={false} />
      </Text>

      <Text
        position={[0, -0.18, 0]}
        fontSize={0.42}
        maxWidth={5.3}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
      >
        {section.label}
        <meshBasicMaterial attach="material" color="#f8fafc" side={THREE.DoubleSide} toneMapped={false} />
      </Text>
    </group>
  );
}

function Gate({ section, z, isActive, isPassed, onSelect }) {
  const accent = section.accent;

  return (
    <group position={[0, 0, z]} onClick={() => onSelect(section)}>
      <mesh position={[-3.25, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.24, 2.7, 0.24]} />
        <meshStandardMaterial color={isPassed ? accent : "#64748b"} roughness={0.5} />
      </mesh>

      <mesh position={[3.25, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.24, 2.7, 0.24]} />
        <meshStandardMaterial color={isPassed ? accent : "#64748b"} roughness={0.5} />
      </mesh>

      <mesh position={[0, 2.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.72, 0.28, 0.28]} />
        <meshStandardMaterial color={isActive ? accent : "#0f172a"} roughness={0.4} emissive={isActive ? accent : "#000000"} emissiveIntensity={isActive ? 0.25 : 0} />
      </mesh>

      <mesh position={[0, 3.28, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[4.25, 0.98, 0.1]} />
        <meshStandardMaterial color="#020617" roughness={0.38} metalness={0.1} emissive={isActive ? accent : "#000000"} emissiveIntensity={isActive ? 0.12 : 0} />
      </mesh>

      <GateSignText section={section} />

      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.9, 0.2]} />
        <meshStandardMaterial color={accent} transparent opacity={isPassed ? 0.95 : 0.45} />
      </mesh>
    </group>
  );
}

function PlayerCar({ onGatePassed, carRef, playerModel }) {
  const keys = useRef({});
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
    const car = carRef.current;
    if (!car) return;

    const speed = 7.0;
    let dx = 0;
    let dz = 0;

    if (keys.current["w"] || keys.current["arrowup"]) dz += 1;
    if (keys.current["s"] || keys.current["arrowdown"]) dz -= 1;
    if (keys.current["a"] || keys.current["arrowleft"]) dx -= 1;
    if (keys.current["d"] || keys.current["arrowright"]) dx += 1;

    if (dx !== 0 || dz !== 0) {
      const length = Math.hypot(dx, dz);
      dx /= length;
      dz /= length;

      car.position.x = THREE.MathUtils.clamp(car.position.x + dx * speed * delta, -2.55, 2.55);
      car.position.z = THREE.MathUtils.clamp(car.position.z + dz * speed * delta, TRACK_START_Z - 1, TRACK_END_Z + 1);
      car.rotation.y = Math.atan2(dx, dz);
    }

    CV_SECTIONS.forEach((section, index) => {
      const gateZ = GATE_Z[index];
      const nearGate = Math.abs(car.position.z - gateZ) < 0.46;
      const insideRoad = Math.abs(car.position.x) < 3.0;

      if (nearGate && insideRoad && !passedIds.current.has(section.id)) {
        passedIds.current.add(section.id);
        onGatePassed(section);
      }
    });
  });

  return (
    <group ref={carRef} position={[0, 0.02, TRACK_START_Z + 1.2]}>
      <Car type={playerModel} accent="#f8fafc" scale={1.1} />
      <Html position={[0, 1.65, 0]} center>
        <div className="player-tag">YOU</div>
      </Html>
    </group>
  );
}

function CameraRig({ targetRef }) {
  const { camera } = useThree();
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const target = targetRef.current;
    if (!target) return;

    desired.set(target.position.x + 6.7, 6.1, target.position.z - 8.7);
    camera.position.lerp(desired, 0.065);

    lookAt.set(target.position.x, 0.75, target.position.z + 2.25);
    camera.lookAt(lookAt);
  });

  return null;
}

function Scene({ activeId, passedIds, onGatePassed, onSelect, playerModel }) {
  const playerRef = useRef();

  return (
    <>
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 22, 74]} />

      <ambientLight intensity={0.68} />
      <directionalLight position={[8, 12, 6]} intensity={2.8} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 4, -22]} intensity={2.4} color="#38bdf8" />
      <pointLight position={[0, 4, 0]} intensity={2.2} color="#a78bfa" />
      <pointLight position={[0, 4, 22]} intensity={2.3} color="#f97316" />

      <Environment preset="city" />
      <Stars radius={95} depth={65} count={1800} factor={3.2} fade speed={0.35} />

      <Road />

      {CV_SECTIONS.map((section, index) => (
        <Gate
          key={section.id}
          section={section}
          z={GATE_Z[index]}
          isActive={activeId === section.id}
          isPassed={passedIds.includes(section.id)}
          onSelect={onSelect}
        />
      ))}

      <PlayerCar onGatePassed={onGatePassed} carRef={playerRef} playerModel={playerModel} />
      <CameraRig targetRef={playerRef} />

      <ContactShadows opacity={0.5} scale={24} blur={2.8} far={10} position={[0, 0.02, 0]} />
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
    setPassedIds((current) => current.includes(section.id) ? current : [...current, section.id]);
  };

  return (
    <main className="app">
      {hasStarted && (
        <Canvas shadows camera={{ position: [6.5, 6, TRACK_START_Z - 7], fov: 50 }}>
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
            <strong>Drive:</strong> WASD / Arrow keys
            <span>Pass each gate to unlock the next CV section.</span>
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
