
//import { useSelector } from 'react-redux'

import CommandBlock from './CommandBlock.js'

import { useEffect } from 'react'

import SetAsStartPageButton from './SetAsStartPageButton.js'

import { useSelector } from 'react-redux'

import {useState} from "react"

import {useDispatch} from 'react-redux'
import dataSlice from "../reducers/dataSlice"

import { useRef } from "react"

//import GenericButton from "./GenericButton.js"

let currentPageNameTempValue = ""

function PageView(props) {

  //console.log("page view", props)

  if (window.DEBUG.log.props) window.DEBUG.doLogProps(props, "PageView")

  const state = useSelector(state => state.main)

  const dispatch = useDispatch()
  const pageNameInputField = useRef(null)

  const [editingPageName, setEditingPageName] = useState(false)
  
  const [firstTime, setFirstTime] = useState(true)

  let pageNameDisplay1 = !editingPageName ? "flex" : "none"

  let pageNameDisplay2 = editingPageName ? "flex" : "none"

  const pageId = props.pageId
  const page = props.page

  //const [pageName, setPageName] = useState(page.printedName) //this is utter bollocks.
  //it never updates properly when new page is opened. do we even need state here?
  //why not pass it down as props?? this makes it so that page printedName never updates
  //when opening a new page via the option input. look for all lines with "todo" and "pageName"
  //and refactor this.

  let pageName = page.printedName

  let commandBl = page.commandBlock

  useEffect(() => {
    //run after each render IF and only if editingPageName has changed:

    if (firstTime) {
      setFirstTime(false)
      return
    }

    if (editingPageName) {
      pageNameInputField.current.focus()
    } else {
      let val = currentPageNameTempValue
      val = val.trim()
      console.log(8, currentPageNameTempValue)
      if (val === "") val = "a nameless page"
      dispatch( dataSlice.action.setPageName(
        {
          pageId: props.pageId,
          newName: val,
        })
      )
    }
  }, [editingPageName])


  function handlePageNameKeyPress(event) {
    if (event.key === "Enter") {
      finishEditingPageName()
    }
  }

  
  function handlePageNameChange(event) {
    let val = event.target.value
    currentPageNameTempValue = val
    console.log("sync", currentPageNameTempValue)
  }


  function clickFinishEditingPageName(event) {
    finishEditingPageName()
  }

  function finishEditingPageName() {
    setEditingPageName(false)
  }

  function clickEdit() {    
    currentPageNameTempValue = page.printedName
    pageNameInputField.current.value = currentPageNameTempValue
    setEditingPageName(true)
  }


  function clickDelete() {
    props.requestSelfClose()
    
    dispatch( dataSlice.action.deletePage(
      {
        pageId: page.name, //sic
      }))
  }



  if (!page) {
    //this error actually happens if you create page, open it, then click undo
    //should not throw error in that case, just close page and maybe inform
    //player that they just deleted the page
    throw new Error(`Page id "${pageId}", but there is not page with this id.`)
  }

  //console.log("%c ##############", "background: yellow")
  //console.log("PAGE VIEW", props)


  let resultJSX = (
    <>


      <div className="m-4 mt-8 border-2 border-gray-200 rounded-md p-2">

        <div>
          
          <div className="flex flex-row items-center"
              style={{display: pageNameDisplay1}}>
            <p>{pageName}</p>
          
            <button className="m-4 border-2 border-gray-200 rounded-md p-2"
              onClick={clickEdit}
              >edit page name
              </button>

            <SetAsStartPageButton pageId={pageId}
            isStartPage={state.startPage === pageId}></SetAsStartPageButton>

            <button className="m-4 border-2 border-gray-200 rounded-md p-2"
              onClick={clickDelete}
              >delete this page</button>

          </div>

          <div className="flex flex-row items-center"
              style={{display: pageNameDisplay2}}>
            <input ref={pageNameInputField}
              spellCheck={false}
              style={{height: "1.5rem"}}
              className="p-1 border-2 border-gray-600 rounded-md"
              defaultValue={currentPageNameTempValue}
              maxLength={48}
              onKeyPress={handlePageNameKeyPress}
              onChange={handlePageNameChange}>
            </input>

            <button  className="m-4 border-2 border-gray-200 rounded-md p-2
            
            "
              onClick={clickFinishEditingPageName}
              >OK</button>
          </div>

        </div>


        <CommandBlock
          emitMessage={props.emitMessage}
          lastChoiceText={"pageStart"}
          parent={page}
          commandBl={commandBl}
          pageId={pageId} level={1}></CommandBlock>
      </div>
    </>
  )

  //console.log(resultJSX)

  return resultJSX

}



export default PageView