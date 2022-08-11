
import {useDispatch} from 'react-redux'

import dataSlice from "../reducers/dataSlice"

import { useSelector } from 'react-redux'

import { useEffect } from 'react'

import { useRef } from "react"

function GenericInput(props) {
  /* 
    A generic widget that is
    linked to a property in the global Redux store
    and lets the user choose between true and false (on and off), only.

    The initial value is determined by the corresponding value in the Redux store. 

    props:
      propList = An array containing strings, where each string
        is a property accessor. The strings access a nested structure of (the
          global Redux store) state, so ["images"] ["key"] ["data"] would access:
          state.images.key.data
          The accessed property is automatically synced to the value of the input.
      width: integer: width of input in pixels

      optionOn: string for true

      optionOff: string for false
  */

  let inpRef = useRef(null)

  const state = useSelector(state => state.main)
  
  useEffect(() => {
    let el = state
    for (let item of props.propList) {
      if (!el) throw new Error(`Illegal property access.`)
      el = el[item]
    }
    console.log()
    let val = "false"
    if (el) val = "true"
    inpRef.current.value = String(val)
  }, [])


  const dispatch = useDispatch()

  function update(event) {
    let val = event.target.value
    if (val === "true") {
      val = true
    } else {
      val = false
    }
    dispatch( dataSlice.action.genericStateChange(
      {
        propList: props.propList,
        value: val,
      })
    )

  }

  let width = props.width || 160

  return (
    <>
      <div className="p-2">
        <div className="mb-1">
          <p className="mr-2" style={{display: "inline-block"}}>{props.label}</p>
          <select style={{width: width, height: "24px"}} ref={inpRef} onChange={update}>
            <option value={true}>{props.optionOn}</option>
            <option value={false}>{props.optionOff}</option>
          </select>
        </div>
        <div className="text-gray-500">
          {props.subLabel}
        </div>
      </div>
    </>
  )
}



export default GenericInput