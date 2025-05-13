import React from 'react'
import { Link} from 'react-router-dom'

function Home() {
  return (
    <div>
      <h1> This is Home </h1>
      <br />
      <Link to='/profile'>profile</Link>
    </div>
  )
}

export default Home