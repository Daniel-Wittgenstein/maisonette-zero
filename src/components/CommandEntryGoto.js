

import Creatable, { useCreatable } from 'react-select/creatable'

import {useDispatch} from 'react-redux'

import dataSlice from "../reducers/dataSlice"

import { useSelector } from 'react-redux'



function CommandEntryGoto(props) {

  //console.log("LE PROPS goto", props)

  if (window.DEBUG.log.props) window.DEBUG.doLogProps(props, `CommandEntryGoto ("redirect")`)

  let state = useSelector(state => state.main)

  const dispatch = useDispatch()


  function onGotoCreateOption(val) {
    //0 / string
    console.log("input changed new created", val)
    dispatch( dataSlice.action.createNewPageFromGotoInput(
      {
        pageId: props.pageId,
        parentId: props.commandBlock.id,
        selfId: props.id,
        newPageName: val,
      })
    )
  }
  
 
  function onGotoInputChange(...args) {
    //0 / value / label
    let entry = args[0]
    if (!entry) throw new Error(`No advanced goto input value?!`)
    //todo other event, set command goto target
    dispatch( dataSlice.action.setLinkGotoTarget(
      {
        pageId: props.pageId,
        parentId: props.commandBlock.id,
        selfId: props.id,
        data: entry,
      })
    )
  }


  function openPageFromGoto() {
    props.emitMessage("openNewPage", {target: props.data.gotoTarget})
  }


  if (window.DEBUG.log.props) window.DEBUG.doLogProps(props, "CommandEntryGoto")

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      width: 200,
    }),
  }

  let pageSelValue = {value: props.data.gotoTarget, label: props.data.gotoTargetName}
  
  const optionsPages = Object.values(state.pages).map(page => {
    //console.log(89, page.printedName)
    return {value: page.name, label: page.printedName}
  })


  return (
    <>
      <div className="flex items-center">
        <div>go to page:</div>

        <Creatable
          className="mr-2 ml-2"
          styles={customStyles}
          value={ pageSelValue }
          defaultValue={ pageSelValue }
          onCreateOption={onGotoCreateOption}
          onChange={onGotoInputChange}
          options={optionsPages}
          placeholder={"Choose page ..."}>
        </Creatable>

        <button
            onClick={openPageFromGoto}
            title="open this page now"
            className="
            rounded bg-gray-200 cursor-pointer hover:bg-gray-700
            hover:text-white ml-0 mr-2
            p-2">⇾
          </button>


      </div>
    </>
  )
}

export default CommandEntryGoto
 
