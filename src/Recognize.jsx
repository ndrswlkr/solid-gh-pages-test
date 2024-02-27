import { createWorker } from 'tesseract.js'
import testImage  from './assets/eng_bw.png'
import { createSignal, onMount } from 'solid-js'

let worker
let canvas
const [ret, setRet] = createSignal(' ')

async function readNow() {
    let image = new Image();
  image.src = canvas.toDataURL();
  const worker = await createWorker('eng')
  const r = await worker.recognize(image)
  setRet( r.data.text )
}

function Recognize() {
    onMount( async () =>{
        let ctx = canvas.getContext('2d')
        let base_image = new Image();
        base_image.src = testImage;
        base_image.onload = function(){
          ctx.drawImage(base_image, 0, 0);
        }

        worker = await createWorker('eng')
        const r = await worker.recognize(testImage)
        setRet( r.data.text )
        console.log(r)

   
})
    return (
        <div>
            <h2>Recognize</h2>
            <p>{ret()}</p>
            <canvas ref={canvas} width='360' height='360' />
            <button onclick={ ()=>readNow()}>read now</button>
        </div>
    );
}
    export default Recognize;