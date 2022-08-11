

/*

todo:

- change genericinput to only have original feature so scriptsview
can still use it

- document the fact that genericinput should 1. not be used with anything complex
2. should not be used with undo (hence why the scriptsview dialogue has no undo)
and 3. is only for scriptsview

- add width and maybe even style object prop to simple input

- unify link and commandentry somehow so that they can partly use same logic.
  if condition should apply to both!!! alternatively: just screw it and
  copy the entire logic over to link. the question is: how hard would unification be?
  
  NEXT: or: can the input be generalized easily???? it really depends on useeffect i think.

  try it experimentally, make a second generalized version from here and see if it works


*/


import CommandEntryText from "./CommandEntryText.js"
import CommandEntryGoto from "./CommandEntryGoto.js"
import CommandEntryImage from "./CommandEntryImage.js"
import CommandEntrySet from "./CommandEntrySet.js"
import CommandEntryStoryEnd from "./CommandEntryStoryEnd.js"

import {useState} from "react"

import SimpleInput from './SimpleInput.js'

import dataSlice from "../reducers/dataSlice"

import {useDispatch} from 'react-redux'

import ifCondValidator from '../language-processing/ifConditionValidator.js'

import GenericButton from "./GenericButton.js"

import { connect } from 'react-redux'

import { useEffect } from 'react'

import { useSelector } from 'react-redux'

import SmartInput from './SmartInput.js'

const ifValidatorFunction = ifCondValidator.ifValidatorFunction

function CommandEntry(props) {

  //console.log("COMMAND ENTRY PROPS", props)

  const dispatch = useDispatch()
  
  const state = useSelector(state => state.main)

  const [ifFocussed, setIfFocussed] = useState(false)

  useEffect(() => {
    //console.log("rerendering COMMAND ENTRY")
    if (ifFocussed) {
      //console.log("input is focussed, do nothing")
    } else {
      //note: if you click on undo button, this is called
      //before undo dispatches to the redux store
      //console.log("input is not focussed")
      sendStoretoIfContent()
    }
  })

  function sendStoretoIfContent() {
    setIfContent(props.data.ifConditionContent)
  }

  function sendIfContentToStore() {
    let val = ifContent
    console.log("updating")
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

    dispatch( dataSlice.action.genericAssignProp(
      {
        pageId: props.pageId,
        selfId: props.id,
        assign: {
          access: ["data", "ifConditionContent"],
          value: val,
        }
      })
    )
  }

  function ifOnChange(event) {
    console.log("if onchange")
    setIfContent(event.target.value)
  }

  function ifOnBlur() {
    setIfFocussed(false)
    sendIfContentToStore()
  }

  function ifOnFocus() {
    setIfFocussed(true)
  }

  const [ifContent, setIfContent] = useState("")


  function moveUp() {
    console.log(props)
    moveCommand(-1)
  }

  function moveDown() {
    moveCommand(1)
  }

  function moveCommand(step) {
    dispatch( dataSlice.action.moveCommand(
      {
        pageId: props.pageId,
        selfId: props.id,
        parentCommandBlock: props.commandBlock,
        step,
      })
    )
  }



  function showHideButtonClick() {
    let val = props.data.ifConditionEnabled
    dispatch( dataSlice.action.genericAssignProp(
      {
        pageId: props.pageId,
        selfId: props.id,
        assign: {
          access: ["data", "ifConditionEnabled"],
          value: !val,
        },
      })
    )
  }


  let validatorFunc = ifValidatorFunction

  let commandEntry = null

  if (props.type === "text") {
    commandEntry = (
      <CommandEntryText
        data={props.data} type={props.type}
        callbacks={props.callbacks} id={props.id}
        commandBlock={props.commandBlock}
        pageId={props.pageId}
        emitMessage={props.emitMessage}
      ></CommandEntryText>
    )  
  } else if (props.type === "goto") {
    commandEntry = (
      <CommandEntryGoto
        data={props.data} type={props.type}
        callbacks={props.callbacks} id={props.id}
        commandBlock={props.commandBlock}
        pageId={props.pageId}
        emitMessage={props.emitMessage}
      ></CommandEntryGoto>

    ) 
  } else if (props.type === "image") {
    commandEntry = (
      <CommandEntryImage
        data={props.data} type={props.type}
        callbacks={props.callbacks} id={props.id}
        commandBlock={props.commandBlock}
        pageId={props.pageId}
        emitMessage={props.emitMessage}
      ></CommandEntryImage>
    ) 
  } else if (props.type === "set") {
    commandEntry = (
      <CommandEntrySet
        data={props.data} type={props.type}
        callbacks={props.callbacks} id={props.id}
        commandBlock={props.commandBlock}
        pageId={props.pageId}
        emitMessage={props.emitMessage}
      ></CommandEntrySet>
    ) 
    } else if (props.type === "endStory") {
      commandEntry = (
        <CommandEntryStoryEnd
          data={props.data} type={props.type}
          callbacks={props.callbacks} id={props.id}
          commandBlock={props.commandBlock}
          pageId={props.pageId}
          emitMessage={props.emitMessage}
        ></CommandEntryStoryEnd>
    ) 
  }

  function deleteItem() {
    props.callbacks.deleteItem(props.id)
  }

  const menuShower = (
    <>

      <GenericButton
      title="move command up"
      icon="arrow_drop_up"
      text=""
      onClick={moveUp}
      ></GenericButton>


      <GenericButton
      title="move command down"
      icon="arrow_drop_down"
      text=""
      onClick={moveDown}
      ></GenericButton>


      <GenericButton
      title={props.data.ifConditionEnabled ? "delete condition" : "add condition"}
      icon={props.data.ifConditionEnabled ? "delete" : ""}
      text={props.data.ifConditionEnabled ? "IF" : "IF"}
      onClick={showHideButtonClick}
      ></GenericButton>

      {props.data.ifConditionEnabled ?
        <SmartInput
          validatorFunc={ifValidatorFunction}
          styleOuter={{display: "inline-block"}}
          label="only if:"
          subLabel=""
          type="text"
          simpleMode={false}
          pageId={props.pageId}
          id={props.id}
          syncArray={["data", "ifConditionContent"]}
          syncValue={props.data.ifConditionContent}
          styleInner={{width: "240px"}}
        ></SmartInput>
        :
        null
      }
    </>
  )



  const commandEntryTopBar = (
    <div className="m-1 pb-0" style={{
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
    }}>

          <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >

          {menuShower}
        </div>

        <div>
        <GenericButton
          title="delete command"
          icon="delete"
          text=""
          onClick={deleteItem}
          ></GenericButton>
        </div>

    </div>
  )

  return (
    <>
      <div 
        className="mb-4 rounded bg-white"
        style={{
          boxShadow: "3px 3px " + props.colorShadow,
          border: "1px solid #999",
          display: "flex",
          flexDirection: "column",
        }}
        >

        <div
          style={{
            borderBottom: "1px solid #999",
            background: props.colorTitle,
          }}
        >
          {commandEntryTopBar}
        </div>

        <div className="m-2">
        {commandEntry}
        </div>
      
      </div>
    </>
    
  )
}


const mapStateToProps = function(state) {
  return {
    entireStoreState: state.main,
  }
}


///////export default connect(mapStateToProps)(CommandEntry)

export default CommandEntry


/* 

        <GenericInput
          validatorFunc={validatorFunc}
          styleOuter={{display: "inline-block"}}
          label="only if:"
          subLabel=""
          type="text"
          chez={Math.random()}
          treeSyncMode={true}
          treeSync={{
            elementId: props.id,
            pageId: props.pageId,
            propList: ["data", "ifConditionContent"],
          }}
          width={240}
          trim={true}
          ></GenericInput>
*/