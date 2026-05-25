import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Stars, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

const MODEL_PATHS = {
  car: "./models/Car.fbx",
  carStylized: "./models/Car_stylized.fbx",
  police: "./models/Police.fbx",
  policeStylized: "./models/Police_stylized.fbx",
  taxi: "./models/Taxi.fbx",
  taxiStylized: "./models/Taxi_stylized.fbx",
};

const CV_SECTIONS = [
  {
    id: "stratasys",
    label: "Stratasys",
    pit: "Pit 01",
    carType: "carStylized",
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
    pit: "Pit 02",
    carType: "taxiStylized",
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
    pit: "Pit 03",
    carType: "car",
    accent: "#a78bfa",
    title: "B.Sc. Mechanical Engineering – Ben-Gurion University",
    period: "2023 – Present | Expected Graduation: 2026 | GPA: 81",
    bullets: ["Mechanical Engineering student at Ben-Gurion University."],
  },
  {
    id: "skills",
    label: "Skills",
    pit: "Pit 04",
    carType: "taxi",
    accent: "#22c55e",
    title: "Skills",
    period: "Technical stack",
    bullets: ["SolidWorks", "C", "MATLAB", "Agile PLM", "EPDM", "Oracle", "Microsoft Office"],
  },
  {
    id: "military",
    label: "Military",
    pit: "Pit 05",
    carType: "policeStylized",
    accent: "#f97316",
    title: "Combat Officer, Battalion 601 – Combat Engineering Corps",
    period: "2015 – 2020",
    bullets: [
      "Led detailed planning and execution of activities and arrests.",
      "Distinguished of specialized courses including Class Commanders, Senior Sergent, Officers (with excellence), and Commando training.",
    ],
  },
];

const PIT_POSITIONS = [
  { x: 6.1, z: -12.0 },
  { x: 6.1, z: -6.0 },
  { x: 6.1, z: 0.0 },
  { x: 6.1, z: 6.0 },
  { x: 6.1, z: 12.0 },
];

function usePreparedFbx(path) {
  const fbx = useLoader(FBXLoader, path);

  const prepared = useMemo(() => {
    const model = clone(fbx);
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    model.position.sub(center);

    const largest = Math.max(size.x, size.y, size.z) || 1;
    const targetSize = 2.05;
    model.scale.setScalar(targetSize / largest);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            mat.roughness = mat.roughness ?? 0.48;
            mat.metalness = mat.metalness ?? 0.08;
            mat.needsUpdate = true;
          });
        }
      }
    });

    return model;
  }, [fbx]);

  return prepared;
}

function FbxCar({ type = "carStylized", scale = 1, ...props }) {
  const model = usePreparedFbx(MODEL_PATHS[type] || MODEL_PATHS.carStylized);
  const instance = useMemo(() => clone(model), [model]);
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
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[24, 42]} />
        <meshStandardMaterial color="#020617" roughness={0.95} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.6, -0.015, 0]} receiveShadow>
        <planeGeometry args={[5.0, 36]} />
        <meshStandardMaterial color="#172033" roughness={0.9} />
      </mesh>

      {Array.from({ length: 15 }).map((_, index) => (
        <mesh key={index} position={[-0.6, 0.01, -17 + index * 2.45]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.14, 1.0]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.45} />
        </mesh>
      ))}

      <mesh position={[3.2, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.16, 36]} />
        <meshStandardMaterial color="#facc15" roughness={0.5} />
      </mesh>

      <mesh position={[6.15, 0.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.2, 35]} />
        <meshStandardMaterial color="#111827" roughness={0.92} />
      </mesh>
    </group>
  );
}

function GarageBackWall() {
  return (
    <group position={[8.8, 0, 0]}>
      <mesh position={[0, 1.7, 0]} receiveShadow>
        <boxGeometry args={[0.28, 3.4, 34]} />
        <meshStandardMaterial color="#0f172a" roughness={0.65} />
      </mesh>

      {PIT_POSITIONS.map((pos, index) => (
        <mesh key={index} position={[-0.18, 1.72, pos.z]} receiveShadow>
          <boxGeometry args={[0.18, 2.55, 4.1]} />
          <meshStandardMaterial color={index % 2 === 0 ? "#1e293b" : "#111827"} roughness={0.62} />
        </mesh>
      ))}
    </group>
  );
}

function PitStop({ section, position, isActive, onSelect }) {
  return (
    <group position={[position.x, 0, position.z]}>
      <mesh
        position={[0, 0.035, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(section);
        }}
        receiveShadow
      >
        <boxGeometry args={[4.1, 0.08, 4.45]} />
        <meshStandardMaterial color={isActive ? section.accent : "#334155"} roughness={0.68} metalness={0.05} />
      </mesh>

      <mesh position={[1.95, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 1.65, 4.45]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      <mesh position={[0.0, 2.15, -1.86]} castShadow receiveShadow>
        <boxGeometry args={[3.9, 1.08, 0.18]} />
        <meshStandardMaterial color="#020617" roughness={0.45} />
      </mesh>

      <mesh position={[0, 0.08, -1.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.35, 0.15]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>

      <Html position={[0, 2.18, -2.0]} transform distanceFactor={8} occlude>
        <button className={`pit-label ${isActive ? "active" : ""}`} style={{ "--accent": section.accent }} onClick={() => onSelect(section)}>
          <span>{section.pit}</span>
          <strong>{section.label}</strong>
        </button>
      </Html>
    </group>
  );
}

function AutoPitCar({ section, pitPosition, offset, onArrive }) {
  const carRef = useRef();
  const arrivedRef = useRef(false);

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * 0.052 + offset) % 1;
    const z = THREE.MathUtils.lerp(-18, 18, t);
    const dist = Math.abs(z - pitPosition.z);
    const pitBlend = Math.max(0, 1 - dist / 2.95);
    const x = THREE.MathUtils.lerp(-1.15, pitPosition.x - 0.8, pitBlend);

    if (carRef.current) {
      carRef.current.position.set(x, 0.02, z);
      carRef.current.rotation.y = pitBlend > 0.22 ? -Math.PI / 2 : 0;
    }

    if (pitBlend > 0.92 && !arrivedRef.current) {
      arrivedRef.current = true;
      onArrive(section);
    }

    if (pitBlend < 0.25) {
      arrivedRef.current = false;
    }
  });

  return (
    <group ref={carRef}>
      <Car type={section.carType} accent={section.accent} scale={0.78} rotation={[0, 0, 0]} />
    </group>
  );
}

function PlayerCar({ pitStops, onSelect, carRef }) {
  const keys = useRef({});
  const lastSelected = useRef(null);

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

    const speed = 5.9;
    let dx = 0;
    let dz = 0;

    if (keys.current["w"] || keys.current["arrowup"]) dz -= 1;
    if (keys.current["s"] || keys.current["arrowdown"]) dz += 1;
    if (keys.current["a"] || keys.current["arrowleft"]) dx -= 1;
    if (keys.current["d"] || keys.current["arrowright"]) dx += 1;

    if (dx !== 0 || dz !== 0) {
      const length = Math.hypot(dx, dz);
      dx /= length;
      dz /= length;

      car.position.x = THREE.MathUtils.clamp(car.position.x + dx * speed * delta, -3.4, 7.0);
      car.position.z = THREE.MathUtils.clamp(car.position.z + dz * speed * delta, -17.2, 17.2);
      car.rotation.y = Math.atan2(dx, dz);
    }

    for (const item of pitStops) {
      const dist = Math.hypot(car.position.x - item.position.x, car.position.z - item.position.z);
      if (dist < 1.95 && lastSelected.current !== item.section.id) {
        lastSelected.current = item.section.id;
        onSelect(item.section);
      }
    }
  });

  return (
    <group ref={carRef} position={[-1.15, 0.02, 15]}>
      <Car type="police" accent="#f8fafc" scale={0.88} />
      <Html position={[0, 1.6, 0]} transform distanceFactor={9}>
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

    desired.set(target.position.x + 8.8, 7.4, target.position.z + 9.6);
    camera.position.lerp(desired, 0.055);

    lookAt.set(target.position.x + 1.25, 0.6, target.position.z);
    camera.lookAt(lookAt);
  });

  return null;
}

function Scene({ activeId, onSelect }) {
  const playerRef = useRef();

  const pitStops = CV_SECTIONS.map((section, index) => ({
    section,
    position: PIT_POSITIONS[index],
  }));

  return (
    <>
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 16, 50]} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[9, 12, 8]} intensity={2.6} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[6, 3.5, -12]} intensity={3} color="#38bdf8" />
      <pointLight position={[6, 3.5, 0]} intensity={2.4} color="#a78bfa" />
      <pointLight position={[6, 3.5, 12]} intensity={2.4} color="#f97316" />

      <Environment preset="city" />
      <Stars radius={75} depth={50} count={2000} factor={3.2} fade speed={0.35} />

      <Road />
      <GarageBackWall />

      {pitStops.map((item) => (
        <PitStop
          key={item.section.id}
          section={item.section}
          position={item.position}
          isActive={activeId === item.section.id}
          onSelect={onSelect}
        />
      ))}

      {pitStops.map((item, index) => (
        <AutoPitCar
          key={`auto-${item.section.id}`}
          section={item.section}
          pitPosition={item.position}
          offset={index * 0.18}
          onArrive={onSelect}
        />
      ))}

      <PlayerCar pitStops={pitStops} onSelect={onSelect} carRef={playerRef} />
      <CameraRig targetRef={playerRef} />

      <ContactShadows opacity={0.5} scale={30} blur={2.8} far={12} position={[0, 0.02, 0]} />
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
    </>
  );
}

function CvPanel({ activeSection, onSelect }) {
  return (
    <aside className="cv-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Daniel Zabarsky</p>
          <h1>3D Pit Lane CV</h1>
        </div>
        <span className="status">LIVE</span>
      </div>

      <div className="active-card" style={{ "--accent": activeSection.accent }}>
        <p className="pit-name">{activeSection.pit}</p>
        <h2>{activeSection.title}</h2>
        <p className="period">{activeSection.period}</p>

        <ul>
          {activeSection.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>

      <div className="section-buttons">
        {CV_SECTIONS.map((section) => (
          <button
            key={section.id}
            className={section.id === activeSection.id ? "selected" : ""}
            onClick={() => onSelect(section)}
            style={{ "--accent": section.accent }}
          >
            <span>{section.pit}</span>
            {section.label}
          </button>
        ))}
      </div>

      <div className="contact-box">
        <a href="mailto:danielzabarskyy@gmail.com">danielzabarskyy@gmail.com</a>
        <span>053-3372999</span>
        <span>Bror hail</span>
      </div>
    </aside>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState(CV_SECTIONS[0]);
  const [isIntroOpen, setIsIntroOpen] = useState(true);

  return (
    <main className="app">
      <Canvas shadows camera={{ position: [8, 7, 12], fov: 48 }}>
        <Suspense fallback={null}>
          <Scene activeId={activeSection.id} onSelect={setActiveSection} />
        </Suspense>
      </Canvas>

      <CvPanel activeSection={activeSection} onSelect={setActiveSection} />

      <div className="hud">
        <strong>Drive:</strong> WASD / Arrow keys
        <span>Enter a pit or click a pit label to reveal a CV section.</span>
      </div>

      {isIntroOpen && (
        <div className="intro">
          <div className="intro-card">
            <p className="eyebrow">Interactive CV concept</p>
            <h2>Drive into the pits to reveal Daniel’s CV.</h2>
            <p>
              Use the police car to move around the pit lane. Each pit stop opens a different CV section.
              Animated FBX cars will also enter the pits automatically.
            </p>
            <button onClick={() => setIsIntroOpen(false)}>Start driving</button>
          </div>
        </div>
      )}
    </main>
  );
}
