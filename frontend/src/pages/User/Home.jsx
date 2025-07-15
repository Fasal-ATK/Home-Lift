import React from 'react'
import { Link} from 'react-router-dom'

function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1> This is Home </h1>
      <br />
      <Link to='/profile'>profile</Link>
      <br /><br />
      <Link to='/login'>Login</Link>
      <br /><br />
      <Link to='/signup'>signup</Link>
    </div>
  )
}

export default Home