
  /* 

    An input that syncs a page element to the Redux store and back.

    Things to note:

    - This has not been extensively tested.

    - Because of its complexity and lack of testing, it may break. Handle with care.

    -  warning: Undo works with this kind of input, but only if it's triggered by a button 
      (because then the input loses focus and onBlur is triggered before).
      If you ever build a keybinding for undo, this will most likely break undo
      for these inputs.


    props:

      props.pageId:
        Must be passed. Needed for syncing.
        The story page id that corresponds to this input
        (i.e. the page this input belongs to). 

      props.id:
        Must be passed. Needed for syncing.
        The element id that corresponds the page element that is the immediate parent to this input. 
        For example, if the BaseSyncInput is inside a command, then the command would
        be the immediate parent, if the BaseSyncInput is inside a choice, then the
        choice is the immediate parent.

      props.syncArray:
        example:
        ["data", "ifConditionContent"]
        Must be passed. Needed for syncing.
        An array of strings. Each string is a property and
        the strings describe a nested access.
        The syncArray is dispatched to genericAssignProp (which
        is a store reducer method).
      
      props.syncValue:
        This one is tricky!
        You must pass a value to syncValue that corresponds to the
        value accessed by props.syncArray!

        So if for example syncArray is ["data", "ifConditionContent"],
        then syncValue should be passed the value props.data.ifConditionContent
        from the parent React element. (Assuming that props.data holds the same
        data object that syncArray is accessing, of course, which in turn
        relies on props.id referring to the correct store object.)

        The rationale behind this is that while this component could access
        the correct value via syncArray from the store, it would be a waste
        to do so, because the parent component will already own the correct value
        and it can just pass it on. Otherwise we would do an extra
        walk of the whole page tree for nothing, really.

      props.simpleMode
        if true, a simpler approach to syncing is used.
        The value is not synced into a page object in the redux store, but
        directly into the redux store.
        In this case, just pass syncArray. syncValue, pageId and id are ignored, don't pass them.
        A syncArray of ["bla", "bli", "blu"] would sync the value
        with the redux store value: store.bla.bli.blu

      props.styleInner: a css style object, styles input (despite name)

      props.fireOnChange: (optional): additional function to fire very time
          the input's value changes (can be used for validation functions).
          Gets passed new value of input.

  */

import { useEffect } from 'react'

import SimpleInput from "./SimpleInput.js"

import {useState} from "react"

import dataSlice from "../reducers/dataSlice"

import {useDispatch} from 'react-redux'

import { useSelector } from 'react-redux'

function accessNestedValue(obj, accessorArray) {
  let el = obj
  for (let prop of accessorArray) {
    el = el[prop]
  }
  return el
}

function BaseSyncInput(props) {
 
  if (props.simpleMode && props.syncValue) {
    throw new Error("BaseSyncInput. If simpleMode is true, syncValue should be undefined.")
  }
          
  if (!props.syncArray && !props.syncArray.length) {
    throw new Error("BaseSyncInput needs syncArray.")
  }

  const state = useSelector(state => state.main)

  const dispatch = useDispatch()

  const [inputFocussed, setInputFocussed] = useState(false)

  const [inputContent, setInputContent] = useState("")

  function onBlur() {
    setInputFocussed(false)
    sendInputContentToStore()
  }

  function onFocus() {
    setInputFocussed(true)
  }

  function sendStoreToInputContent() {
    let value
    if (props.simpleMode) {
      value = accessNestedValue(state, props.syncArray)
    } else {
      value = props.syncValue
    }
    if (value === undefined) {
      console.log("all props", props)
      throw new Error("Base sync input error. Trying to set input to undefined value.")
    }
    setInputContent(value)
  }

  function onChange(event) {
    setInputContent(event.target.value)
    if (props.fireOnChange) props.fireOnChange(event.target.value)
  }

  function sendInputContentToStore() {
    let val = inputContent
    if (props.type === "number") {
      val = Number(val)
      if (val > props.max) {
        val = props.max
      }
      if (val < props.min) {
        val = props.min
      }
    } else if (props.type === "text") {
      if (props.trim) val = val.trim()
    }

    if (props.simpleMode) {
      dispatch( dataSlice.action.genericStateChange(
        {
          value: val,
          propList: props.syncArray,
        })
      )
    } else {
      dispatch( dataSlice.action.genericAssignProp(
        {
          pageId: props.pageId,
          selfId: props.id,
          assign: {
            access: props.syncArray,
            value: val,
          }
        })
      )
    }

  }
  
  useEffect(() => {
    if (inputFocussed) {
      // input is focussed, do nothing
    } else {
      //note: if you click on undo button, this is called
      //before undo dispatches to the redux store
      sendStoreToInputContent()
    }
  })

  return (
    <>
      <SimpleInput
        value={inputContent}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        multiLine={props.multiLine}
        styleInner={props.styleInner}
      >
      </SimpleInput>
    </>
  )
}


export default BaseSyncInput