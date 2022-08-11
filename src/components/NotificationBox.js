
/*

to do a notification, from pretty much any component:

dispatch( dataSlice.action.notify({
  msg: "Hello!",
  duration: 3000,
  intent: "inform",
}) 

//parameters: msg, duration, intent

//intent should be "danger", "warn", "inform" or "success"

//duration should be an integer, in milliseconds. This makes
//the duration entirely customizable, as there may be wildly varying needs

*/

import { useEffect } from 'react'
import {useDispatch} from 'react-redux'
import dataSlice from "../reducers/dataSlice"
import GenericButton from "./GenericButton.js"
import { useRef } from "react"



function NotificationBox(props) {

  const dispatch = useDispatch()

  const refBox = useRef(null)

  function selfClose() {
    dispatch( dataSlice.action.destroyNotificationBox(
      {
        id: props.id,
      }))
  }

  useEffect(() => {
    //Runs only the first time (on mount basically). The empty array
    //is intentional and does exactly this (force useEffect
    //to run only once). This is common React knowledge,
    //but I am documenting it here, because some linters like to complain
    //about it. Ignore the linters. This is how it's supposed to be. 

    setTimeout(selfClose, props.duration)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  

  return (
    <div className="transition-opacity" ref={refBox} style={{
      padding: "12px",
      background: "#037da5",
      borderRadius: "8px",
      boxShadow: "2px 2px 5px 5px rgba(0,0,0, 0.45)",
      margin: "6px",

      userSelect: "none",
      pointerEvents: "auto",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }}
    >



      <div
        style={{
          fontSize: "14px",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          marginRight: "16px",
        }}
      >
        {props.msg}
      </div>
      
      <div style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "14px",
      }}>
        <GenericButton
          text="OK"
          title="close"
          icon=""
          onClick={selfClose}
          width="48px"
        >close</GenericButton>
      </div>

    </div>
  )
}

export default NotificationBox
