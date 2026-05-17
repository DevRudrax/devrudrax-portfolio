import * as THREE from 'three';
import vertexShader from '../shaders/neural.vert?raw';
import fragmentShader from '../shaders/neural.frag?raw';

const CONNECTION_DISTANCE = 1.8;
const PARTICLE_COUNT_DESKTOP = 320;
const PARTICLE_COUNT_MOBILE = 90;

export class NeuralScene {
  constructor(canvas, { reduced = false } = {}) {
    this.canvas = canvas;
    this.reduced = reduced;
    this.mouse = new THREE.Vector2(0, 0);
    this.scrollProgress = 0;
    this.targetScroll = 0;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a0f, 0.032);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    this.camera.position.set(0, 0, 12);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !reduced,
      alpha: true,
      powerPreference: reduced ? 'low-power' : 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, reduced ? 1.5 : 2));
    this.renderer.setClearColor(0x0a0a0f, 1);

    this.clock = new THREE.Clock();
    this.orbMeshes = [];

    this._buildParticles();
    this._buildOrbs();
    this._buildLines();
    this._onResize();
    window.addEventListener('resize', () => this._onResize());
    window.addEventListener('mousemove', (e) => this._onMouseMove(e));
  }

  _particleCount() {
    return this.reduced ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
  }

  _buildParticles() {
    const count = this._particleCount();
    const spread = this.reduced ? 14 : 24;
    const positions = new Float32Array(count * 3);
    const normals = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const connections = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = spread * (0.25 + Math.random() * 0.75);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi) - 4;

      normals[i3] = (Math.random() - 0.5) * 0.12;
      normals[i3 + 1] = (Math.random() - 0.5) * 0.12;
      normals[i3 + 2] = (Math.random() - 0.5) * 0.12;

      sizes[i] = 2 + Math.random() * 5;
      connections[i] = Math.random();
    }

    this.particlePositions = positions;
    this.particleCount = count;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aConnection', new THREE.BufferAttribute(connections, 1));

    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
      },
    });

    this.particles = new THREE.Points(geometry, this.particleMaterial);
    this.scene.add(this.particles);
  }

  _buildLines() {
    const count = this.particleCount;
    const maxLines = this.reduced ? 400 : 1400;
    const linePositions = [];
    const pos = this.particlePositions;

    for (let i = 0; i < count && linePositions.length / 6 < maxLines; i++) {
      for (let j = i + 1; j < count && linePositions.length / 6 < maxLines; j++) {
        const i3 = i * 3;
        const j3 = j * 3;
        const dx = pos[i3] - pos[j3];
        const dy = pos[i3 + 1] - pos[j3 + 1];
        const dz = pos[i3 + 2] - pos[j3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONNECTION_DISTANCE) {
          linePositions.push(pos[i3], pos[i3 + 1], pos[i3 + 2]);
          linePositions.push(pos[j3], pos[j3 + 1], pos[j3 + 2]);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePositions, 3)
    );

    const material = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
    });

    this.lines = new THREE.LineSegments(geometry, material);
    this.scene.add(this.lines);
  }

  _buildOrbs() {
    const orbCount = this.reduced ? 2 : 6;
    const geo = new THREE.IcosahedronGeometry(0.35, 0);

    for (let i = 0; i < orbCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00d4ff : 0x8b5cf6,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const angle = (i / orbCount) * Math.PI * 2;
      mesh.position.set(
        Math.cos(angle) * (4 + i * 0.5),
        Math.sin(angle * 1.3) * 2.2,
        -6 - i * 1.2
      );
      mesh.userData.base = mesh.position.clone();
      mesh.userData.phase = Math.random() * Math.PI * 2;
      this.scene.add(mesh);
      this.orbMeshes.push(mesh);
    }
  }

  _onMouseMove(e) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
    }
  }

  setScrollProgress(progress) {
    this.targetScroll = progress;
  }

  updateCameraFromScroll(sectionProgress) {
    this.scrollProgress += (this.targetScroll - this.scrollProgress) * 0.06;
    const t = THREE.MathUtils.lerp(sectionProgress, this.scrollProgress, 0.35);

    const pathX = THREE.MathUtils.lerp(0, -2.2, t);
    const pathY = THREE.MathUtils.lerp(0, 1.4, t);
    const pathZ = THREE.MathUtils.lerp(12, 7, t);

    this.camera.position.x = pathX + this.mouse.x * 0.5;
    this.camera.position.y = pathY + this.mouse.y * 0.35;
    this.camera.position.z = pathZ;
    this.camera.lookAt(0, t * 0.35, -4 - t * 1.5);

    const lineOpacity = 0.06 + t * 0.06;
    if (this.lines?.material) {
      this.lines.material.opacity = lineOpacity;
    }
  }

  render() {
    const elapsed = this.clock.getElapsedTime();
    this.particleMaterial.uniforms.uTime.value = elapsed;

    const scrollSpin = this.scrollProgress * 0.15;
    this.particles.rotation.y = elapsed * 0.02 + this.mouse.x * 0.06 + scrollSpin;
    this.particles.rotation.x = this.mouse.y * 0.06;
    this.lines.rotation.copy(this.particles.rotation);

    this.orbMeshes.forEach((mesh, i) => {
      const base = mesh.userData.base;
      const phase = mesh.userData.phase;
      mesh.position.x = base.x + Math.sin(elapsed * 0.5 + phase) * 0.5;
      mesh.position.y = base.y + Math.cos(elapsed * 0.4 + phase) * 0.35;
      mesh.rotation.x = elapsed * 0.3;
      mesh.rotation.y = elapsed * 0.5 + i;
      mesh.scale.setScalar(1 + Math.sin(elapsed + i) * 0.08);
    });

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', () => this._onResize());
    this.renderer.dispose();
    this.particleMaterial.dispose();
    this.particles.geometry.dispose();
    this.lines.geometry.dispose();
    this.lines.material.dispose();
  }
}
