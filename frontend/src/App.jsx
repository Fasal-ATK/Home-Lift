import { BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from './pages/User/Login'
import Home from './pages/User/Home'
import Profile from './pages/User/Profile'
import About from './pages/User/About'
import Signup from './pages/User/Signup'


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
