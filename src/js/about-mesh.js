import * as THREE from 'three';

export class AboutMesh {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.z = 4;
    this.isActive = true;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(1.2, 2);
    const wire = new THREE.WireframeGeometry(geometry);
    this.mesh = new THREE.LineSegments(
      wire,
      new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.55,
      })
    );
    this.scene.add(this.mesh);

    const innerGeo = new THREE.IcosahedronGeometry(0.85, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    this.inner = new THREE.Mesh(innerGeo, innerMat);
    this.scene.add(this.inner);

    this.clock = new THREE.Clock();
    this._resize = () => this.resize();
    window.addEventListener('resize', this._resize);
    this.resize();
  }

  resize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  setActive(active) {
    this.isActive = active;
  }

  render() {
    if (!this.isActive) return;
    const t = this.clock.getElapsedTime();
    this.mesh.rotation.x = t * 0.25;
    this.mesh.rotation.y = t * 0.4;
    this.inner.rotation.x = -t * 0.15;
    this.inner.rotation.y = t * 0.2;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this._resize);
    this.renderer.dispose();
  }
}
