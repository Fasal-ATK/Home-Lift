import './App.css'

import { BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import Profile from './pages/Profile'
import About from './pages/About'
import Signup from './pages/Signup'


function App() {  
  return (
  <>

  <Routes>

    <Route path='/' element={ <Home/> } />
    <Route path='/login' element={ <Login/> } />
    <Route path='/signup' element={ <Signup/> } />
    <Route path='/profile' element={ <Profile/> } />
    <Route path='/about' element={ <About/> } />

  </Routes>

  </>
  )
}

export default App
