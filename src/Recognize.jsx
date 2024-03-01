import { createWorker } from 'tesseract.js'
import testImage from './assets/eng_bw.png'
import { createSignal, onMount } from 'solid-js'

let worker
let canvas
let videoPreview
let video
let width = 320
let height = 0
let streaming = false
let photo
let count = 0
let lastTimestamp = 0
const [ret, setRet] = createSignal(' ')
const [confidence, setConfidence] = createSignal(0)
async function step (timestamp) {
  if (timestamp - lastTimestamp > 300) {
    lastTimestamp = timestamp
    console.log('step!!', timestamp)
    drawVideoPreview()
    await analize()

    console.log('drawing')
    count = count + 1
  }
  if (count < 100) window.requestAnimationFrame(step)
}

async function analize () {
  let context = canvas.getContext('2d')
  context.drawImage(
    video,
    video.videoWidth * 0.222,
    video.videoHeight * 0.333,
    video.videoWidth * 0.555,
    video.videoHeight * 0.333,
    0,
    0,
    width,
    height * 0.555
  )
  let image = new Image()
  image.src = canvas.toDataURL('image/png')

  const r = await worker.recognize(image)
  console.log(r)
  setConfidence(r.data.confidence)
  if (r?.data?.confidence > 70) setRet(r.data.text)
}

function drawVideoPreview () {
  console.log('draw preview')
  let context = videoPreview.getContext('2d')
  context.drawImage(
    video,
    0,
    0,
    video.videoWidth,
    video.videoHeight,
    0,
    0,
    width,
    height
  )
  context.rect(width * 0.222, height * 0.333, width * 0.555, height * 0.333)
  context.lineWidth = 6
  context.strokeStyle = 'lightgray'
  context.stroke()
}

const getVideo = () => {
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: 'enviroment' }, audio: false })
    .then(stream => {
      video.srcObject = stream
      video.play()
    })
    .catch(err => {
      console.error(`An error occurred: ${err}`)
    })

  video.addEventListener(
    'canplay',
    ev => {
      if (!streaming) {
        height = (video.videoHeight / video.videoWidth) * width

        video.setAttribute('width', width)
        video.setAttribute('height', height)
        canvas.setAttribute('width', width)
        canvas.setAttribute('height', height * 0.555)
        videoPreview.setAttribute('width', width)
        videoPreview.setAttribute('height', height)
        window.requestAnimationFrame(step)
        streaming = true
      }
    },
    false
  )
}

async function setUp () {
  worker = await createWorker('eng')
}
function Recognize () {
  onMount(async () => {
    await setUp()
    getVideo()
  })

  return (
    <div>
      <h2>Recognize</h2>
      <p>{ret()}</p>
      <p>{confidence()}</p>
      <div class='camera'>
        <video ref={video} hidden='true'>
          Video stream not available.
        </video>
        <button id='startbutton'>Take photo</button>
      </div>
      <canvas ref={videoPreview} id='videoPreview' width='360' height='360' />
      <canvas ref={canvas} id='canvas' width='360' height='360' />
      <button onclick={() => readNow()}>read now</button>
    </div>
  )
}
export default Recognize
