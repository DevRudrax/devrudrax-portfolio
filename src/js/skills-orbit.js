import * as THREE from 'three';

const SKILLS = [
  'Python', 'Rust', 'C', 'React', 'Next.js', 'HTML5',
  'Node.js', 'MongoDB', 'MySQL', 'AWS', 'Firebase', 'Oracle',
];

export class SkillsOrbit {
  constructor(canvas) {
    this.canvas = canvas;
    this.labels = SKILLS;
    this.isActive = true;
    this.nodePositions = [];

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.z = 8;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const coreGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.9,
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.scene.add(this.core);

    const glowGeo = new THREE.SphereGeometry(0.78, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.1,
      wireframe: true,
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.scene.add(this.glow);

    this.nodes = [];
    const orbitRadius = 3.2;
    this.labels.forEach((label, i) => {
      const angle = (i / this.labels.length) * Math.PI * 2;
      const y = Math.sin(i * 1.7) * 1.2;
      const group = new THREE.Group();

      const dotGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00d4ff : 0x8b5cf6,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      group.add(dot);

      const sprite = this._createLabelSprite(label);
      sprite.position.set(0, 0.28, 0);
      sprite.scale.set(1.8, 0.45, 1);
      group.add(sprite);

      group.userData = {
        angle,
        radius: orbitRadius + (i % 3) * 0.35,
        y,
        speed: 0.28 + (i % 5) * 0.05,
      };

      this.scene.add(group);
      this.nodes.push(group);
    });

    this._buildConnections();
    this.clock = new THREE.Clock();
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  setActive(active) {
    this.isActive = active;
  }

  _createLabelSprite(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    ctx.fillStyle = 'rgba(10, 10, 15, 0.65)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.font = 'bold 26px Orbitron, sans-serif';
    ctx.fillStyle = '#00d4ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    return new THREE.Sprite(material);
  }

  _buildConnections() {
    const segmentCount = this.nodes.length * 2;
    const positions = new Float32Array(segmentCount * 6);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.18,
    });
    this.connectionLines = new THREE.LineSegments(geo, mat);
    this.scene.add(this.connectionLines);
    this.linePositions = positions;
  }

  _resize() {
    const parent = this.canvas.parentElement;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  render() {
    const t = this.clock.getElapsedTime();
    this.core.rotation.y = t * 0.2;
    this.glow.rotation.x = t * 0.15;
    this.glow.rotation.z = t * 0.1;

    const linePos = this.linePositions;
    let offset = 0;
    this.nodePositions = [];

    this.nodes.forEach((group, i) => {
      const { angle, radius, y, speed } = group.userData;
      const a = angle + t * speed;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      const py = y + Math.sin(t + i) * 0.15;
      group.position.set(x, py, z);
      group.lookAt(0, py, 0);
      this.nodePositions.push({ x, y: py, z });

      const nextNode = this.nodes[(i + 1) % this.nodes.length];
      const nd = nextNode.userData;
      const na = nd.angle + t * nd.speed;
      const nx = Math.cos(na) * nd.radius;
      const ny = nd.y + Math.sin(t + i + 1) * 0.15;
      const nz = Math.sin(na) * nd.radius;

      linePos[offset++] = x;
      linePos[offset++] = py;
      linePos[offset++] = z;
      linePos[offset++] = nx;
      linePos[offset++] = ny;
      linePos[offset++] = nz;

      linePos[offset++] = x;
      linePos[offset++] = py;
      linePos[offset++] = z;
      linePos[offset++] = 0;
      linePos[offset++] = 0;
      linePos[offset++] = 0;
    });

    this.connectionLines.geometry.attributes.position.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
