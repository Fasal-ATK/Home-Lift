import React from 'react'
import { Link,Outlet } from 'react-router-dom'

function Home() {
  return (
    <div>
      <h1> This is Home </h1>
      <br />
      <Link to='profile'>profile</Link>
    <Outlet />
    </div>
  )
}

export default Home