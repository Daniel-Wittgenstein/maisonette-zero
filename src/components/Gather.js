

import {useDispatch} from 'react-redux'

import dataSlice from "../reducers/dataSlice"
import CommandBlock from './CommandBlock'

import GenericButton from "./GenericButton.js"


function Gather(props) {

  const dispatch = useDispatch()

  if (window.DEBUG.log.props) window.DEBUG.doLogProps(props, "Gather")


  function addGather() {
    dispatch( dataSlice.action.addGather(
      {
        pageId: props.all.pageId,
        parentId: props.all.commandBl.id,
      })
    )
  }


  function deleteGather() {
    dispatch( dataSlice.action.deleteGather(
      {
        pageId: props.all.pageId,
        parentId: props.all.commandBl.id,
      })
    )      
  }


  return (
    <>
      <div className="mt-4">
        {!props.all.commandBl.gather ?
          <div className='border-gray-400 border-t-2 pt-2 flex'>

            <GenericButton
              title="add a gather block"
              icon="follow_the_signs"
              text = ""
              onClick={addGather}
            ></GenericButton>

          </div>
        :
          <>
            <div className="pt-2 mb-2 border-t-2 border-gray-400 flex">AFTER ALL CHOICES, GATHER HERE :</div>

            <GenericButton
              title="delete this gather block"
              icon="delete"
              text = "gather"
              onClick={deleteGather}
            ></GenericButton>


            <CommandBlock
            emitMessage={props.all.emitMessage}
            parent={false}
            commandBl={props.gather.commandBlock}
            pageId={props.all.pageId}
            level={props.all.level}
            isGatherBlock={true}

            ></CommandBlock>


          </>
        }
      </div>
    </>
  )
}


export default Gather

/* Note: currently passing parent = false to commandblock. DOES THE COMMAND BLOCK EVEN USE
this parameter? What is it even good for?


<CommandBlock
parent={false}
commandBl={props.all.commandBl}
pageId={props.all.pageId}
level={props.all.level}></CommandBlock>

not getting this at all. too tired.

*/
