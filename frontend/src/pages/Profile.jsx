import React from 'react'
import { Link,Outlet } from 'react-router-dom'

function Profile() {
  return (
    <div>
      <h1>this is Prfile</h1>
      <br />
      <Link to='About'> About </Link>
      <Outlet/>
    </div>
  )
}

export default Profile