
import { useRef } from "react"

import { useSelector } from 'react-redux'

import { useEffect } from 'react'

import HtmlTemplate from "../HTMLTemplate/HTMLTemplateAdvanced.js"

const _ = require('lodash')

function PlayView() {

  const state = useSelector(state => state.main)

  const iframeRef = useRef(null)

  //const [guard, setGuard] = useState(false)


  function writeToIframe(html) {
    let el = iframeRef.current
    el.contentWindow.location.reload(true) //necessary or variables
      //in iframe will persist (?! is it?)
    setTimeout(
        () => {
            el.contentWindow.document.open()
            el.contentWindow.document.write(html)
            el.contentWindow.document.close()
        }, 100
    )
  }


  useEffect(() => {
    //run on rerender:
    //let newState = _.cloneDeep(state)
    //let iframe = iframeRef.current
    let exportedFinal = false
    let html = HtmlTemplate(state, exportedFinal)
    if (html.error) {
      alert (`Error. Could not create story: ${html.msg}`)
      return
    }
    //console.log("THE HTML IS", html)
    writeToIframe(html)
  })
  


  return (
    <div
    style={{
      width: "100vw",
      height: "calc(100vh - 32px)",
      border: "2px solid #CCC",
      padding: "0px",
      margin: "0px",
    }}>
      <iframe
        title="play preview"
        style={{
          width: "100%",
          height: "100%",
        }}
      ref={iframeRef}>

      </iframe>

    </div>
  
  )
}
export default PlayView

