import * as THREE from 'three';

const vertexShader = /* glsl */`
  varying vec3 vViewPos;
  varying vec3 vPos;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mvPosition.xyz;
    vPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Flat normal via derivatives
const fragmentShader = /* glsl */`
  precision highp float;
  varying vec3 vViewPos;
  varying vec3 vPos;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform vec3 uLightDir;

  vec3 flatNormal(vec3 pos) {
    vec3 fdx = dFdx(pos);
    vec3 fdy = dFdy(pos);
    return normalize(cross(fdx, fdy));
  }

  void main() {
    vec3 N = flatNormal(vPos);
    float NdotL = max(dot(N, normalize(uLightDir)), 0.0);
    float ambient = 0.2;
    float diff = NdotL * 0.8;
    vec3 base = uColor;
    // simple height-based accenting
    float accentMix = smoothstep(2.0, 8.0, vPos.y);
    vec3 color = mix(base, uAccent, accentMix);
    vec3 finalColor = (ambient + diff) * color;
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export function createFlatShadedMaterial(params?: { color?: THREE.ColorRepresentation; accent?: THREE.ColorRepresentation; lightDir?: THREE.Vector3 }) {
  const uniforms = {
    uColor: { value: new THREE.Color(params?.color ?? '#1a1a2e') },
    uAccent: { value: new THREE.Color(params?.accent ?? '#e94560') },
    uLightDir: { value: params?.lightDir ?? new THREE.Vector3(0.4, 1, 0.2).normalize() }
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    derivatives: true,
  });
  return mat;
}