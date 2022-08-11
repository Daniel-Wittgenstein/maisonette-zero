

import React from 'react'
import CodeMirror from '@uiw/react-codemirror'
import GenericButton from "./GenericButton.js"

import { msnLanguage } from '../maisonettescript/msnLanguage.js'
import { StreamLanguage } from '@codemirror/language'

import processor from "../maisonettescript/processor.js"

//import stateToScript from "../maisonettescript/stateToScript.js"

import { useState } from 'react';

function CodeEditor(props) {

  /*
    props:
      callback: props.closeSelf()
  */

  const defText = `Warning: Code mode is an advanced feature.
    It allows you to change and also potentially break your entire story.
    Please make a backup before you start typing into the box below.
    Also be sure to read the documentation on what text format Maisonette expects.`

  const [errorMsg, setErrorMsg] = useState(defText)

  const updateAfterIdleTime = 500 //update if user did not type this many milliseconds
  let editorContent = ""
  let typingTimeout = false

  function onChange(text, editor) {
    editorContent = text
    if (typingTimeout) clearTimeout(typingTimeout)
    typingTimeout = setTimeout(updateAfterTyping, updateAfterIdleTime)
  }

  function updateAfterTyping() {
    console.time("transpilation")
    let res = processor.process(editorContent)
    console.timeEnd("transpilation")
    console.log(res)
    if (res && res.error) {
      showError(res)
      return
    }
    showSuccessMessage()
  }

  function showSuccessMessage() {
    setErrorMsg("Translated story! Okay!")  
  }

  function showError(error) {
    let msg = error.msg
    msg = msg + "\nLine number: " + error.lineNr
    console.log("An error occurred:", error)
    setErrorMsg(msg)
  }

  const topBarHeight = 92 //in pixels
  const buttonSize = 32
  
  return (

    <div
      style={{
        position: "absolute",
        top: "0px",
        left: "0px",
        width: "100vw",
        height: "100vh",
        zIndex: 200000,
      }}
      >
      
        <div
        style={{
          position: "absolute",
          top: "0px",
          left: "0px",
          width: "100vw",
          height: topBarHeight + "px",
          background: "white",
          display: "flex",
          borderBottom: "1px solid #CCC",
        }}
        >

          <div
            style ={{
              height: buttonSize + "px",
              display: "flex",
            }}
          >
            <GenericButton
            title = "close"
            icon ="close"
            text = ""
            width = {buttonSize + "px"}
            onClick={ () => {
              props.closeSelf()
            } }
            ></GenericButton>
            
            <GenericButton
            title = "translate"
            icon ="check"
            text = ""
            width = {buttonSize + "px"}
            onClick={ () => {} }
            ></GenericButton>
          </div>

          <div
            style ={{
              display: "flex",
              background: "#DDD",
              color: "#000",
              padding: "12px",
              width: "70vw",
              overflowY: "scroll",
              marginLeft: "12px",
              whiteSpace: "pre-line",
            }}          
          >
            {errorMsg}

          </div>

        </div>

        <div
        style={{
          position: "absolute",
          top: topBarHeight + "px",
          left: "0px",
          width: "100vw",
          height: "calc(100vh - " + topBarHeight + "px)",
          background: "white",
        }}
        >
          <CodeMirror
            value="=== page1"
            height={"calc(100vh - " + topBarHeight + "px)"}
            onChange={onChange}
            extensions={[StreamLanguage.define(msnLanguage)]}
          />

        </div>


    </div>
  )
}

export default CodeEditor