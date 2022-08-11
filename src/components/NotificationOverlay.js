
/*

This is where alerts, popups and notifications live.

to do a notification, from pretty much any component,
see NotificationBox.js for docs.


*/

import { useEffect } from 'react'

import { useSelector } from 'react-redux'

import NotificationBox from './NotificationBox.js'

function NotificationOverlay() {
  
  const state = useSelector(state => state.main)



  let nots = null

  nots = state.notifications.map((n) => {
    console.log("NOTIFICATION", n)
    return (
      <NotificationBox
        key={n.id}
        msg={n.msg}
        id={n.id}
        duration={n.duration}
        intent={n.intent}
      >
      </NotificationBox>
    )
  })

  return (
    <>
      <div style={{
        zIndex: 900_000_000,
        position: "absolute",
        left: "0px",
        top: "0vh",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "rgba(0,0,0,0)",
        pointerEvents: "none",
      }}>

        <div style={{
            position: "absolute",
            top: "0px",
            right: "0px",
            display: "flex",
            flexDirection: "column",
          }}>
          
          {nots}

        </div>

      </div>
    </>
  )

}

export default NotificationOverlay
