
import { useRef } from "react"
import { useEffect } from 'react'

import MenuBarButton from './MenuBarButton'

import {useDispatch} from 'react-redux'
import dataSlice from "../reducers/dataSlice"

import { useSelector } from 'react-redux'

import {useState} from "react"

import PageView from './PageView'

import PlayViewAdvanced from './PlayViewAdvanced'

import HtmlTemplate from "../HTMLTemplate/HTMLTemplateAdvanced.js"

import AssetsView from "./AssetsView.js"

import ScriptsView from "./ScriptsView.js"

import Inkyficator from "../language-processing/inkify.js"

import upload from "../utils/upload.js"

import isVersionCompatible from "../utils/isVersionCompatible.js"

import CodeEditor from "./CodeEditor.js"

import stateToScript from "../maisonettescript/stateToScript.js"

import TestComponent from "./TestComponent.js"


//import Alert from "./Alert.js"



//import Processor from "../maisonettescript/processor.js"
//Processor.test()


const zoomLevels = [0.2, 0.33, 0.5, 0.6, 0.75, 0.85, 1.0, 1.15, 1.25, 1.5, 2.0]

let zoomFactor = 1
let currentZoomLevel = 6

//this should not be hard-coded, but currently it is:
const pageBoxWidth = 80 //super-important: if you change this, change it inside dataslice, too!!!
const pageBoxHeight = 32
let gridX = Math.round(pageBoxWidth * 1.2)
let gridY = Math.round(pageBoxHeight * 1.3)


const canvasX = 3600
const canvasY = 2400

let canvasCssWidth = canvasX
let canvasCssHeight = canvasY


/* 

  canvasBg: "#125ce5",
  canvasBg2: "#244ce5",
    grid: "#093787",
*/


const colors = {
  canvasBg: "#125ce5",
  canvasBg2: "#226cf5", //if checkered is on
  grid: "#093787",
  gridOn: true,
  checkered: false,

  boxBgSelected: "#72c6ff",
  boxBorderSelected: "#005384",

  boxBg: "#c5c7f9",
  boxBorder: "blue",

  boxBgSelectedStartingPage: "#7de0d6",
  boxBorderSelectedStartingPage: "#00e0e8",

  boxBgStartingPage: "#87f2a9",
  boxBorderStartingPage: "green",
  
  boxText: "#222",
  arrows: "#fff",

  chosenBorder: "#f00",

  startLabelBg: "#CCC",
  startLabelFg: "#0A0",
}


let selectedBox = false //for keeping track of dragged box and double-clicking on box
let selectedOffset = {}

let chosenBox = false //for keeping track which box has been clicked once (is highlighted)

let once = false

let setCanvasCssSize

let renderAll
  
let lastMouseClick = 0

const doubleClickThreshold = 500

function createNewPage(x, y, dispatch) {
  //x, y: pixel coordinates on StoryNetView map
  dispatch( dataSlice.action.createNewPage(
    {
      x: x,
      y: y,
    }))
}

function setPagePosition(box, x, y, dispatch) {
  dispatch( dataSlice.action.setPagePosition(
    {
      page: box.page,
      x: x,
      y: y,
    }))
}

function openPage(page, openedPage, setOpenedPage) {
  if (!page) throw Error(`Page target does not exist.`)
  console.log("opening", page, page.name)
  setOpenedPage(page.name) //broken. probably because it gets passed the original value???
}

function initEventHandlers(canvas, ctx, dragCtx, mainPanel, dispatch,
    openedPage, setOpenedPage) {

  if (once) return //because react development version loads twice
  once = true

  document.body.addEventListener("keypress", (event) => {
    
    //impossible to get correct value of openedPage for whatever reason,
    //don't even try. instead to prevent deleting pages from the story net view
    //when a page is open, we should always set selectedBox to false
    //when opening a page
    
    if (event.key === "Delete") {
      console.log("delete page, at box", chosenBox)
      if (!chosenBox) return
      dispatch( dataSlice.action.deletePage(
        {
          pageId: chosenBox.page.name, //sic
        }))
    }

  })

  canvas.addEventListener("mousedown", (event) => {
    if (!selectedBox && event.shiftKey) {
      let mouse = getMousePos(canvas, event)
      let x = Math.round ( (mouse.x - gridX / 2) / gridX ) * gridX
      let y = Math.round ( (mouse.y - gridY / 2) / gridY ) * gridY
      for (let box of boxes) {
        if (box.x === x && box.y === y) {
          //position is occupied
          return
        }
      }
      createNewPage(x, y, dispatch)
      //todo: chosenBox -> newly created box
      return
    }

    function updateView() {
      let mouse = getMousePos(canvas, event)
      selectedOffset.x = mouse.x - box.x
      selectedOffset.y = mouse.y - box.y
      if (selectedBox) selectedBox.invisible = false
      renderAllInternal(ctx)
      if (selectedBox) selectedBox.invisible = false
      dragCtx.clearRect(0, 0, canvasX, canvasY)
      renderBox(dragCtx, selectedBox, true)
    }

    let box = getHoveredBox(canvas, event)
    if (box) {
      document.body.style.cursor = 'move'
      selectedBox = box
      chosenBox = box
      updateView()

    } else {
      selectedBox = false
      chosenBox = false
      updateView()
    }
  })

  canvas.addEventListener("mouseup", (event) => {

    if (!selectedBox) return

    let time = + new Date()
    let diff = time - lastMouseClick
    lastMouseClick = time
    ////console.log("mouseup")

    if (diff <= doubleClickThreshold) {
      //double click:
      openPage(selectedBox.page, openedPage, setOpenedPage)
      selectedBox = false
      chosenBox = false
      return
    }

    document.body.style.cursor = 'default'
    let mouse = getMousePos(canvas, event)
    let x = mouse.x - selectedOffset.x
    let y = mouse.y - selectedOffset.y
    x = Math.round(x / gridX) * gridX
    y = Math.round(y / gridY) * gridY
    let positionChanged = true
    for (let box of boxes) {
      if (box.x === x && box.y === y) {
        positionChanged = false
        break
      }
    }
    if (positionChanged) {
      setPagePosition(selectedBox, x, y, dispatch)
    }

    selectedBox = false
    //dragCtx.clearRect(0, 0, canvasX, canvasY)
    //renderAllInternal(ctx)
  })

  canvas.addEventListener("mousemove", (event) => {
    if (selectedBox) {
      let mouse = getMousePos(canvas, event)
      selectedBox.x = Math.round(mouse.x - selectedOffset.x)
      selectedBox.y = Math.round(mouse.y - selectedOffset.y)
      dragCtx.clearRect(0, 0, canvasX, canvasY)
      renderBox(dragCtx, selectedBox, true)
    }
  })


}

function getHoveredBox(canvas, event) {
  let w = pageBoxWidth
  let h = pageBoxHeight
  let mouse = getMousePos(canvas, event)
  for (let box of boxes) {
    if (pointInsideRect(mouse.x, mouse.y,
      box.x, box.y, w, h)) {
        return box
    }
  }
  return false
}


function zoomTo(n) {
  zoomFactor = n
  let x = Math.round(zoomFactor * canvasX)
  let y = Math.round(zoomFactor * canvasY)
  setCanvasCssSize(x + "px", y + "px")
}

function zoomIn() {
  currentZoomLevel++
  if (currentZoomLevel >= zoomLevels.length) {
    currentZoomLevel = zoomLevels.length - 1
  }
  zoomTo(zoomLevels[currentZoomLevel])
}


function zoomOut() {
  currentZoomLevel--
  if (currentZoomLevel < 0) {
    currentZoomLevel = 0
  }
  zoomTo(zoomLevels[currentZoomLevel]) 
}


function StoryNetView() {  

  function save() {
    console.log("STATE SAVE", state)
    let p = JSON.stringify(state)

    ////let patch = JSON.parse(p) //quickly patch in property
    ////patch.sdadsdsdasda8383342j = []  //only for development
    ////p = JSON.stringify(patch)

    localStorage.setItem("std-save", p)
  }

  function exportStory() {
    let exportedFinal = true
    let html = HtmlTemplate(state, exportedFinal)
    if (html.error) {
      alert (`Error while exporting: ${html.msg}`)
      return
    }
    download("index.htm", html, "application/html") //what is the correct type here???
  }


  function exportToInk() {
    let sourceCode = Inkyficator.convertToInk(state)
    //console.log("FINAL INK SOURCE CODE", sourceCode)
    download("story.ink", sourceCode, "text") //what is the correct type?
  }


	function download (filename, text, dataType = "application/json") {
		let blob = new Blob([text], {type: dataType + ";charset=utf-8"})
		saveAs(blob, filename)
	}

  function saveAs(blob, filename) {
    /* This isn't a waterproof way to do it in all browsers,
    but we only go for major/modern browsers. This must still be tested
    and if it fails on modern/mainstream browsers, it should be patched accordingly. */

    let a = document.createElement('a')
    a.download = filename
    a.rel = 'noopener' //do not open tabs
    a.href = URL.createObjectURL(blob)
    setTimeout(function () { URL.revokeObjectURL(a.href) }, 4E4) // 40s
    setTimeout(function () { a.click() }, 0)
  }


  function quickHelp() {
    const text = `
    - double click page to open it
    - single click page to select it
    - drag page to move it around
    - click on page to select it and press delete key to delete the page 
    - click + shift on a free grid position to create a new page
    `

    alert (text)
  }



  function playToggle() {
    closePlayView()
    if (openedPlayView) {
      closePlayView()
      return
    }
    openPlayView()
  }

  const dispatch = useDispatch()
  const dragCanvas = useRef(null)
  const myCanvas = useRef(null)
  const bgCanvas = useRef(null)
  const mainPanel = useRef(null)
  const mainStoryNetViewRef = useRef(null)
  
  let state = useSelector(state => state.main)

  //if (window.DEBUG.log.props) window.DEBUG.doLogProps(props, "StoryNetView")

  const [openedPage, setOpenedPage] = useState("")

  const [openedPlayView, setOpenedPlayView] = useState(false)

  const [openedAssetsView, setOpenedAssetsView] = useState(false)

  const [openedScriptsView, setOpenedScriptsView] = useState(false)

  const [openedCodeWindow, setOpenedCodeWindow] = useState("")


  //console.log("story net view, state is", state)

  boxes = []

  window.splitLabelTextIntelligently = splitLabelTextIntelligently

  function splitLabelTextIntelligently(text, sep = " ", startAt = false) {
    /* Not that intelligent, but here's what it actually does:
    the function tries to split a string into two roughly equally sized parts,
    keeping words on the same line if possible. returns false
    if separator symbol (normally space) is not found or
    if splitting fails for some other reason. Otherwise returns
    array with two strings, containing the two separated parts of the string.
    1. string
    2. separator character
    3. start at this index or falsy for: start in the middle of the string*/
    let start = startAt 
    if (!startAt) start = Math.round(text.length / 2)
    let i = start
    let j = start
    while(true) {
      let char
      for (let a = 0; a < 2; a++) {
        let x
        if (!a) {
          i--
          if (i < 0) return false
          x = i
        } else {
          j++
          if (j > text.length - 1) return false
          x = j
        }
        char = text[x]
        if (char === sep) {
          return [
            text.substring(0, x),
            text.substr(x),
          ]
        }
      }
    }
  }


  //errr ... shouldn't this be wrapped into some kind of useeffect or other hook?
  //not changed yet, because it seems to work and we don't want to break it.
  //noted for review, though:
  let myBoxes = {}
  
  Object.values(state.pages).forEach(page => {
    if (!page) return
    let label = page.printedName
    let label2 = false

    const maxLength = 12

    if (label.length > maxLength) {
      let parts = splitLabelTextIntelligently(label)
      if (!parts) {
        //if no way to split label properly, just split it crudely in half:
        let mid = Math.round(label.length / 2)
        label2 = label.substr(mid)
        label = label.substr(0, mid)
      } else {
        label = parts[0]
        label2 = parts[1]
      }
    }

    let newBox = addBox(page.storyNetViewX, page.storyNetViewY, label, label2, page,
      state.startPage === page.name)
    myBoxes[page.name] = newBox
  })


  //update arrows:
  for (let box of Object.values(myBoxes)) {
    let id = box.page.name
    //console.log("box", id)
    let targets = state.pageTargets[id]
    if (targets) {
      for (let target of targets) {
        //console.log(2, target)
        let id = target.targetPageId
        addConnection(box, myBoxes[id])
      }
    }
  }

  function clickScripts() {
    setOpenedScriptsView(true)
  }

  function closeScriptsView() {
    setOpenedScriptsView(false)
  }


  function clickLoad() {

    upload( (content, name, size) => {
      let parsed
      try {
        parsed = JSON.parse(content)
      } catch(err) {
        alert("This does not seem to be a valid save file.")
        return
      }

      if ( !isVersionCompatible(parsed.version, state.version) ) {
        alert(`This save file has a version number of `+
          `${parsed.version}. That is not compatible with ${state.shortAppName} ` +
          `version ${state.version}`
        )
        return
      }

      dispatch( dataSlice.action.loadAppState({
        content: content,
      }))
    }, (msg) => {
      //error happened (could not read file or similar):
      alert(msg)
    }, "readAsText")
  }

  function clickSave() {
    let argonauts = JSON.stringify(state)
    download("save.mai", argonauts, "application/json") //what is the correct type here???
  }

  function clickInfo() {
    const msg = `${state.longAppName} - version ${state.version} - ` + 
      `release date: ${state.releaseDate}`
    dispatch( dataSlice.action.notify({
      msg,
      duration: 240_000,
      intent: "inform",
    }) )
  }

  function clickAssets() {
    setOpenedAssetsView(true)
  }

  function closeAssetsView() {
    setOpenedAssetsView(false)    
  }

  function clickCode() {
    setOpenedCodeWindow(true)
  }

  useEffect(() => {
    //run on each rerendering:
    //console.log("rerendering all", renderAll)
    if (renderAll) renderAll()
  })
  

  useEffect(() => {
    // on component mount:

    let bgCtx
    let canvas
    let ctx
    let backgroundCanvas
    let dragCtx
    let dragCanvasEl

   
    setCanvasCssSize = (w, h) => {
      let canvases = [backgroundCanvas, dragCanvasEl, canvas]
      for (let canv of canvases) {
        canv.style.width = w
        canv.style.height = h
      }
    }

    //drag canvas:
    dragCanvasEl = dragCanvas.current
    dragCtx = dragCanvasEl.getContext("2d")

    //bg canvas:
    backgroundCanvas = bgCanvas.current
    bgCtx = backgroundCanvas.getContext("2d")
    bgCtx.clearRect(-2, -2, canvasX, canvasY) //needed for react hot reload
    renderGrid(bgCtx, gridX, gridY,
      - (gridX - pageBoxWidth) / 2,
      - (gridY - pageBoxHeight) / 2)

    //standard canvas:
    canvas = myCanvas.current
    ctx = canvas.getContext("2d")
    ctx.clearRect(-2, -2, canvasX, canvasY) //needed for react hot reload
    let contexts = [ctx, dragCtx]
    for (let ctx of contexts) {
      ctx.lineWidth = 1
      ctx.textAlign = "center"
      ctx.font = "12px sans-serif"
      ctx.textBaseline = 'middle'  
    }



    initEventHandlers(canvas, ctx, dragCtx, mainPanel, dispatch
      , openedPage, setOpenedPage)

    renderAll = () => renderAllInternal(ctx, dragCtx)

    zoomTo(1)

    renderAll()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) //if warning about missing usedispatch dependency shows up,
    //ignore it! we want empty array here.

  let thePlayView = null
  
  if (openedPlayView) {
    thePlayView = (<PlayViewAdvanced></PlayViewAdvanced>)
  }

  let mainButtons = null

  mainButtons =  (
    <div className="flex">
      <MenuBarButton action={zoomIn} icon="zoom_in" text="Zoom +"></MenuBarButton>
      <MenuBarButton action={zoomOut} icon="zoom_out" text="Zoom -"></MenuBarButton>
      <MenuBarButton icon="note_add" action={() => createNewPage(false, false, dispatch)}
        text="New Page"></MenuBarButton>
    </div>
  )


  let mainStoryNetView = null

  mainStoryNetView = (
    <div ref={mainStoryNetViewRef} style={{overflow: "hidden"}}>
      <div className="bg-gray-700 flex" style={{height: "32px", userSelect: "none",}}>



      {
        openedPlayView
        ?
        <MenuBarButton action={playToggle} text="edit the story" icon="edit"></MenuBarButton>
        :
        <>

          <MenuBarButton action={playToggle} text="play" icon="play_circle"></MenuBarButton>
          
          <MenuBarButton action={undo} text="Undo" icon="undo"></MenuBarButton>

          <MenuBarButton action={clickLoad} text="load" icon="file_upload"></MenuBarButton>
          <MenuBarButton action={clickSave} text="save" icon="file_download"></MenuBarButton>


          <MenuBarButton action={clickAssets} text="assets" icon="image"></MenuBarButton>


          <MenuBarButton action={clickScripts} text="story settings" icon="import_contacts"></MenuBarButton>

          <MenuBarButton action={exportStory} text="export" icon="exit_to_app"></MenuBarButton>

          <MenuBarButton action={clickInfo} text="info" icon="info"></MenuBarButton>

          <MenuBarButton action={clickCode} text="code" print="" icon="code"></MenuBarButton>

          <MenuBarButton action={save} print="devsav" text="save (to localStorage, only for developer)"></MenuBarButton>

          <MenuBarButton action={() => {
            stateToScript.convert(state)
          }} print="tsttrans" text="test transpilation"></MenuBarButton>

          <MenuBarButton print = "devlog" action={
            () => {
              console.log(state)
              //console.log(JSON.stringify(state, null, 2))
            }
          } text="debug: log store state"></MenuBarButton>
          <MenuBarButton print = "devhelp" action={quickHelp} text="quick help"></MenuBarButton>
        </>
      }

      </div>

      {thePlayView}

      <div ref={mainPanel} className="dark-scrollbars border-2 border-gray-700"
        style={{
          height: "calc(100vh - 64px)", overflow: "scroll"}}>

        <div style={{position: "relative"}}>
          <canvas
            style={{position: "absolute", width: {canvasCssWidth}, height: {canvasCssHeight}
              }}
            ref={dragCanvas} width = {canvasX} height = {canvasY}></canvas>

          <canvas
            style={{position: "absolute", width: {canvasCssWidth}, height: {canvasCssHeight}
              }}
              
            ref={myCanvas} width = {canvasX} height = {canvasY}></canvas>

          <canvas
            style={ { width: {canvasCssWidth}, height: {canvasCssHeight} } }
            ref={bgCanvas} width = {canvasX} height = {canvasY}></canvas>

        </div>

      </div>

      <div className="
          bg-gray-700 flex-start flex
        " style={{height: "32px", userSelect: "none",}}>
          {mainButtons}
      </div>

    </div>
  )

  function undo() {
    dispatch( dataSlice.action.undo() )
  }

  function redo() {
    dispatch( dataSlice.action.redo() )
  }

  function closePage() {
    setOpenedPage("")
  }

  function requestPageClose() {
    //open page requests to be closed
    closePage()
  }

  function openPlayView() {
    setOpenedPlayView(true)
  }

  function closePlayView() {
    setOpenedPlayView(false)
  }

  function emitMessage(type, data) {
    if (type === "openNewPage") {
      let page = state.pages[data.target]
      if (!page) return
      openPage(page, openedPage, setOpenedPage)
    } else {
      throw new Error(type + ` emitMessage: unknown message type`)
    }
  }

  let elPageView = null  

  if (openedPage) {
    let pageName = openedPage
    let page = state.pages[pageName]
    elPageView = (
      <div style={{position: "fixed", overflow: "scroll", top: "0px",
        left: "0px", height: "100vh", zIndex: "1000", background: "white",
        width: "100vw", }}>
        <div className="bg-gray-700 flex" style={{
          height: "32px", userSelect: "none",
          position: "fixed", zIndex: "16000", width: "100%",
          }}>
          <MenuBarButton action={closePage}  icon="close" text="close"></MenuBarButton>
          <MenuBarButton action={undo} icon="undo" text="Undo"></MenuBarButton>
        </div>
        
        <PageView requestSelfClose={requestPageClose} pageId={pageName} page={page}
          emitMessage={emitMessage}></PageView>
      </div>
    )
  }

  let elAssetsView = null  

  if (openedAssetsView) {
    elAssetsView = (
      <div style={{position: "fixed", overflow: "scroll", top: "0px",
        left: "0px", height: "100vh", zIndex: "1000", background: "white",
        width: "100vw", }}>
        <div className="bg-gray-700 flex" style={{height: "32px", userSelect: "none"}}>
          <MenuBarButton action={closeAssetsView} icon="close" text="close"></MenuBarButton>
          <MenuBarButton action={undo} icon="undo" text="Undo"></MenuBarButton>
        </div>
        
        <AssetsView
          requestSelfClose={requestPageClose}
          emitMessage={emitMessage}>
        </AssetsView>
      </div>
    )
  }

  let elScriptsView = null  

  if (openedScriptsView) {
    elScriptsView = (
      <div style={{position: "fixed", overflow: "scroll", top: "0px",
        left: "0px", height: "100vh", zIndex: "1000", background: "white",
        width: "100vw", }}>
        <div className="bg-gray-700 flex" style={{height: "32px", userSelect: "none"}}>
          <MenuBarButton action={closeScriptsView} text="close" icon="close"></MenuBarButton>
        </div>
        <ScriptsView
          requestSelfClose={requestPageClose}
          emitMessage={emitMessage}>
        </ScriptsView>
      </div>
    )
  }

  let codeEditorWindow = null

  if (openedCodeWindow) {
    codeEditorWindow = (<CodeEditor closeSelf={() => {
      setOpenedCodeWindow(false)
    }}></CodeEditor>)
  }

  return (
    <>

      <TestComponent></TestComponent>

      {codeEditorWindow}

      {elScriptsView}
      
      {elAssetsView}

      {elPageView}

      {mainStoryNetView}

    </>
  )
}



function drawArrow(ctx, fromx, fromy, tox, toy, headAngle = 0.82, headLength = 12,
  cutOffBegin = 0, cutOffEnd = 0) {
  ctx.strokeStyle = colors.arrows
  ctx.beginPath()


  let orgAngle = Math.atan2(toy - fromy, tox - fromx)
  let angle =  orgAngle + Math.PI * headAngle
  let angle2 = orgAngle - Math.PI * headAngle

  fromx += Math.cos(orgAngle) * cutOffBegin
  fromy += Math.sin(orgAngle) * cutOffBegin

  tox -= Math.cos(orgAngle) * cutOffEnd
  toy -= Math.sin(orgAngle) * cutOffEnd

  ctx.moveTo(fromx, fromy)
  ctx.lineTo(tox, toy)

  let len = headLength
  let x = tox + Math.cos(angle) * len
  let y = toy + Math.sin(angle) * len
  let x2 = tox + Math.cos(angle2) * len
  let y2 = toy + Math.sin(angle2) * len
  ctx.moveTo(tox, toy)
  ctx.lineTo(x, y)
  ctx.moveTo(tox, toy)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function drawBox(ctx, x, y, w, h, label, label2, selectedStyle, isStartingPage,
  chosenStyle) {

  if (selectedStyle) {
    ctx.strokeStyle = colors.boxBorderSelected
    ctx.fillStyle = colors.boxBgSelected
    if (isStartingPage) {
      ctx.strokeStyle = colors.boxBorderSelectedStartingPage
      ctx.fillStyle = colors.boxBgSelectedStartingPage
    }
  } else {
    ctx.strokeStyle = colors.boxBorder
    ctx.fillStyle = colors.boxBg
    if (isStartingPage) {
      ctx.strokeStyle = colors.boxBorderStartingPage
      ctx.fillStyle = colors.boxBgStartingPage
    }
  }
  ctx.fillRect(x, y, w, h)
  ctx.strokeRect(x, y, w, h)
  let maxWidth = w
  ctx.fillStyle = colors.boxText //text

  if (!label2) {
    ctx.fillText(label, x + w / 2, y + h / 2, maxWidth)
  } else {
    ctx.fillText(label, x + w / 2, y + h / 2 - 7, maxWidth)
    ctx.fillText(label2, x + w / 2, y + h / 2 + 7, maxWidth)
  }


  if (isStartingPage) {
    ctx.fillStyle = colors.startLabelBg
    ctx.fillRect(x + w * 0.55, y - h * 0, w * 0.4, h * 0.5)
    ctx.fillStyle = colors.startLabelFg
    ctx.fillText("start", x + w * 0.75, y + h * 0.25, maxWidth)
  }

  if (chosenStyle) {
    ctx.strokeStyle = colors.chosenBorder
    ctx.strokeRect(x, y, w, h)
  }
}

function getMousePos(canvas, event) {
  let rect = canvas.getBoundingClientRect()
  let scaleX = canvas.width / rect.width
  let scaleY = canvas.height / rect.height
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  }
}

function pointInsideRect(px, py, rx, ry, rw, rh) {
  return (
    px >= rx && px <= rx + rw &&
    py >= ry && py <= ry + rh
  )
}

let boxes = []

function addBox(x, y, label, label2, page, isStartingPage) {
  let box = { x: x, y: y, label: label, label2: label2, page: page,
    connections: [], isStartingPage: isStartingPage}
  boxes.push(box)
  return box
}

function addConnection(box1, box2) {
  box1.connections.push(box2)
}

function renderAllInternal(ctx, dragCtx) {
  //console.log("internal rendering to", ctx)
  ctx.clearRect(0, 0, canvasX, canvasY)
  if (dragCtx) dragCtx.clearRect(0, 0, canvasX, canvasY)
  renderArrows(ctx)
  renderBoxes(ctx)
}

function renderArrows(ctx) {
  for(let box of boxes) {
    if (box.invisible) continue
    for (let connectedBox of box.connections) {
      if (!connectedBox) continue
      if (connectedBox.invisible) continue
      renderArrow(ctx, box, connectedBox)
    }
  }
}


function getArrowPosition(box, box2) {
  //sx/sy: startx/starty tx/ty: targetx/targety

  const w = pageBoxWidth
  const h = pageBoxHeight
  const wh = pageBoxWidth / 2
  const hh = pageBoxHeight / 2

  let sx, sy, tx, ty
  const tolerance = 140
  const toleranceY = 80

  let exactHorizontalAlignment = (box.y === box2.y)

  let exactVerticalAlignment = (box.x === box2.x)

  let r = {}

  if (exactHorizontalAlignment) {
    if (box.x < box2.x) {
      //box is directly to the left of box2
      r.sx = box.x + w
      r.sy = box.y + hh
      r.tx = box2.x
      r.ty = box2.y + hh
      return r
  
    } else {
      //box is directly to the right of box2
      r.sx = box.x
      r.sy = box.y + hh
      r.tx = box2.x + w
      r.ty = box2.y + hh
    }
    return r
  }

  if (exactVerticalAlignment) {
    if (box.y < box2.y ) {
      //box is directly above box2
      r.sx = box.x + wh
      r.sy = box.y + h
      r.tx = box2.x + wh
      r.ty = box2.y
    } else {
      //box directly below box2
      r.sx = box.x + wh
      r.sy = box.y
      r.tx = box2.x + wh
      r.ty = box2.y + h
    }
    return r
  }

  let prettyMuchHorizontallyAligned =
    (box.y + toleranceY >= box2.y && box.y - toleranceY <= box2.y)

  let prettyMuchVerticallyAligned =
    (box.x + tolerance >= box2.x && box.x - tolerance <= box2.x)

  if (prettyMuchHorizontallyAligned) {
  
    if (box.x < box2.x) {
      //box is directly (with tolerance) to the left of box2
      r.sx = box.x + w
      r.sy = box.y + hh
      r.tx = box2.x
      r.ty = box2.y + hh
      return r
  
    } else {
      //box is directly to the right of box2
      r.sx = box.x
      r.sy = box.y + hh
      r.tx = box2.x + w
      r.ty = box2.y + hh
    }
    return r
  }
  
  if (prettyMuchVerticallyAligned) {
    if (box.y < box2.y ) {
      //box is directly (with tolerance) above box2
      r.sx = box.x + wh
      r.sy = box.y + h
      r.tx = box2.x + wh
      r.ty = box2.y
    } else {
      //box directly below box2
      r.sx = box.x + wh
      r.sy = box.y
      r.tx = box2.x + wh
      r.ty = box2.y + h
    }
    return r
  }
  

  let left = (box.x < box2.x)
  let above = (box.y < box2.y)

  if (left && above) {
    // going right and down
    r.sx = box.x + w
    r.sy = box.y + h
    r.tx = box2.x
    r.ty = box2.y
  } else if (!left && above) {
    // going left and down
    r.sx = box.x
    r.sy = box.y + h
    r.tx = box2.x + w
    r.ty = box2.y
  } else if (left && !above) {
    //going right and up
    r.sx = box.x + w
    r.sy = box.y
    r.tx = box2.x
    r.ty = box2.y + h
  } else if (!left && !above) {
    //going left and up
    r.sx = box.x
    r.sy = box.y
    r.tx = box2.x + w
    r.ty = box2.y + h
  }

  return r
  
}


function renderArrow(ctx, box, box2) {


  if (box === box2) return


  let pos = getArrowPosition(box, box2)

  //fast, crude distance, no slow Pythagoras:
  let dist = Math.abs(box2.x - box.x) + Math.abs(box2.y - box.y)

  let headLength = 8
  let headAngle = 0.87
  let cutOffBegin = 10
  let cutOffEnd = 10

  if (dist < 200) {
    headLength = 5
    headAngle = 0.82
    cutOffBegin = 0
    cutOffEnd = 0
  }

  drawArrow(ctx, pos.sx, pos.sy,
    pos.tx, pos.ty, headAngle, headLength, cutOffBegin, cutOffEnd)
}

function renderBoxes(ctx) {
  for (let box of boxes) {
    if (box === selectedBox) {
      continue
    }
    renderBox(ctx, box)
  }
}

function renderBox(ctx, box, selectedStyle = false) {
  if (box.invisible) return
  let w = pageBoxWidth
  let h = pageBoxHeight
  drawBox(ctx, box.x, box.y, w, h, box.label, box.label2, selectedStyle, box.isStartingPage,
    box === chosenBox)
}

function renderGrid(ctx, gx, gy, offsetX, offsetY) {
  let w = canvasX
  let h = canvasY
  ctx.fillStyle = colors.canvasBg
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = colors.grid
  ctx.lineWidth = 1
  let ax = Math.floor(w / gx)
  let ay = Math.floor(h / gy)
  let p = false
  ctx.fillStyle = colors.canvasBg2
  for (let x = 0;  x < ax; x++) {
    for (let y = 0;  y < ay; y++) {
      p = !p
      if (!p) {
        if (colors.checkered) ctx.fillRect(x * gx + offsetX, y * gy + offsetY, gx, gy)
      }
      if (colors.gridOn) ctx.strokeRect(x * gx + offsetX, y * gy + offsetY, gx, gy)
    }
  }
}

export default StoryNetView

