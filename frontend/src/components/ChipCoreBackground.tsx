import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface TracePath3D {
  points: [number, number, number][];
  cumLengths: number[];
  totalLength: number;
  isTeal: boolean;
}

interface PacketState {
  traceIdx: number;
  dist: number;
  speed: number;
  dir: 1 | -1;
}

function buildTrace3D(pts: [number, number, number][], isTeal: boolean): TracePath3D {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    const dz = pts[i][2] - pts[i - 1][2];
    cum.push(cum[i - 1] + Math.hypot(dx, dy, dz));
  }
  return {
    points: pts,
    cumLengths: cum,
    totalLength: cum[cum.length - 1] || 1,
    isTeal,
  };
}

function sampleTrace3D(
  trace: TracePath3D,
  d: number,
  outPos: THREE.Vector3,
  outDir: THREE.Vector3,
) {
  const clamped = Math.max(0, Math.min(trace.totalLength, d));
  let idx = 1;
  while (idx < trace.cumLengths.length - 1 && trace.cumLengths[idx] < clamped) {
    idx++;
  }
  const s0 = trace.cumLengths[idx - 1];
  const segLen = trace.cumLengths[idx] - s0 || 1;
  const t = (clamped - s0) / segLen;
  const p0 = trace.points[idx - 1];
  const p1 = trace.points[idx];

  outPos.set(
    p0[0] + (p1[0] - p0[0]) * t,
    p0[1] + (p1[1] - p0[1]) * t,
    p0[2] + (p1[2] - p0[2]) * t,
  );
  outDir.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).normalize();
}

function createDieTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    // Outer die guard ring
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, 476, 476);

    // Silicon logic blocks (4 quadrants)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
    ctx.lineWidth = 2;
    const blocks = [
      [44, 44, 190, 140],
      [278, 44, 190, 140],
      [44, 328, 190, 140],
      [278, 328, 190, 140],
    ];
    for (const [bx, by, bw, bh] of blocks) {
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeRect(bx, by, bw, bh);
      // Internal SRAM cache sub-lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      for (let gx = bx + 16; gx < bx + bw; gx += 22) {
        ctx.beginPath();
        ctx.moveTo(gx, by + 10);
        ctx.lineTo(gx, by + bh - 10);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
    }

    // Pin 1 orientation dot
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(46, 46, 10, 0, Math.PI * 2);
    ctx.fill();

    // Laser-etched typography
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '700 44px "Geist Mono", monospace';
    ctx.fillText('SPARKZ', 256, 234);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 22px "Geist Mono", monospace';
    ctx.fillText('SZ-32X · CORTEX CORE', 256, 278);

    ctx.fillStyle = 'rgba(45, 212, 191, 0.9)';
    ctx.font = '500 16px "Geist Mono", monospace';
    ctx.fillText('240MHz · ATOMIC BUS · REV 4.2', 256, 308);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 2;
  return tex;
}

interface ChipCoreBackgroundProps {
  paused: boolean;
}

/**
 * Eye-Comfortable Slate-Navy & Soft Sky-Cyan Three.js 3D Silicon Stage:
 * - Deep Midnight Slate (#0B111E) canvas eliminates pure-black halation eye strain.
 * - Soft Sky Cyan (#38BDF8), Mint Teal (#2DD4BF), and Cool Indigo (#818CF8) 3D traces & signals.
 * - Uses InstancedMesh for all 56 QFP pins, 96 plated vias, and 44 signal packets (<12 draw calls).
 */
export function ChipCoreBackground({ paused }: ChipCoreBackgroundProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef<boolean>(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const cores = navigator.hardwareConcurrency || 4;
    const isSmallScreen = window.innerWidth < 900;
    const isLowEnd = isSmallScreen || cores <= 4;
    const maxDpr = isLowEnd ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isLowEnd,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(maxDpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0b111e, 1);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b111e, 0.035);

    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      80,
    );

    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // Warm balanced lighting for metallic QFP pins & slate ceramic package
    const ambientLight = new THREE.AmbientLight(0xe2e8f0, 1.05);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.7);
    dirLight.position.set(6, 12, 8);
    scene.add(dirLight);

    const tealLight = new THREE.PointLight(0x2dd4bf, 2.0, 18);
    tealLight.position.set(-5, 4, -4);
    scene.add(tealLight);

    // 1. Sub-Surface PCB Grid Matrix (Soft Slate Blue)
    const gridHelper = new THREE.GridHelper(
      36,
      isLowEnd ? 28 : 44,
      0x38bdf8,
      0x1e293b,
    );
    gridHelper.position.y = -0.35;
    const gridMat = gridHelper.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.28;
    boardGroup.add(gridHelper);

    // 2. Central 3D QFP-56 Microcontroller Package
    const chipGroup = new THREE.Group();
    boardGroup.add(chipGroup);

    const pkgGeo = new THREE.BoxGeometry(3.4, 0.34, 3.4);
    const pkgMat = new THREE.MeshStandardMaterial({
      color: 0x131c2e,
      roughness: 0.35,
      metalness: 0.6,
    });
    const pkgMesh = new THREE.Mesh(pkgGeo, pkgMat);
    pkgMesh.position.y = 0.05;
    chipGroup.add(pkgMesh);

    const pkgEdgesGeo = new THREE.EdgesGeometry(pkgGeo);
    const pkgEdgesMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
    });
    const pkgEdges = new THREE.LineSegments(pkgEdgesGeo, pkgEdgesMat);
    pkgEdges.position.y = 0.05;
    chipGroup.add(pkgEdges);

    const dieTex = createDieTexture();
    const dieGeo = new THREE.PlaneGeometry(3.05, 3.05);
    const dieMat = new THREE.MeshBasicMaterial({ map: dieTex });
    const dieMesh = new THREE.Mesh(dieGeo, dieMat);
    dieMesh.rotation.x = -Math.PI / 2;
    dieMesh.position.y = 0.225;
    chipGroup.add(dieMesh);

    const coreRingGeo = new THREE.RingGeometry(1.95, 2.02, 48);
    const coreRingMat = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const coreRingMesh = new THREE.Mesh(coreRingGeo, coreRingMat);
    coreRingMesh.rotation.x = -Math.PI / 2;
    coreRingMesh.position.y = 0.02;
    chipGroup.add(coreRingMesh);

    const outerRadarGeo = new THREE.RingGeometry(2.35, 2.4, 64, 1, 0, Math.PI * 1.35);
    const outerRadarMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    });
    const outerRadarMesh = new THREE.Mesh(outerRadarGeo, outerRadarMat);
    outerRadarMesh.rotation.x = -Math.PI / 2;
    outerRadarMesh.position.y = 0.03;
    chipGroup.add(outerRadarMesh);

    // 3. InstancedMesh for 56 QFP Gull-Wing Metallic Leads
    const pinsPerSide = 14;
    const totalPins = pinsPerSide * 4;
    const pinGeo = new THREE.BoxGeometry(0.09, 0.08, 0.42);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.85,
      roughness: 0.25,
    });
    const pinInstanced = new THREE.InstancedMesh(pinGeo, pinMat, totalPins);
    const dummy = new THREE.Object3D();
    let pinIdx = 0;
    const pinSpan = 2.7;
    const pinStep = pinSpan / (pinsPerSide - 1);

    for (let side = 0; side < 4; side++) {
      for (let i = 0; i < pinsPerSide; i++) {
        const offset = -pinSpan / 2 + i * pinStep;
        const dist = 1.88;
        if (side === 0) {
          dummy.position.set(offset, -0.02, -dist);
          dummy.rotation.set(0, 0, 0);
        } else if (side === 1) {
          dummy.position.set(dist, -0.02, offset);
          dummy.rotation.set(0, Math.PI / 2, 0);
        } else if (side === 2) {
          dummy.position.set(offset, -0.02, dist);
          dummy.rotation.set(0, 0, 0);
        } else {
          dummy.position.set(-dist, -0.02, offset);
          dummy.rotation.set(0, Math.PI / 2, 0);
        }
        dummy.updateMatrix();
        pinInstanced.setMatrixAt(pinIdx++, dummy.matrix);
      }
    }
    pinInstanced.instanceMatrix.needsUpdate = true;
    chipGroup.add(pinInstanced);

    // 4. 3D Chamfered 45° PCB Copper Bus Traces (Sky Cyan + Mint Teal)
    const traces: TracePath3D[] = [];
    const skyLineVertices: number[] = [];
    const tealLineVertices: number[] = [];
    const viaPositions: [number, number, number][] = [];

    const sides = [
      { nx: 0, nz: -1 },
      { nx: 1, nz: 0 },
      { nx: 0, nz: 1 },
      { nx: -1, nz: 0 },
    ];

    sides.forEach(({ nx, nz }, sIdx) => {
      const tx = -nz;
      const tz = nx;
      const traceCount = isLowEnd ? 8 : 12;
      const span = 2.6;
      const step = span / (traceCount - 1);

      for (let i = 0; i < traceCount; i++) {
        const off = -span / 2 + i * step;
        const sgn = Math.sign(off) || 1;
        const y = -0.08;

        const p0: [number, number, number] = [
          nx * 2.05 + tx * off,
          y,
          nz * 2.05 + tz * off,
        ];
        const lead = 0.6 + (i % 3) * 0.35;
        const p1: [number, number, number] = [
          p0[0] + nx * lead,
          y,
          p0[2] + nz * lead,
        ];
        const fan = Math.abs(off) * 1.45 + 0.7;
        const p2: [number, number, number] = [
          p1[0] + (nx + tx * sgn) * fan,
          y,
          p1[2] + (nz + tz * sgn) * fan,
        ];
        const run1 = 2.4 + ((i * 7 + sIdx * 3) % 5) * 0.9;
        const p3: [number, number, number] = [
          p2[0] + nx * run1,
          y,
          p2[2] + nz * run1,
        ];
        const jog = 0.9 + (i % 3) * 0.65;
        const p4: [number, number, number] = [
          p3[0] + (nx + tx * sgn) * jog,
          y,
          p3[2] + (nz + tz * sgn) * jog,
        ];
        const run2 = 4.5 + (i % 4) * 1.8;
        const p5: [number, number, number] = [
          p4[0] + nx * run2,
          y,
          p4[2] + nz * run2,
        ];

        const pts: [number, number, number][] = [p0, p1, p2, p3, p4, p5];
        const isTeal = (i + sIdx) % 3 === 0;
        traces.push(buildTrace3D(pts, isTeal));
        viaPositions.push(p3, p5);

        const targetArr = isTeal ? tealLineVertices : skyLineVertices;
        for (let k = 0; k < pts.length - 1; k++) {
          targetArr.push(
            pts[k][0],
            pts[k][1],
            pts[k][2],
            pts[k + 1][0],
            pts[k + 1][1],
            pts[k + 1][2],
          );
        }
      }
    });

    const skyTracesGeo = new THREE.BufferGeometry();
    skyTracesGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(skyLineVertices, 3),
    );
    const skyTracesMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.32,
    });
    const skyTracesMesh = new THREE.LineSegments(skyTracesGeo, skyTracesMat);
    boardGroup.add(skyTracesMesh);

    const tealTracesGeo = new THREE.BufferGeometry();
    tealTracesGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(tealLineVertices, 3),
    );
    const tealTracesMat = new THREE.LineBasicMaterial({
      color: 0x2dd4bf,
      transparent: true,
      opacity: 0.32,
    });
    const tealTracesMesh = new THREE.LineSegments(tealTracesGeo, tealTracesMat);
    boardGroup.add(tealTracesMesh);

    // Instanced Plated Via Rings
    const viaGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.04, 12);
    const viaMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
    });
    const viaInstanced = new THREE.InstancedMesh(
      viaGeo,
      viaMat,
      viaPositions.length,
    );
    viaPositions.forEach((vp, idx) => {
      dummy.position.set(vp[0], vp[1], vp[2]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      viaInstanced.setMatrixAt(idx, dummy.matrix);
    });
    viaInstanced.instanceMatrix.needsUpdate = true;
    boardGroup.add(viaInstanced);

    // 5. Instanced 3D Telemetry Signal Packets
    const packetCount = isLowEnd ? 24 : 44;
    const packetGeo = new THREE.BoxGeometry(0.14, 0.07, 0.55);
    const packetMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const packetInstanced = new THREE.InstancedMesh(
      packetGeo,
      packetMat,
      packetCount,
    );
    packetInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const colorSky = new THREE.Color(0x7dd3fc);
    const colorTeal = new THREE.Color(0x5eead4);
    const packets: PacketState[] = [];

    for (let i = 0; i < packetCount; i++) {
      const tIdx = i % traces.length;
      const tr = traces[tIdx];
      packets.push({
        traceIdx: tIdx,
        dist: Math.random() * tr.totalLength,
        speed: 3.0 + Math.random() * 3.8,
        dir: i % 2 === 0 ? 1 : -1,
      });
      packetInstanced.setColorAt(i, tr.isTeal ? colorTeal : colorSky);
    }
    if (packetInstanced.instanceColor) {
      packetInstanced.instanceColor.needsUpdate = true;
    }
    boardGroup.add(packetInstanced);

    // 6. Floating Ambient Silicon Micro-Particles
    const starCount = isLowEnd ? 50 : 100;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 28;
      starPositions[i * 3 + 1] = Math.random() * 6 - 1.5;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 28;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.08,
      transparent: true,
      opacity: 0.45,
    });
    const starField = new THREE.Points(starGeo, starMat);
    boardGroup.add(starField);

    // 7. Zero-Allocation Frame Loop & Scroll-Driven Camera Choreography
    const tmpPos = new THREE.Vector3();
    const tmpDir = new THREE.Vector3();
    const tmpTarget = new THREE.Vector3();
    const pointer = { targetX: 0, targetY: 0, curX: 0, curY: 0 };
    let scrollRatio = 0;
    let rafId = 0;
    let lastTime = performance.now();

    const updateScroll = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      scrollRatio = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    };
    updateScroll();

    const onPointerMove = (e: PointerEvent) => {
      pointer.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      updateScroll();
    };

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!pausedRef.current) {
        pointer.curX += (pointer.targetX - pointer.curX) * 0.06;
        pointer.curY += (pointer.targetY - pointer.curY) * 0.06;

        outerRadarMesh.rotation.z = now * 0.0008;
        coreRingMesh.rotation.z = -now * 0.0005;
        starField.rotation.y = now * 0.00007;

        boardGroup.rotation.y =
          pointer.curX * 0.22 + Math.sin(scrollRatio * Math.PI) * 0.35;
        boardGroup.rotation.x = pointer.curY * 0.12;

        const isDesktop = window.innerWidth >= 1024;
        const heroOffsetX = isDesktop ? 2.6 * (1 - Math.min(1, scrollRatio * 2.5)) : 0;
        boardGroup.position.x += (heroOffsetX - boardGroup.position.x) * 0.08;

        const camX = pointer.curX * 1.1;
        const camY = 6.2 + scrollRatio * 4.5 - pointer.curY * 0.7;
        const camZ = 9.2 - scrollRatio * 3.4;
        camera.position.set(camX, camY, camZ);
        tmpTarget.set(0, -0.3 - scrollRatio * 0.8, 0);
        camera.lookAt(tmpTarget);

        for (let i = 0; i < packetCount; i++) {
          const pkt = packets[i];
          const tr = traces[pkt.traceIdx];
          pkt.dist += pkt.dir * pkt.speed * dt;

          if (pkt.dir === 1 && pkt.dist > tr.totalLength) {
            pkt.dist = 0;
          } else if (pkt.dir === -1 && pkt.dist < 0) {
            pkt.dist = tr.totalLength;
          }

          sampleTrace3D(tr, pkt.dist, tmpPos, tmpDir);
          dummy.position.copy(tmpPos);
          dummy.position.y = -0.04;
          dummy.rotation.set(0, Math.atan2(tmpDir.x, tmpDir.z), 0);
          dummy.updateMatrix();
          packetInstanced.setMatrixAt(i, dummy.matrix);
        }
        packetInstanced.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);

      if (!document.hidden) {
        rafId = window.requestAnimationFrame(animate);
      } else {
        rafId = 0;
      }
    };

    const startLoop = () => {
      if (rafId === 0 && !document.hidden) {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(animate);
      }
    };

    const stopLoop = () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };

    startLoop();

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopLoop();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      dieTex.dispose();
      pkgGeo.dispose();
      pkgMat.dispose();
      pkgEdgesGeo.dispose();
      pkgEdgesMat.dispose();
      dieGeo.dispose();
      dieMat.dispose();
      coreRingGeo.dispose();
      coreRingMat.dispose();
      outerRadarGeo.dispose();
      outerRadarMat.dispose();
      pinGeo.dispose();
      pinMat.dispose();
      skyTracesGeo.dispose();
      skyTracesMat.dispose();
      tealTracesGeo.dispose();
      tealTracesMat.dispose();
      viaGeo.dispose();
      viaMat.dispose();
      packetGeo.dispose();
      packetMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden select-none"
    />
  );
}
