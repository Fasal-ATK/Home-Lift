import React from 'react'
import { Link } from 'react-router-dom'

function Profile() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>this is Profile</h1>
      <br />
      <Link to='/About'> About </Link>
    </div>
  )
}

export default Profile