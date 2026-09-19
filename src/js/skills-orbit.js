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
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.z = 9.5;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.orbitGroup = new THREE.Group();
    this.scene.add(this.orbitGroup);

    const coreGeo = new THREE.SphereGeometry(0.65, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.85,
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.orbitGroup.add(this.core);

    const glowGeo = new THREE.SphereGeometry(0.9, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.15,
      wireframe: true,
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.orbitGroup.add(this.glow);

    this.nodes = [];
    const baseRadius = 3.6;
    this.labels.forEach((label, i) => {
      const ring = i % 3;
      const angle = (i / 4) * Math.PI * 2 + ring * 0.52;
      const y = (ring - 1) * 1.35 + Math.sin(i * 1.5) * 0.3;
      const radius = baseRadius + ring * 0.45;

      const group = new THREE.Group();

      const dotGeo = new THREE.SphereGeometry(0.09, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00d4ff : 0x8b5cf6,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      group.add(dot);

      const sprite = this._createLabelSprite(label);
      sprite.position.set(0, 0.32, 0);
      sprite.scale.set(1.4, 0.35, 1);
      group.add(sprite);

      group.userData = {
        angle,
        radius,
        y,
        speed: 0.16 + (i % 3) * 0.04,
      };

      this.orbitGroup.add(group);
      this.nodes.push(group);
    });

    this._buildConnections();
    this.clock = new THREE.Clock();

    this.targetRotationY = 0;
    this.targetRotationX = 0;
    this.currentRotationY = 0;
    this.currentRotationX = 0;

    let isPointerDown = false;
    let previousPointerX = 0;
    let previousPointerY = 0;

    this._onPointerDown = (e) => {
      isPointerDown = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      previousPointerX = clientX;
      previousPointerY = clientY;
    };

    this._onPointerMove = (e) => {
      if (!isPointerDown) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - previousPointerX;
      const deltaY = clientY - previousPointerY;

      this.targetRotationY += deltaX * 0.005;
      this.targetRotationX += deltaY * 0.005;

      this.targetRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.targetRotationX));

      previousPointerX = clientX;
      previousPointerY = clientY;
    };

    this._onPointerUp = () => {
      isPointerDown = false;
    };

    const dragTarget = this.canvas.parentElement;
    if (dragTarget) {
      dragTarget.addEventListener('mousedown', this._onPointerDown);
      dragTarget.addEventListener('mousemove', this._onPointerMove);
      dragTarget.addEventListener('touchstart', this._onPointerDown, { passive: true });
      dragTarget.addEventListener('touchmove', this._onPointerMove, { passive: true });
    }
    window.addEventListener('mouseup', this._onPointerUp);
    window.addEventListener('touchend', this._onPointerUp);

    this._resize();
    this._resizeHandler = () => this._resize();
    window.addEventListener('resize', this._resizeHandler);
  }

  setActive(active) {
    this.isActive = active;
    if (active) {
      this._resize();
    }
  }

  _createLabelSprite(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 384;
    canvas.height = 96;

    ctx.clearRect(0, 0, 384, 96);

    const r = 16;
    ctx.fillStyle = 'rgba(10, 14, 26, 0.70)';
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(r, 6);
    ctx.lineTo(384 - r, 6);
    ctx.quadraticCurveTo(384 - 6, 6, 384 - 6, r);
    ctx.lineTo(384 - 6, 96 - r);
    ctx.quadraticCurveTo(384 - 6, 96 - 6, 384 - r, 96 - 6);
    ctx.lineTo(r, 96 - 6);
    ctx.quadraticCurveTo(6, 96 - 6, 6, 96 - r);
    ctx.lineTo(6, r);
    ctx.quadraticCurveTo(6, 6, r, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 30px Orbitron, sans-serif';
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = 'rgba(0, 212, 255, 0.7)';
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 192, 48);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
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
      opacity: 0.22,
    });
    this.connectionLines = new THREE.LineSegments(geo, mat);
    this.orbitGroup.add(this.connectionLines);
    this.linePositions = positions;
  }

  _resize() {
    const parent = this.canvas.parentElement;
    const w = (parent && parent.clientWidth > 0) ? parent.clientWidth : window.innerWidth;
    const h = w;

    this.camera.aspect = 1;

    if (w < 480) {
      this.camera.position.z = 10.2;
    } else if (w < 768) {
      this.camera.position.z = 9.8;
    } else {
      this.camera.position.z = 9.5;
    }

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, true);
  }

  render() {
    if (!this.isActive) return;

    if (this.canvas.clientWidth === 0 || this.canvas.clientHeight === 0) {
      this._resize();
    }

    const t = this.clock.getElapsedTime();
    this.core.rotation.y = t * 0.2;
    this.glow.rotation.x = t * 0.15;
    this.glow.rotation.z = t * 0.1;

    this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.05;
    this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.05;

    this.orbitGroup.rotation.y = this.currentRotationY + t * 0.08;
    this.orbitGroup.rotation.x = this.currentRotationX;

    const linePos = this.linePositions;
    let offset = 0;
    this.nodePositions = [];

    const w = window.innerWidth;
    const scaleFactor = w < 480 ? 0.8 : (w < 768 ? 0.9 : 1.0);
    const radiusMultiplier = w < 480 ? 0.75 : (w < 768 ? 0.85 : 1.0);

    this.core.scale.setScalar(scaleFactor);
    this.glow.scale.setScalar(scaleFactor);

    this.nodes.forEach((group, i) => {
      const { angle, radius, y, speed } = group.userData;

      const currentRadius = radius * radiusMultiplier;
      const currentY = y * radiusMultiplier;

      const a = angle + t * speed;
      const x = Math.cos(a) * currentRadius;
      const z = Math.sin(a) * currentRadius;
      const py = currentY + Math.sin(t * 1.5 + i) * 0.18 * scaleFactor;
      group.position.set(x, py, z);

      const dot = group.children[0];
      const sprite = group.children[1];

      if (dot) {
        dot.scale.setScalar(scaleFactor);
      }
      if (sprite) {
        sprite.scale.set(1.1 * scaleFactor, 0.275 * scaleFactor, 1);
      }

      this.nodePositions.push({ x, y: py, z });

      const nextNode = this.nodes[(i + 1) % this.nodes.length];
      const nd = nextNode.userData;

      const nextRadius = nd.radius * radiusMultiplier;
      const nextY = nd.y * radiusMultiplier;

      const na = nd.angle + t * nd.speed;
      const nx = Math.cos(na) * nextRadius;
      const ny = nextY + Math.sin(t * 1.5 + i + 1) * 0.2 * scaleFactor;
      const nz = Math.sin(na) * nextRadius;

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
    const dragTarget = this.canvas.parentElement;
    if (dragTarget) {
      dragTarget.removeEventListener('mousedown', this._onPointerDown);
      dragTarget.removeEventListener('mousemove', this._onPointerMove);
      dragTarget.removeEventListener('touchstart', this._onPointerDown);
      dragTarget.removeEventListener('touchmove', this._onPointerMove);
    }
    window.removeEventListener('mouseup', this._onPointerUp);
    window.removeEventListener('touchend', this._onPointerUp);
    window.removeEventListener('resize', this._resizeHandler);
    this.renderer.dispose();
  }
}
