import { createSignal } from 'solid-js'
import './App.css'
import Recognize from './Recognize.jsx'




function App() {
  const [count, setCount] = createSignal(0)
  
  

  return (
    <>
      <div>
       <Recognize />
       </div>
    </>
  )
}

export default App
