

import Link from './Link.js'


//import redux magic:
import {useDispatch} from 'react-redux'
import dataSlice from "../reducers/dataSlice"

import GenericButton from "./GenericButton.js"

function LinkSection(props) {
  const dispatch = useDispatch()

  const maxLevels = 6

  if (window.DEBUG.log.props) window.DEBUG.doLogProps(props, "LinkSection")


  function addChoice(mode = "goto") {
    //props.parent.id, props.parent.
    dispatch( dataSlice.action.addChoice(
      {
        pageId: props.pageId,
        parentId: props.parent.id,
        mode: mode,
      }))
  }

  function addChoiceSub() {
    addChoice("sub")
  }

  function addChoiceGoto() {
    addChoice("goto")
  }


  let ls = props.links.map( link => {
    return <Link 
      pageId={props.pageId} 
      parent={props.parent} 
      level={props.level} 
      key={link.id} 
      data={link}
      emitMessage={props.emitMessage}></Link>
  })
  
  let addChoiceButton = null

  if (props.level <= maxLevels - 1) {
    addChoiceButton = (
      <>

        <div className="flex mt-4">
          <GenericButton
            title="add a choice"
            icon="arrow_forward_ios"
            text="choice"
            onClick={addChoiceGoto}
            ></GenericButton>

          <GenericButton
            title="add a sub-path choice"
            icon="keyboard_double_arrow_right"
            text="sub"
            onClick={addChoiceSub}
            ></GenericButton>
        </div>
      </>

    )
  }

  return (<>
      <div className="">
        {ls}

        {addChoiceButton}

      </div>
    </>)
}

export default LinkSection