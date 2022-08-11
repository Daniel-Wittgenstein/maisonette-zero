

import ImageSelector from "./ImageSelector.js"



import { useSelector } from 'react-redux'


import {useDispatch} from 'react-redux'
import dataSlice from "../reducers/dataSlice"

import { useEffect } from 'react'


import { useRef } from "react"


function CommandEntryImage(props) {

  const dispatch = useDispatch()

  let state = useSelector(state => state.main)


  if (window.DEBUG.log.props) window.DEBUG.doLogProps(props, "CommandEntryImage")

  function onImageSelectorChange(assetId) {
    dispatch( dataSlice.action.setAssetIdForElement(
      {
        assetId,
        pageId: props.pageId,
        parentId: props.commandBlock.id,
        selfId: props.id,
      })
    )
  }

  let imgId = props.data.assocAssetId

  let imgEl = false
  
  if (state.assets[imgId]) imgEl = state.assets[imgId].data

  let selImage = null

  let openSelector = false

  if (imgEl) {
    selImage = (<img style={{width: "auto", height: "72px", borderRadius: "4px",}} alt="" src={imgEl}></img>)
  } else {
    openSelector = true
  }
  

  function sanitizeCssClassNames(val, lastAdded = false) {
    if (!val) val = "" //yes, needed
    val = val
      .replaceAll('"', "")
      .replaceAll("'", "")
      .replaceAll("`", "")
      .replaceAll(",", " ")
      .trim()
    val = val.split(" ").map(n => n.trim())
      .filter(n => n)
    val = new Set(val)
    //mutually exclusive:
    if (lastAdded === "i-rounded") {
      val.delete("i-circle")
    } else {
      if (val.has("i-circle")) {
        val.delete("i-rounded")
      }
    }
    val = [... val].sort()
    val = val.join(" ")
    return val
  }


  function classInputUpdate(lastAdded = false) {
    let val = classInput.current.value
    //sanitize css class names:
    val = sanitizeCssClassNames(val, lastAdded)
    classInput.current.value = val
    dispatch( dataSlice.action.genericAssignProp(
      {
        assign: {
          access: ["data", "cssClasses"],
          value: val,
        },
        pageId: props.pageId,
        selfId: props.id,
      })
    )
  }

  const classInput = useRef(null)

  function addClass(className) {
    classInput.current.value += (" " + className)
    classInputUpdate(className)
  }

  return (
    <>
      <div style={{

      }} className="flex items-center">
        <div className="mr-3">show image:</div>

        {selImage}

        <ImageSelector
          onChange = {onImageSelectorChange}
          openSelector = {openSelector}
        >
        </ImageSelector>

        CSS classes: <input ref={classInput}
          className="p-1 border-2 border-gray-600 rounded-md mr-2 ml-2"
          defaultValue={props.data.cssClasses}
          onBlur={classInputUpdate}
          style={{width: "150px"}}
          spellCheck={false}
        >
        </input>

        <button className="
        bg-gray-300 p-1 rounded-md
        cursor-pointer hover:bg-gray-900 mr-2
        hover:text-white mb-1 mt-1"
        onClick={() => {addClass("i-circle")}}>circle</button>

        <button className="
        bg-gray-300 p-1 rounded-md
        cursor-pointer hover:bg-gray-900 mr-2
        hover:text-white mb-1 mt-1"
        onClick={() => {addClass("i-rounded")}}>rounded</button>

        <button className="
        bg-gray-300 p-1 rounded-md
        cursor-pointer hover:bg-gray-900 mr-2
        hover:text-white mb-1 mt-1"
        onClick={() => {addClass("i-smaller")}}>smaller</button>
        
        <button className="
        bg-gray-300 p-1 rounded-md
        cursor-pointer hover:bg-gray-900 mr-2
        hover:text-white mb-1 mt-1"
        onClick={() => {addClass("user-1")}}>user-1</button>
        
        <button className="
        bg-gray-300 p-1 rounded-md
        cursor-pointer hover:bg-gray-900 mr-2
        hover:text-white mb-1 mt-1"
        onClick={() => {addClass("user-2")}}>user-2</button>
        
        <button className="
        bg-gray-300 p-1 rounded-md
        cursor-pointer hover:bg-gray-900 mr-2
        hover:text-white mb-1 mt-1"
        onClick={() => {addClass("user-3")}}>user-3</button>
        

      </div>
    </>
  )
}


export default CommandEntryImage