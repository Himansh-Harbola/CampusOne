// ═══════════════════════════════════════════════════════════════
// faceRecognition.js — face-api.js wrapper
//
// Loads models once, exposes:
//   loadModels()           → load face-api models from CDN
//   detectDescriptor(video) → Float32Array[128] or null
//   matchDescriptor(live, saved) → boolean
// ═══════════════════════════════════════════════════════════════

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

let modelsLoaded = false

export async function loadModels() {
  if (modelsLoaded) return
  const faceapi = await getFaceApi()
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ])
  modelsLoaded = true
}

// Dynamically import face-api.js from CDN
async function getFaceApi() {
  if (window.faceapi) return window.faceapi
  await loadScript('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js')
  return window.faceapi
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

// Detect a single face in a video element and return its 128-number descriptor
// Returns Float32Array or null if no face found
export async function detectDescriptor(videoEl) {
  const faceapi = await getFaceApi()
  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor()
  if (!detection) return null
  return detection.descriptor // Float32Array[128]
}

// Compare live descriptor against stored descriptor
// Euclidean distance < 0.5 = same person (industry standard threshold)
export function matchDescriptor(liveDescriptor, savedDescriptor) {
  const faceapi = window.faceapi
  if (!faceapi) return false
  const saved = new Float32Array(savedDescriptor)
  const distance = faceapi.euclideanDistance(liveDescriptor, saved)
  return distance < 0.5
}

// Start webcam stream on a video element
export async function startCamera(videoEl) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 320, height: 240, facingMode: 'user' },
    audio: false,
  })
  videoEl.srcObject = stream
  await new Promise((res) => { videoEl.onloadedmetadata = res })
  await videoEl.play()
  return stream
}

// Stop all tracks on a stream
export function stopCamera(stream) {
  if (!stream) return
  stream.getTracks().forEach(t => t.stop())
}
