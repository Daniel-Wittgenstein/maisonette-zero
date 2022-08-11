

import CommandBlock from './CommandBlock.js'

import {useDispatch} from 'react-redux'

import dataSlice from "../reducers/dataSlice"

import {useState} from "react"

import { useSelector } from 'react-redux'

import Creatable, { useCreatable } from 'react-select/creatable'

import GenericButton from "./GenericButton.js"

import SmartInput from './SmartInput.js'

import ifCondValidator from '../language-processing/ifConditionValidator.js'

const ifValidatorFunction = ifCondValidator.ifValidatorFunction


function Link(props) {
    
  let state = useSelector(state => state.main)

  const dispatch = useDispatch()

  const [foldedOpen, setFoldedOpen] = useState(false)

  const [warnedAboutDeletedSubPath, setWarnedAboutDeletedSubPath] = useState(false)

  if (window.DEBUG.log.props) window.DEBUG.doLogProps(props, "Link")

  function showHideButtonClick() {
    let val = props.data.data.ifConditionEnabled
    dispatch( dataSlice.action.genericAssignProp(
      {
        pageId: props.pageId,
        selfId: props.data.id,
        assign: {
          access: ["data", "ifConditionEnabled"],
          value: !val,
        },
      })
    )
  }



  function onGotoCreateOption(val) {
    //0 / string
    //console.log("input changed new created", val)
    dispatch( dataSlice.action.createNewPageFromGotoInput(
      {
        pageId: props.pageId,
        parentId: props.data.commandBlock.id,
        selfId: props.data.id,
        newPageName: val,
      })
    )
  }
  
 
  function onGotoInputChange(...args) {
    //0 / value / label
    let entry = args[0]
    if (!entry) throw new Error(`No advanced goto input value?!`)
    dispatch( dataSlice.action.setLinkGotoTarget(
      {
        pageId: props.pageId,
        parentId: props.data.commandBlock.id,
        selfId: props.data.id,
        data: entry,
      })
    )
  }


  function clickCollapseButton() {
    setFoldedOpen(!foldedOpen)
  }

  function handleInput(event) {
    //this is sometimes throwing error, no idea why.
    //anyway, this runs constantly and that's bad, so refactor it to run
    //less
    if (event.code === "Enter") updateLinkText(event)
    return
  }


  function updateLinkText(event) {
    let val = event.target.value
    dispatch( dataSlice.action.setCommandText(
      {
        pageId: props.pageId,
        parentId: props.data.commandBlock.id,
        selfId: props.data.id,
        text: val,
      })
    )
  }


  function clickTimer() {
    //enable timer for this link
    let time = 5
    if (props.data.hasTimer) time = -1 //disable
    dispatch( dataSlice.action.setLinkTimer(
      {
        pageId: props.pageId,
        parentId: props.data.commandBlock.id,
        selfId: props.data.id,
        time: time,
      })
    )
  }


  function timerInputOnChange(event) {
    let val = event.target.value
    dispatch( dataSlice.action.setLinkTimer(
      {
        pageId: props.pageId,
        parentId: props.data.commandBlock.id,
        selfId: props.data.id,
        time: val,
      })
    )
  }


  function openPageFromGoto() {
    props.emitMessage("openNewPage", {target: props.data.data.gotoTarget})
  }

  function deleteItem() {
    dispatch( dataSlice.action.deleteSomething(
      {
        pageId: props.pageId,
        parentId: props.parent.id,
        selfId: props.data.id,
        propKey: "links",
      }))
  }

  function selectChanged(event) {

    const oldMode = props.data.mode
    const newMode = event.target.value

    if (oldMode === "sub" && newMode !== "sub") {
      const newName = {"empty": "empty", "goto": "goto"}[newMode]
      let msg = `You just changed a sub-path choice to a ${newMode} choice! ` +
      `The sub-path of the old choice is not used anymore and was therefore deleted.
      If you still need the sub-path and want to restore it, use the "undo" button!`
      let duration = 240_000
      if (warnedAboutDeletedSubPath) {
        duration = 4000
        msg = `This choice's sub-path was deleted. Use the "undo" button to restore it.`
      }
      dispatch(dataSlice.action.notify({
        msg,
        duration,
        intent: "warning",
      }))
      setWarnedAboutDeletedSubPath(true)
    }

    dispatch( dataSlice.action.setLinkMode(
      {
        pageId: props.pageId,
        parentId: props.parent.id,
        selfId: props.data.id,
        mode: newMode,
      }))
  }

  let d = props.data

  let indent = 32

  let subordinateCommandBlock = null

  if (foldedOpen && d.mode === "sub") {
    subordinateCommandBlock = (    
      <>
        <div className="flex">
          <div className="
          border-r-0 border-l-2 border-t-0 border-b-2 rounded-bl-sm
            border-gray-500 ml-6 border-dotted" style={{width: "100%", height: "32px"}}>
          </div>
        </div>

        {d.commandBlock ?
        <div style={{"paddingLeft": indent+"px"}}>
          <CommandBlock
            isSubBlock = {true}
            lastChoiceText={props.data.data.text}
            parent = {props.parent}
            commandBl = {d.commandBlock}
            level = {props.level + 1}
            pageId = {props.pageId}
          >
          </CommandBlock>
        </div>

        : "no command block"
        }
      </>
    )
  }

  let collapserButton = (
    <div className="mr-2">
      <GenericButton
      title={foldedOpen ? "close" : "open"}
      icon=""
      text={foldedOpen ? "-" : "+"}
      onClick={props.data.mode === "sub" ? clickCollapseButton : () => {}}
      width="32px"
      ></GenericButton>
    </div>
  )


  const optionsPages = Object.values(state.pages).map(page => {
    return {value: page.name, label: page.printedName}
  })


  let pageSelValue = {value: props.data.data.gotoTarget, label: props.data.data.gotoTargetName}
  //console.log("and the oage sel value be like:", pageSelValue, optionsPages)

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      width: 200,
    }),
  }

  let pageSelector = null
  if (props.data.mode === "goto") {
    pageSelector = (
      <>
        <div className="">
          <Creatable
            styles={customStyles}
            value={ pageSelValue }
            defaultValue={ pageSelValue }
            onCreateOption={onGotoCreateOption}
            onChange={onGotoInputChange}
            options={optionsPages}
            placeholder={"Choose page ..."}>
          </Creatable>
        </div>
      </>
    )
  }

  return <> 
    <div className="border-2
      border-gray-600 mt-4 rounded-md border-gray-200 p-2">
      
      <div className="flex items-center border-b-2 border-gray-200 p-2"
      >
        <div className="mr-2">choice</div>

        <GenericButton
          title={props.data.data.ifConditionEnabled ? "delete condition" : "add condition"}
          icon={props.data.data.ifConditionEnabled ? "delete" : ""}
          text={props.data.data.ifConditionEnabled ? "IF" : "IF"}
          onClick={showHideButtonClick}
        ></GenericButton>

        {props.data.data.ifConditionEnabled ?
          <SmartInput
            validatorFunc={ifValidatorFunction}
            styleOuter={{display: "inline-block"}}
            label="only if:"
            subLabel=""
            type="text"
            simpleMode={false}
            pageId={props.pageId}
            id={props.data.id}
            syncArray={["data", "data", "ifConditionContent"]}
            syncValue={props.data.data.ifConditionContent}
            styleInner={{width: "240px"}}
            trim={true}
            ></SmartInput>
          :
          null
        }


        <GenericButton
          title="delete this choice"
          icon="delete"
          text=""
          onClick={deleteItem}
        ></GenericButton>

      </div>

      <div className="flex items-end border-0 border-red-300 items-center flex p-1">

        {props.data.mode === "sub" ? collapserButton : null}

        <div className="flex">

          <SmartInput
            validatorFunc={false}
            styleOuter={{display: "inline-block"}}
            label="choice:"
            subLabel=""
            type="text"
            simpleMode={false}
            pageId={props.pageId}
            id={props.data.id}
            syncArray={["data", "data", "text"]}
            syncValue={props.data.data.text}
            styleInner={{width: "240px"}}
            trim={true}
          ></SmartInput>

          <select onChange={selectChanged} value={props.data.mode}
            className='ml-4 mr-4'>
            <option value="goto">go to this page:</option>
            <option value="sub">enter a sub-path</option>
            <option value="nothing">do nothing (continue to next gather)</option>
          </select>

          {pageSelector}


          {props.data.mode === "goto" ? 
            <button
              onClick={openPageFromGoto}
              title="open this page now"
              className="
              rounded bg-gray-200 cursor-pointer hover:bg-gray-700
              hover:text-white ml-2
              p-2">⇾
            </button>
            :
            null  
          }

          {!props.data.hasTimer ?

            <GenericButton
              onClick={clickTimer}
              title="add timer"
              icon="alarm_add"              
            ></GenericButton>

            :
            null
          }


          
        </div>



      </div>

      {props.data.hasTimer && false ?
            <div className="m-4 flex items-center">
              Automatically select this choice after
              <input 
              min="1"
              max="7200"
              onChange={timerInputOnChange}
              value={props.data.time}
              className="border-gray-500 border-2 rounded-bl-sm
              m-2 p-1" type="number" style={{width: "48px"}}></input>
              seconds.


              <GenericButton
              onClick={clickTimer}
              title="remove timer"
              icon="cancel"
              text=""             
              ></GenericButton>


            </div>
          :
            null
          }



      {subordinateCommandBlock}

    </div>
  </>
}



export default Link


/*

 style={{width: 20, height: 20, "textAlign": "center",
          "alignItems": "center",
          }}

*/