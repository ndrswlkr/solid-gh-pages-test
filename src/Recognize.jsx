import { createWorker } from 'tesseract.js'
import testImage from './assets/eng_bw.png'
import { For, createEffect, createSignal, onMount } from 'solid-js'
//use camera2 0 //last one
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
const [start, setStart] = createSignal(false)
const [selectedDevice, setSelectedDevice] = createSignal(null)

/*MediaStreamTrack.getSources(function(sourceInfos) {
    var audioSource = [];
    var videoSource = [];

    for (var i = 0; i != sourceInfos.length; ++i) {
    var sourceInfo = sourceInfos[i];
    if (sourceInfo.kind === 'audio') {
        console.log(sourceInfo.id, sourceInfo.label || 'microphone');
        audioSource.push(sourceInfo.id)
    } else if (sourceInfo.kind === 'video') {
        console.log(sourceInfo.id, sourceInfo.label || 'camera');

        videoSource.push(sourceInfo.id);
    } else {
        console.log('Some other kind of source: ', sourceInfo);
    }
    }

    sourceSelected(audioSource, videoSource);
});

function sourceSelected(audioSource, videoSource) {
    var constraints = {
    audio: {
        optional: [{sourceId: audioSource}]
    },
    video: {
        optional: [{sourceId: videoSource}]
    }
    };

    navigator.getUserMedia(constraints, successCallback, errorCallback);
}
*/
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
    videoPreview,
    videoPreview.width * 0.222,
    videoPreview.height * 0.333,
    videoPreview.width * 0.555,
    videoPreview.height * 0.333,
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

function thresholdFilter (canvas) {
  let context = canvas.getContext('2d')
  let imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  let pixels = imageData.data
  let level = 0.5
  if (level === undefined) {
    level = 0.5
  }
  const thresh = Math.floor(level * 255)
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
    let val
    if (gray >= thresh) {
      val = 255
    } else {
      val = 0
    }
    pixels[i] = pixels[i + 1] = pixels[i + 2] = val
  }
  context.putImageData(imageData, 0, 0)
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
  thresholdFilter(videoPreview)
  context.rect(width * 0.222, height * 0.333, width * 0.555, height * 0.333)
  context.lineWidth = 6
  context.strokeStyle = 'lightgray'
  context.stroke()
}

const getVideo = () => {
  console.log("GET VIDEO",  selectedDevice())
  navigator.mediaDevices
    .getUserMedia({ video: { deviceId: selectedDevice() }, audio: false })
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
  const [deviceList, setDeviceList] = createSignal([{label: "none", id: null}])
  onMount(async () => {
    let stream = null

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(s => {
        stream = s
        navigator.mediaDevices.enumerateDevices().then(devices => {
          devices.forEach(device => {
            console.log('device.label :', device.label)
            console.table(device)
            if (device.kind == 'videoinput')
              setDeviceList([...deviceList(), {label: device.label, id: device.deviceId}])
          })
        })
      })
      .catch(error => {
        console.log('Error :', error)
      })
    await setUp()
    //getVideo()
  })

  createEffect( () => {
    if ( start() ){
      console.log("running")
    }
    else {
      console.log("stopping")
      
    }
  })

  createEffect( ()=>{
    if( selectedDevice()){
      getVideo()
    }
  })

  return (
    <div>
      <h2>Recognize text</h2>
      <h4>devices</h4>
        <select onchange={(ev)=>setSelectedDevice( ev.target.value)}>
      <For each={deviceList()}>{d => <option value={d.id}>

        {d.label}
        </option>}
        </For>
        </select>
        <button onclick={()=>setStart(!start())}>{start() ? "stop" : " start"}</button>
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
