
/* 

A wrapper around BaseSyncInput with additional
validation and label functionality and some styling.

props:
  props.pageId,
  props.id,
  props.syncArray,
  props.syncValue,
  props.simpleMode
    -> for documentation on these, see BaseSynInput.js

  label: string: appears in front of input. can be empty string.
  sublabel: string: shown beneath the label in smaller font. can be empty string.
  type: "number" or "text"
  
  styleOuter: style object
    example: styleOuter={{display: "inline-block"}}
    styles wrapper around the input, not input itself!
  
  styleInner: style object
    style for input itself
  
  validatorFunc: function. (optional)
    takes value of input as string, should return object, for example:
      return {
        error: false,
        notify: true,
        msg: `Condition looks okay!`
      }
    or:
      return {
        error: true,
        msg: result,
      }

  multiLine: false (input) / true (textarea)


  These props are not supported, yet:
    min: integer (only for type === "number")
    max: integer (only for type === "number")
    trim: boolean (only for type === "text")


*/

import BaseSyncInput from "./BaseSyncInput.js"

import {useState} from "react"

function SmartInput(props) {



  let changeTimeout

  const [errorText, setErrorText] = useState("")

  function fireOnChange(val) {
    function check() {
      if (changeTimeout) clearTimeout(changeTimeout)
      changeTimeout = false
      let res = props.validatorFunc(value)
      if (res.error) {
        setErrorText(res.msg)
      } else if (res.notify) {
        setErrorText("--notify--" + res.msg)
      }
    }
    let value = val
    if (!props.validatorFunc) return
    if (!changeTimeout) {
      changeTimeout = setTimeout(check, 100)
    }
  }

  let width = props.width || 200

  let finalErrorText = ""

  return (
    <>
      <div className="" style={props.styleOuter || {}}>
        <div className="mb-1">
          <p className="mr-2" style={{display: "inline-block"}}>{props.label}</p>

          <BaseSyncInput
            pageId={props.pageId}
            id={props.id}
            syncArray={props.syncArray}
            syncValue={props.syncValue}
            simpleMode={props.simpleMode}
            fireOnChange={fireOnChange}

            multiLine={props.multiLine}
            styleInner={props.styleInner}
          >
          </BaseSyncInput>

        </div>
        <div className="text-gray-500">
          {props.subLabel} {errorText}
        </div>
      </div>

    </>

  )
}


export default SmartInput
