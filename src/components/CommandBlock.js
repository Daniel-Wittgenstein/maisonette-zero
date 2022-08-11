
/* //icon for play sound: music_note / icon for play/pause background track: equalizer


close: close or cancel (cancel is round cross)

info, settings, undo, play_arrow, play_circle
save, file_upload, upload_file, image, palette, settings,
file_download, exit_to_app (for export maybe), zoom_in, zoom_out,
add, add_circle, add_box (for new page maybe), note_add (perfect for new page!!), edit (for edit page name),
flag or flag_circle (for set starting page)
alarm_add: perfect for add timer
timer_off: good for remove timer
import_contacts: for story settings maybe
*/


import Gather from './Gather.js'

//import Link from './Link.js'

import LinkSection from './LinkSection.js'

import {useDispatch} from 'react-redux'

import dataSlice from "../reducers/dataSlice"

import CommandEntry from "./CommandEntry.js"

import GenericButton from "./GenericButton.js"

import {getCommandDataFromType} from "../generic/pageElements.js"

function CommandBlock(props) {

  //border color
  const colors = ["#f4fdff", 
  "border-green-300", "border-yellow-300", "border-purple-300",
  "border-orange-300", "border-red-300" ]

  //background color
  const colorsBg = ["#FFFFFF", 
  "#f1fff6", "#feffe3", "#fef3ff",
  "#fff6e3", "#fff6f6" ]

  //commands title bar bg color
  const colorsTitle = ["#E0F2FE",
  "#c7fdda", "#fff4b4", "#f0d4f3",
  "#fce7bb", "#ffe0e0" ]

  //commands box shadow color
  const colorsShadow = ["#cfdee2", 
  "#b4ecc8", "#edc40c66", "#00000022",
  "#00000022", "#df9b9b77"]
  
  const dispatch = useDispatch()

  let callbacks = {
    deleteItem: deleteItem,
    onTextInput: onTextInput,
  }

  if (window.DEBUG.log.props) window.DEBUG.doLogProps(props, "CommandBlock")
  
  let cm = props.commandBl.commands.map( c => {
    return (
        <CommandEntry
          colorTitle={colorsTitle[props.level - 1]}
          colorShadow={colorsShadow[props.level - 1]}
          key={c.id}
          data={c.data} type={c.data.type}
          callbacks={callbacks} id={c.id}
          commandBlock={props.commandBl}
          pageId={props.pageId}
          emitMessage={props.emitMessage}
        ></CommandEntry>
    )
  })

  function onTextInput(id, text) {
    dispatch( dataSlice.action.setCommandText(
      {
        pageId: props.pageId,
        parentId: props.commandBl.id,
        selfId: id,
        text: text,
      }))
  }

  function deleteItem(id) {
    dispatch( dataSlice.action.deleteSomething(
      {
        pageId: props.pageId,
        parentId: props.commandBl.id,
        selfId: id,
        propKey: "commands",
      }))
  }
  
  function addCommand(type) {
    let data = getCommandDataFromType(type)
    dispatch( dataSlice.action.addCommand(
      {
        pageId: props.pageId,
        parentId: props.commandBl.id,
        data,
      }))
  }


  let col = colors[props.level - 1]

  let colBg = colorsBg[props.level - 1]

  let cn = `${col} p-2`

  let lastChoiceText = props.lastChoiceText

  let afterText = `after choosing "${lastChoiceText}":`

  if (!lastChoiceText) afterText = ""

  if (lastChoiceText === "pageStart") afterText = "" //"at page start:"

  let borderShow = props.isSubBlock
/*
  const stdButtonClassNames = `
  bg-gray-300 rounded-md p-2 m-2
  cursor-pointer hover:bg-gray-700
  hover:text-white
  `
*/
  

  return (
    <>
      <div
        style={{
          "background": colBg,
        }}
        className={`border-${borderShow ? '2' : '0'} border-t-0
        rounded-br-md rounded-bl-md anim-uncollapse ${cn}`}>


        <div>

          <div className="text-xs text-gray-600">
            {afterText}
          </div>
          {cm}

          <div
            className="
            flex
          ">
            <GenericButton
              title="add a text command"
              icon="article"
              text="text"
              onClick={ () => addCommand("text") }
              ></GenericButton>

            <GenericButton
              title="add a go-to command"
              icon="low_priority"
              text="goto"
              onClick={ () => addCommand("goto") }
              ></GenericButton>


            <GenericButton
              title="add an image command"
              icon="image"
              text="image"
              onClick={ () => addCommand("image") }
              ></GenericButton>

            <GenericButton
              title="set or change a variable"
              icon="calculate"
              text="set"
              onClick={ () => addCommand("set") }
              ></GenericButton>

            <GenericButton
              title="add a story ending command"
              icon="stop_circle"
              text="end"
              onClick={ () => addCommand("endStory") }
              ></GenericButton>
          </div>

          <LinkSection
            parent={props.commandBl}
            links={props.commandBl.links}
            pageId={props.pageId}
            level={props.level}
            emitMessage={props.emitMessage}
          >
          </LinkSection>
          {props.isGatherBlock ?
            null
            :
            <Gather all={props} gather={props.commandBl.gather}></Gather>
          }
        </div>
      </div>
    </>
  )
}


export default CommandBlock