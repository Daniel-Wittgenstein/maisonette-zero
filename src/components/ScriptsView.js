
import {useDispatch} from 'react-redux'
import dataSlice from "../reducers/dataSlice"

import { useRef } from "react"
import { useSelector } from 'react-redux'

import SmartInput from './SmartInput.js'

import {useState} from "react"

//import GenericBoolChoice from './GenericBoolChoice.js'

function ScriptsView() {

  const [activeTab, setActiveTab] = useState(4)

  let state = useSelector(state => state.main)

  const customInput = useRef(null)

  const localInput = useRef(null)

  const dispatch = useDispatch()

  function updateInput(event) {
    let value = event.target.value
    dispatch( dataSlice.action.setHeadContents({
      data: value,
    }) )
  }


  function updateLocalInput(event) {
    let value = event.target.value
    updateLocal(value)
  }

  function updateLocal(value, confirmAlert = false) {
    let obj
    try {
      obj = JSON.parse(value)
    } catch(er) {
      alert(`No valid JSON. Localization was not updated. `+
        `(You probably forgot a comma or apostrophe somewhere.)`)
        return
    }
    dispatch( dataSlice.action.setLocalization({
      data: obj,
    }) )
    if (confirmAlert) {
      alert("Valid JSON. The localization was updated!")
    }
  }

  function updateLocalFromButton() {
    updateLocal(localInput.current.value, true)
  }

  //console.log("hallo", state, state.headContents)

  let localInputVal = JSON.stringify(state.localization, false, 4)

  let exampleText = `Health: {health} | Gold: {gold}`
  
  const inputStyle = {
    width: "240px"
  }
  
  const inputStyleSmall = {
    width: "110px"
  }
  
  const inputStyleSuperSmall = {
    width: "60px"
  }

  const unselectedTabStyle = `rounded bg-gray-200 cursor-pointer hover:bg-gray-700
    hover:text-white ml-2
    p-2`

  const selectedTabStyle = `
    rounded bg-blue-200
    ml-2
    p-2`


  return (
<>
  <div className="ml-3">
    <div className="mt-3">
      <button className={activeTab === 0 ? selectedTabStyle : unselectedTabStyle}
        onClick={() => setActiveTab(0)}>General</button>

      <button className={activeTab === 1 ? selectedTabStyle : unselectedTabStyle}
       onClick={() => setActiveTab(1)}>Settings</button>


      <button className={activeTab === 2 ? selectedTabStyle : unselectedTabStyle}
       onClick={() => setActiveTab(2)}>Localization</button>

      <button className={activeTab === 3 ? selectedTabStyle : unselectedTabStyle}
       onClick={() => setActiveTab(3)}>HTML</button>

      <button className={activeTab === 4 ? selectedTabStyle : unselectedTabStyle}
       onClick={() => setActiveTab(4)}>Status bar</button>


    </div>

    {activeTab === 0 && (
      <>
        <div className="m-4"><p className="bg-blue-400 p-2 text-white">Meta data:</p>
        </div>
        
        <SmartInput
          label="Title:"
          subLabel=""
          type="text"
          syncArray={["storySettings", "title"]}
          trim={true}
          simpleMode={true}
          style={inputStyle}
          ></SmartInput>

        <SmartInput
          label="Author:"
          subLabel=""
          type="text"
          syncArray={["storySettings", "author"]}
          trim={true}
          simpleMode={true}
          style={inputStyle}
          ></SmartInput>

        <SmartInput
          label="Genres:"
          subLabel=""
          type="text"
          syncArray={["storySettings", "genres"]}
          trim={true}
          simpleMode={true}
          style={inputStyle}
          ></SmartInput>

        <SmartInput
          label="Year of release:"
          subLabel=""
          type="number"
          min={1950}
          max={2999}
          syncArray={["storySettings", "year"]}
          trim={true}
          simpleMode={true}
          style={inputStyleSmall}
          ></SmartInput>
      </>
    )}





    {activeTab === 1 && (
      <>
      <div className="m-4"><p className="bg-blue-400 p-2 text-white">Story settings:</p>
      </div>

        <SmartInput
        label="Max. undo:"
        subLabel="Set to 0 to disable undo entirely."
        min={0}
        max={40}
        type="number"
        syncArray={["storySettings", "maxUndo"]}
        simpleMode={true}
        style={inputStyleSuperSmall}
        ></SmartInput>
      </>
    )}




   {activeTab === 2 && (
      <>
      <div className="m-4"><p className="bg-blue-400 p-2 text-white">Localization:</p>
      </div>
      
      <div className="m-4" style={{
        border: "0px solid #CCC"}}>
        <textarea
        spellCheck={false}
        className="p-1 border-2 border-gray-600 rounded-md mr-2 ml-2"
        style={{width: "95%", height: "40vh", overflow: "scroll"}}
        ref={localInput}
        onBlur={updateLocalInput}
        defaultValue={localInputVal}></textarea>
      </div>

      <button
          onClick={updateLocalFromButton}
          title="update localization"
          className="
          rounded bg-gray-200 cursor-pointer hover:bg-gray-700
          hover:text-white ml-2
          p-2">update localization
        </button>
      </>
    )}



    {activeTab === 3 && (
      <>
        <div className="m-4"><p className="bg-blue-400 p-2 text-white">Customize your HTML head here:</p>
        <p>(This can be used to add custom CSS to your story, to load external fonts,
          or even to include custom JavaScript.)
        </p>
        </div>
        <div className="m-4" style={{
          border: "0px solid #CCC"}}>
          <textarea
          spellCheck={false}
          className="p-1 border-2 border-gray-600 rounded-md mr-2 ml-2"
          style={{width: "95%", height: "70vh", overflow: "scroll"}}
          ref={customInput}
          onBlur={updateInput}
          defaultValue={state.headContents}></textarea>
        </div>
      </>
    )}


    {activeTab === 4 && (
      <>
        <div className="m-4"><p className="bg-blue-400 p-2 text-white">Status bar:</p>
        <p>Use braces to show variables. Example: {exampleText}
        </p>
        </div>
        <div className="m-4" style={{
          border: "0px solid #CCC"}}>

            <SmartInput
              label="Status bar:"
              subLabel=""
              type="text"
              syncArray={["storySettings", "statusBarContent"]}
              trim={true}
              simpleMode={true}
              style={inputStyle}
              ></SmartInput>


        </div>
      </>
    )}

  </div>
</>

  )
  
}


export default ScriptsView


/*
scrollback is not implemented, until it is (if ever), we do not
give the option to enable it, of course

      <GenericBoolChoice
        label="Scrollback:"
        subLabel="Scrollback on/off."
        optionOn="on"
        optionOff="off"
        propList={["storySettings", "scrollback"]}
        width={80}
        ></GenericBoolChoice>

      { 
        state.storySettings.scrollback
        &&
        <SmartInput
        label="Scrollback amount:"
        subLabel="Max. scrollback amount in items."
        min={1}
        max={40}
        type="number"
        propList={["storySettings", "maxScrollback"]}
        width={60}
        ></SmartInput>
      }



*/