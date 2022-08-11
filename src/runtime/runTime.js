

window.runTime = (function() {

  //window.vr stores the story author's global variables
  

  function updateDevVarsView() {
    let el = document.getElementById("var-shower")
    el.value = ""
    let out = "VARIABLES:\n"
    for (let key of Object.keys(vrInternal)) {
      out += `${key}: ${vrInternal[key]}\n`
    }
    el.value = out
  }

  let vrInternal = {}

  const vrHandler = {
    set(target, key, value) {
      target[key] = value
      console.log(`%c Variable ${key} has been set to: ` + value +" ",
        "background: orange; color: #222; border: 4px solid #777;")
      updateDevVarsView()
    }
  }

  window.vr = new Proxy(vrInternal, vrHandler)

  let story

  let outputContainer

  let guardLastChoiceSelectTime = -1

  let guardLastChoiceIterations = 0

  const guardMaxTimeWithoutChoiceSelect = 50 //after this many milliseconds
    //without user selecting a choice, an infinite loop error is thrown (if
    //and only if gotoPage keeps getting called and reaches
    //at least guardLastChoiceIterationsMax)

  const guardLastChoiceIterationsMax = 20

  function reinitGuard() {
    guardLastChoiceIterations = 0
    guardLastChoiceSelectTime = + new Date()
  }


  function goToPage(id, trigger) {
    //trigger should be "user_action", "start_up" or "developer_action"

    if (trigger !== "developer_action") {
      //reinit guard if the goToPage was triggered at game start,
      //or on a user click (but not if the goToPage was triggered programmatically,
      //for example via a goto command, we call that a "developer_action")
      reinitGuard()
    }

    let time = + new Date()

    let elapsed
    
    if (guardLastChoiceSelectTime < 0) {
      elapsed = 0
    } else {
      elapsed = time - guardLastChoiceSelectTime
    }

    guardLastChoiceIterations++

    if (
      guardLastChoiceIterations >= guardLastChoiceIterationsMax &&
      elapsed >= guardMaxTimeWithoutChoiceSelect) {
      let s = Math.floor(elapsed / 10) / 100
      storyError(s + ` seconds without user interaction have passed
      and a "go to page" instruction has been called
      ${guardLastChoiceIterations} times. The story seems
      to be stuck in an infinite loop. You probably used a "go to" command that loops back
      to the same page it is on, or some similar mistake.`)
      return
    }


    let page = story.pages[id]
    if (!page) storyError(`No valid page: "${id}"`)
    //console.log("GOING TO PAGE " + id + ":", page.printedName, page)
    console.log(`%c GOING TO PAGE: "${page.printedName}"`,
      "background: green; color: white; border: 4px solid #777;")
    if (!page.commandBlock.commands || ! page.commandBlock.commands.length) {
      say(`Page ${page.printedName} is empty.`)
      return
    }

    execCommandBlock(page.commandBlock, page)
  }


  function execCommandBlock(commandBlock, page) {
    for (let command of commandBlock.commands) {
      if (command.data.ifConditionContent) {
        let cond = command.data.ifConditionContent()
        if (!cond) continue
      }
      let result = doCommand(command, page)
      //goto stops everything down the line from running:
      //so does endStory:
      if (result && result.abortRunning) {
        return
      }
    }

    let choices = commandBlock.links

    if (!choices || !choices.length) {
      searchGather(commandBlock, page)
      return
    }

    for (let choice of choices) {
      doChoice(choice, commandBlock, page)
    }
  }




  function preProcessGathersParentsDo(state) {
    /* The Redux store holds the information which
    GUI element has which parent only in the form of string ids.
    (Because if it would keep that info as object references, we would
      have a circular, non-JSONifiable structure.)
    Here we need to resolve that information and actually
    remember the parent references as real references to objects.
    The parent information is needed for gathers to work.
    This is potentially a rather slow process, because it requires
    recursively traversing trees. Test with huge dataset and see
    if we need to optimize it.

    This function modifies objects inside state directly.
    */

    function findGather(element) {
      if (element.parentObj && element.parentObj.isGather) {
        //console.log(element, "IS INSIDE GATHER")
        element = element.parentObj.parentObj
      }
      while (true) {
        element = element.parentObj
        //console.log("find gather is working through:", element, element.gather)
        if (element.gather) {
          return element.gather
        }
        if (!element) return element
      }
    }

    //############

    for (let page of Object.values(state.pages)) {

      walkTree(page, (element, parent) => {
        element.parentObj = parent
        return false
      })

      walkTree(page, (element, parent) => {
        if (element.isCommandBlock && (!element.links || !element.links.length) ) {
          element.assocGather = findGather(element)
        }
      })      
    }

    return state
  }

  function preprocessStateForStory(state) {
    preProcessGathersParentsDo(state)
    return state
  }

  function searchGather(startingCommandBlock, page) {

    if (!startingCommandBlock.assocGather) {
      storyError ("Story flow runs out.")
      return
    }

    execCommandBlock(startingCommandBlock.assocGather.commandBlock)  

  }

  function say(text) {
    output({
      type: "text",
      text: text,
    })
  }

  
  let lastClickTime



  function renderChoice(choice, parentCommandBlock, page) {

    let sanitizedChoiceObj = {
      data: JSON.parse(JSON.stringify(choice.data)),
      id: choice.id,
      mode: choice.mode,
      type: "choice",
    }

    output({type: "choice", choice: sanitizedChoiceObj,
      parentCommandBlockId: parentCommandBlock.id, pageId: page.id})
  }

  function removeChoices() {
    document.querySelectorAll(".story-choice").forEach(n => n.remove())
  }

  function removeChoicesFromOutputStream(stream) {
    stream.content = stream.content.filter(n => n.type !== "choice")
    //console.log(stream.content)
  }




  function cls() {
    let el = document.getElementById("story-main")
    el.innerHTML = ""
  }

  let lastTurnSeparator = null

  let undoStates = []

  function selectChoice(choice, parentCommandBlockId, pageId) {

    let page = story.pages[choice.data.pageName]

    let parentCommandBlock = getTreeElementById(page, parentCommandBlockId)
    
    choice = getTreeElementById(page, choice.id)


    let state = getStoryState()
    
    if (story.storySettings.maxUndo) {
      undoStates.push(state)
      while (undoStates.length > story.storySettings.maxUndo) {
        undoStates.shift()
      }
    }

    if (!story.storySettings.scrollback) {
      cls()
      outputStreams[currentOutputStream].content = []
    }
    
    performDomUpdates()

    removeChoices()
    removeChoicesFromOutputStream(outputStreams[currentOutputStream])
    if (choice.mode === "goto") {
      goToPage(choice.data.gotoTarget, "user_action")
    } else if (choice.mode === "sub") {
      execCommandBlock(choice.commandBlock, page)
    } else if (choice.mode === "nothing") {
      searchGather(parentCommandBlock, page)
    }
  }


  function performDomUpdates() {
    /* perform updates
    bring dom up to date, cancel timers etc.
    called after:
      - undo
      - select choice
      - story restart
      - page first load
      - load story
    */
    clearTimeouts()
    updateUndoButtonLook()
    clearStreamTransitionTimer(outputStreams[currentOutputStream])
    document.body.scrollTop = 0
  }
  
  function clearTimeouts() {
    for (let t of timeouts) {
      clearTimeout(t)
    }
    timeouts = []
  }

  const commandsExec = {}

  commandsExec.text = (command, page) => {
    if (command.data.text) {
      say(command.data.text)
    }
    return false
  }

  commandsExec.goto = (command, page) => {
    console.log(command, "GOTO")
    goToPage (command.data.gotoTarget, "developer_action")
    return {
      abortRunning: true
    }
  }

  commandsExec.image = (command, page) => {
    let id = command.data.assocAssetId
    //let data = story.assets[id].data
    if (!id) console.log("Image has no data?")
    let clas = command.data.cssClasses || ""
    let position = "centered" //left or right would be okay, too, but currently
    //no way to set that in the GUI
    output({
      type: "image",
      position: position,
      cssClasses: clas,
      assetId: id,
    })
    return false
  }

  commandsExec.endStory = (command, page) => {
    return {
      abortRunning: true
    }
  }

  commandsExec.set = (command, page) => {
    if (command.data && command.data.content) {
      try {
        command.data.content()
      } catch(err) {
        throw `set command function threw error.`
        return false
      }
    }
    return false
  }



  function doCommand(command, page) {
    //return falsey to continue running. return 
    //{ abortRunning: true } to abort
    //console.log("executing command:", command)
    let exFunc = commandsExec[command.data.type]
    if (!exFunc) {
      console.log(`%c UNSUPPORTED COMMAND TYPE "${command.data.type}": IGNORING.`,
        "background: pink; color: #333")
      return false
    }
    //todo to do: check if condition, if command should even run.
    //
    let result = false
    result = exFunc(command, page)

    return result
  }

  function doChoice(choice, parentCommandBlock, page) {
    //console.log("executing choice:", choice)
    renderChoice(choice, parentCommandBlock, page)
  }

  let menuDom
  let mainDom
  let errorDom

  function initDom() {

    //<button id="b-about" class="menu-overlay-button" onclick="">${lang.about}</button>
    //<button id="b-settings" class="menu-overlay-button" onclick="">${lang.settings}</button>
    let html = `
      <div id="story-container">
        <div id="menu-overlay">
          <div id="menu-overlay-inner">
            <button id="b-restart" class="menu-overlay-button" onclick="">${lang.restart}</button>
            <button id="b-load" class="menu-overlay-button" onclick="">${lang.load}</button>
            <button id="b-save" class="menu-overlay-button" onclick="">${lang.save}</button>
            <button id="b-back" class="menu-overlay-button" onclick="">${lang.back}</button>
          </div>
          <div id="menu-overlay-inner2">
            <p>${lang.reallyRestart}</p>
            <button id="b-confirm-restart" class="menu-overlay-button"
              title="${lang.confirm}">${lang.confirm}</button>
            <button id="b-deny-restart" class="menu-overlay-button"
              title="${lang.abort}">${lang.abort}</button>
          </div>
          <div id="menu-overlay-inner3">
            ${lang.savedOk}
          </div>
        </div>
        <div id="error-shower"></div> 
        <div id="menu-top">
          <div id="stats-container"></div>
          <div id="menu-options-container">
            <button id="b-undo" class="menu-button"
            title="${lang.menu}">⤶</button>
            <button id="b-open-menu" class="menu-button"
            title="${lang.menu}">☰</button>
          </div>
        </div>
        <div id="story-main">
        </div>
        <div id="timer-shower"></div>
      </div>
    `
    outputContainer.innerHTML = ""
    outputContainer.innerHTML = html
    menuDom = document.getElementById("menu-top")
    mainDom = document.getElementById("story-main")
    errorDom = document.getElementById("error-shower")

    //init click handlers:

    let lst = [
      ["b-open-menu", openMenu],
      ["b-restart", clickRestart],
      ["b-load", 0],
      ["b-load", clickLoad],
      ["b-save", clickSave],
      ["b-settings", 0],
      ["b-about", 0],
      ["b-back", closeMenu],
      ["b-confirm-restart", restartStory],
      ["b-deny-restart", closeMenu],
      ["b-undo", performUndo],
    ]

    for (let item of lst) {
      let el = document.getElementById(item[0])
      if (item[1]) el.addEventListener("click", item[1])
    }

  }

  /*
  function populateMenuTop(el) {
    let stats = document.getElementById("stats-container")
    let menu = document.getElementById("menu-options-container")
    stats.innerHTML = ``
    menu.innerHTML = ``
  }
*/

  function updateUndoButtonLook() {
    let el = document.getElementById("b-undo")
    if (undoStates.length) {
      el.style.display = "inline-block"
    } else {
      el.style.display = "none"      
    }
  }

  function performUndo() {
    let st = undoStates.pop()
    performDomUpdates()
    if (!st) return
    setStoryState(st)
    cls()
    renderStreamAllItems(outputStreams["standard"], false)
  }

  function clickSave() {
    getEl("menu-overlay-inner3").style.display = "flex"
    getEl("menu-overlay-inner").style.display = "none"
    saveStory()
    setTimeout( () => {
      getEl("menu-overlay-inner3").style.display = "none"
      getEl("menu-overlay-inner").style.display = "flex"
      closeMenu()
    }, 500)
  }

  const saveKey = "story"

  function clickLoad() {
    loadStory()
    undoStates = []
  }

  function saveStory() {
    let state = getStoryState()
    state = JSON.stringify(state)
    localStorage.setItem(saveKey, state)
  }

  function loadStory() {
    let x = localStorage.getItem(saveKey)
    if (!x) return
    let state
    try {
      state = JSON.parse(x)
    } catch(er) {
      alert("Corrupted save-game?")
      return
    }
    if (!state) return
    console.log("retrieved state", state)
    setStoryState(state)
    closeMenu()
    let stream = outputStreams[currentOutputStream]
    undoStates = []
    performDomUpdates()
    getEl("story-main").innerHTML = ""
    renderStreamAllItems(stream, false)
  }

  function saveStateExists() {
    return localStorage.getItem(saveKey)
  }



  function getEl(id) {
    return document.getElementById(id)
  }


  function clickRestart() {
    getEl("menu-overlay-inner2").style.display = "flex"
    getEl("menu-overlay-inner").style.display = "none"
  }

  let menuIsOpen = false


  let openMenu = () => {
    menuIsOpen = true
    let menuOverlay = document.getElementById("menu-overlay")
    menuOverlay.style.display = "flex"
  }

  let closeMenu = () => {
    menuIsOpen = false
    let menuOverlay = document.getElementById("menu-overlay")
    menuOverlay.style.display = "none"
    getEl("menu-overlay-inner2").style.display = "none"
    getEl("menu-overlay-inner").style.display = "flex"
  }


  let restartStory = () => {
    setStoryState(initialStoryState)
    let stream = outputStreams["standard"]
    let domElement = document.getElementById("story-main")
    domElement.innerHTML = ""
    closeMenu()
    performDomUpdates()
    gotoFirstPage()
    //console.log("retrieved state", story, stream)
  }



  function loadStoryExternalData(tstory) {
    story = tstory
    story = preprocessStateForStory(story)
    console.log("LOADED STORY:", story)
  }

  function storyError(msg) {
    errorDom.innerHTML = msg
    errorDom.style.display = "block"
  }

  let outputStreams = { //may never contain methods!
    "standard": {
      id: "standard",
      content: [],
      maxElements: 0,
      transitionTimer: 0,
      transitionDelay: 200,
      outputContainerId: "story-main",
    }
  }

  let currentOutputStream = "standard"

  function clearStreamTransitionTimer(stream) {
    stream.transitionTimer = 0
  }

  function output(obj) {
    /* This takes an abstract output object and adds it to the output stream.
    This abstract representation of the output can then be
    stored, retrieved and (re-)rendered at any time.
    The object MUST BE jsonifiable.
    */
    if (!currentOutputStream) throw new Error(`No output stream set.`)
    let stream = outputStreams[currentOutputStream]
    if (!stream) throw new Error(`${currentOutputStream}:
      There is no output stream with this id.`)  
    addToStream(obj, stream)
    renderStreamLastItem(stream, true)
  }

  function addToStream(obj, stream) {
    stream.content.push(obj)
    while (stream.content.length > stream.maxElements) {
      stream.content.shift() //sic. NOT: stream.content = stream.content.shift()
    }
  }

  function renderStreamAllItems(stream, transition) {
    for (let item of stream.content) {
      //console.log("rendering stream item", item)
      renderStreamItem(stream, item, transition)
    }
  }

  function renderStreamLastItem(stream, transition) {
    let item = stream.content[stream.content.length - 1]
    renderStreamItem(stream, item, transition)
  }

  let timeouts = []

  function renderStreamItem(stream, item, transition) {
    let res = getHtmlFromStreamItem(item)
    let html = res[0]
    let id = res[1]
    let domElement = document.getElementById(stream.outputContainerId)
    let el = domElement

    el.innerHTML += html
    streamItemPostRender(item)
    
    if (transition) {
      //console.log("setting timeout of", stream.transitionTimer)
      let timeout = setTimeout(() => {
        let newElement = document.getElementById(id)
        if (newElement) newElement.classList.remove("hide")
      }, stream.transitionTimer)
      stream.transitionTimer += stream.transitionDelay
      timeouts.push(timeout)
    } else {
      let newElement = document.getElementById(id)
      if (newElement) newElement.classList.remove("hide")
    }
  }

  function streamItemPostRender(item) {
    if (item.type === "choice") choicePostRender(item)
  }

  function choicePostRender(item) {
    //since react likes to run everything twice in dev mode (which frankly
    //is awfully stupid), we need a safeguard. basically we let react
    //call this twice and set two identical event listeners per link,
    //but then we cancel one event if it happens immediately after another one.
    //a bit hacky, but whatever.
    let choice = item.choice
    setTimeout(
      () => {
        let el = document.getElementById("ch-" + choice.id)
        if (!el) return
        el.addEventListener("click", () => {
          let time = + new Date()
          let diff = time - lastClickTime
          if (diff <= 400) return
          lastClickTime = time
          selectChoice(choice, item.parentCommandBlockId, choice.data.pageName)
        })
      }
    , 300)
  }



  function getHtmlFromStreamItem(item) {
    let id = "stream-el-" + (+ new Date()) + "/" + Math.random()
    if (item.type === "text") {
      return [`<p class="hide" id="${id}">${item.text}</p>`, id]
    } else if (item.type === "choice") {
      return [`
        <div id="${id}" class="story-choice hide">
          <div class="story-choice-inner" id="ch-${item.choice.id}">
            ${item.choice.data.text}
          </div>
        </div>      
      `, id]
    } else if (item.type === "image") {
      let id = item.assetId
      if (!story.assets[id]) return ["", false]
      let data = story.assets[id].data
      return [`<div id="${id}" class="img-wrapper-${item.position} hide">
        <img alt="" class="${item.cssClasses}" src="${data}" /></div>`
          , id]
    }
    return ["", false]
  }

  function getStoryState() {
    let obj = {
      variables: vrInternal,
      outputStreams: outputStreams,
    }
    let x = JSON.stringify(obj)
    obj = JSON.parse(x)
    return obj
  }

  function setStoryState(state) {
    vrInternal = state.variables
    outputStreams = state.outputStreams
  }



  let initialStoryState //saves initial story state for restart story functionality

  let lang

  function initLocalization() {
    lang = story.localization
  }

  function initializeStory(domContainer) {
    lastClickTime = 0

    outputContainer = domContainer

    outputStreams["standard"].maxElements = story.storySettings.maxScrollback

    initLocalization()

    initDom()

    performDomUpdates()

    console.log("%c STORY STARTED! ", "background: pink; color: #333; border: 4px solid #777; border-radius: 4px;")
    //console.log("Rendering story to dom container:", domContainer)
    if (window && window.EXPORTED_FINAL) {
      console.log("Running as final exported story. Okay!")
    } else {
      console.log("Running inside the creation tool. Okay!")
      document.getElementById("dev-tools").style.display = "flex"
    }

    initialStoryState = getStoryState()

    gotoFirstPage()
  }


  function gotoFirstPage() {
    let startPage = story.startPage
    if (!startPage) {
      storyError(`No starting page was set!`)
      return
    }
    goToPage(startPage, "start_up")
  }

  function getTreeElementById(pageObj, id) {
    let result = walkTree(pageObj, (element, parent) => {
      if (element.id === id) {
        return {
          finalResult: element,
        }
      }
    })
    return result
  }

  function walkTree(pageObject, callFunc) {

    let page = pageObject
    
    if (!page) return false

    let finalResult = false
    rec(page, false)
    //console.log("result", result)
    return finalResult

    function rec(currentEl, parent) {
      if (finalResult) return

      let res = callFunc(currentEl, parent)

      if (res && res.finalResult) {
        finalResult = res.finalResult
        return
      }

      parent = currentEl

      if (currentEl.gather) {
        rec(currentEl.gather, parent)
      }

      if (currentEl.commandBlock) {//if element HAS commandBlock, NOT isCommandBlock
        rec(currentEl.commandBlock, parent)
        return
      }

      if (currentEl.links) {
        //console.log("links", currentEl.links)
        for (let link of currentEl.links) {
          rec(link, parent)
        }
      }

      if (currentEl.commands) {
        for (let command of currentEl.commands) {
          rec(command, parent)
        }
      }

    } //rec
  } 

  let runTime = {
    loadStory: loadStoryExternalData,
    restartStory: initializeStory,
  }

  //window.parent["testx"] = window

  return runTime

})()