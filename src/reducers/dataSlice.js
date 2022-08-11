
import treeWalk from "../utils/treeWalk.js"

import { createSlice } from '@reduxjs/toolkit'

import getHeadContents from '../HTMLTemplate/defaultHead.js'

import loadLocalization from '../localization/local.js'

import getId from '../utils/getId.js'

import {createLink} from '../generic/pageElements.js'
import {createCommandBlock} from '../generic/pageElements.js'
import {createGather} from '../generic/pageElements.js'
import {createCommand} from '../generic/pageElements.js'
import {createNewPage} from '../generic/pageElements.js'

const _ = require('lodash')


const initialState = {
  shortAppName: "Maisonette",
  longAppName: "Maisonette",
  version: "0.1",
  releaseDate: "unknown",
  
  pages: {},
  //currentPageId: false, //legacy. do not use. to remove.
  pageIdCounter: 0,
  startPage: false,
  currentUserMessage: false,
  pageTargets: {},
  assets: {},
  headContents: getHeadContents(),
  localization: {},
  storySettings: {
    scrollback: false,
    maxScrollback: 20,
    maxUndo: 10, //for story, not app
    title: "Untitled story",
    author: "Anonymous",
    genres: "unknown, unknown, unknown",
    year: 1979,
    statusBarContent: "",
  },
  notifications: [],
}

initialState.localization = loadLocalization()

/*
function getTreeElementChain(pageId, needleId) {
  let page = initialState.pages[pageId]
  
  if (!page) return false
  //traverse page until you find the right element:
  //commandBlock, Links
  let resultChain = []
  rec(page, [])
  //console.log("result", resultChain)
  return resultChain

  function rec(currentEl, chain) {
    if (resultChain.length) return

    if (currentEl.id === needleId) {
      resultChain = chain
      return
    }
    if (currentEl.commandBlock) {
      chain = [... chain]
      chain.push("commandBlock")
      rec(currentEl.commandBlock, chain)
      return
    }
    if (currentEl.links) {
      //console.log("links", currentEl.links)
      let index = -1
      for (let link of currentEl.links) {
        index++
        chain = [... chain]
        chain.push("links")
        chain.push(index)
        rec(link, chain)
      }
    }
  }

}

*/


//let st = initialState

//let firstPage = createPage("first_page", "First Page")

//st.currentPageId = firstPage.name //sic
//console.log("initial state", initialState)



function createNotification(state, msg, intent, duration) {
  const id = getId()
  const notification = {
    msg, intent, duration, id
  }
  state.notifications.push(notification)
}




//####################


function setLinkGotoTargetDo(state, pageId, selfId, gotoPageId) {
  //console.log("slampette",state, pageId, selfId, gotoPageId)
  modifyElement(state, pageId, selfId, (element) => {
    console.log("found element:", element)
    element.data.gotoTarget = gotoPageId
    element.data.gotoTargetName = state.pages[gotoPageId].printedName //get the page name
  })
  refreshPageTargets(state, pageId)
}

function refreshPageTargets(state, pageId) {
  /* pageTargets holds information about which page links to which page. 
  This is information the story net view needs to render arrows.
  Because it would be abominable to recalculate that information based on state
  every time the story net view is rendered, we keep it in pageTargets.
  Call this function to update page targets for one page, whenever
  that page changes something corresponding (whenever a choice changes
  its goto target, whenever a choice gets removed, whenever an auto-goto
  command changes its goto target, whenever an auto-goto command is removed etc.)
  pageTargets does not care HOW exactly the pages are connected, it only cares
  WHETHER they are connected (not entirely
  true, we add SOME info about that). It also only keeps track of OUTGOING links, not of incoming
  links.
  */
  //commandBlock -> links -> commandBlock -> links -> commandBlock etc.
  //we need some lovely recursion here

  let collectedTargets = []

  function processCommandBlock(commandBlock, level = 0) {
    //todo; extend to include goto commands, once those exist
    if (!commandBlock.links || !commandBlock.links.length) return
    for (let link of commandBlock.links) {
      if (link.mode === "goto") {
        collectedTargets.push({
          type: "choice",
          level: level,
          targetPageId: link.data.gotoTarget,
        })
      } else if (link.mode === "sub") {
        if (!commandBlock) return
        let newLevel = level + 1
        processCommandBlock(link.commandBlock, newLevel)
      } else if (link.mode === "nothing") {
        return
      } else {
        throw new Error(`Fatal: link has no valid mode.`)
      }
    }
  }
  let page = state.pages[pageId]
  processCommandBlock(page.commandBlock, 0)
  console.log("refresh page targets", state, collectedTargets)
  state.pageTargets[pageId] = collectedTargets
}



const theReducers = {

  notify(state, action) {
    //parameters: msg, duration, intent
    const p = action.payload
    createNotification(state, p.msg, p.intent, p.duration)
  },

  destroyNotificationBox(state, action) {
    const p = action.payload
    state.notifications = state.notifications.filter(n =>  n.id !== p.id)
  },

  moveCommand(state, action) {
    const p = action.payload
    modifyElement (state, p.pageId, p.parentCommandBlock.id, (element) => {
      let orgIndex = -1
      let index = -1
      for (let command of element.commands) {
        index++
        if (command.id === p.selfId) {
          orgIndex = index
        }
      }
      if (index === -1) return
      let targetIndex = orgIndex + p.step
      if (targetIndex >= element.commands.length || targetIndex < 0) return
      let a = element.commands[orgIndex]
      element.commands[orgIndex] = element.commands[targetIndex]
      element.commands[targetIndex] = a
    })
  },


  setLocalization(state, action) {
    state.localization = action.payload.data
  },

  setHeadContents(state, action) {
    let p = action.payload
    state.headContents = p.data
  },


  setAssetIdForElement(state, action) {
    let p = action.payload
    
    modifyElement(state, p.pageId, p.selfId, (element) => {
      element.data.assocAssetId = p.assetId
    })
  },


  createNewAsset(state, action) {
    let p = action.payload
    let id = getId()
    
    let newAsset = {
      type: p.type,
      userName: p.userName,
      data: p.data,
      id: id,
      size: p.size,
      fileTypeInfo: p.fileTypeInfo,
    }

    state.assets[id] = newAsset

  },

  genericStateChange(state, action) {
    //NOT the same as genericAssignProp!

    /* This accesses a property or nested property of the Redux store
    and changes it.
    Unlike genericAssignProp it does not walk through page trees.

    This can be used to change app settings, for example.

    genericAssignProp is more complex and is used to change elements
    making up pages.

    value / propList

    */
    let p = action.payload
    let el = state
    let pArr = _.cloneDeep(p.propList)
    let last = pArr.pop() //remove last entry AND returns it
    for (let key of pArr) {
      if (!el) {
        console.log(key, "is not a property of", el)
        throw new Error(`Illegal property access at genericStateChange: see console message.`)
      }
      el = el[key]
    }
    el[last] = p.value
  },
  
  genericAssignProp(state, action) {
    /* (A generic action that just calls any function
    on an element would be way more powerful, of course, but
    that's not possible, because Redux wants all actions
    to be serializable. So we use crutches like this.)

    parameters: pageId, selfId, assign object

    This finds an element in the page tree and changes
    a single arbitrary property to an arbitrary value.
    assign.access is supposed to be an array of strings,
    each string is a property key, so you can access nested properties!
    For example: assign: {
      access: ["data", "myKey"],
      value: 2
    }
    -> would do:
    element["data"]["mykey"] = 2
    
    Missing objects in the lookup chain
    are considered as hard errors and are thrown.
    
    */

   
    let p = action.payload

    if (p.propList) {
      throw new Error (`propList: did you mean to call 
        genericStateChange instead of genericAssignProp?`)
    }

    if (!Array.isArray(p.assign.access)) {
      throw new Error (`genericAssignProp:
      assign.access value must be array`)
    }
  
    modifyElement(state, p.pageId, p.selfId, (element) => {
      let el = element
      let lastKey = p.assign.access.splice(p.assign.access.length - 1, 1) //returns AND modifies
        //original array (removes last entry)
      for (let key of p.assign.access) {
        el = element[key]
        if (!el) throw new Error(`genericAssignProp: cannot access property "${key}"`)
      }
      el[lastKey] = p.assign.value
    })


  },


  setLinkTimer(state, action) {
    //time is in seconds, not ms!
    let p = action.payload
    modifyElement(state, p.pageId, p.selfId, (element) => {
      element.time = p.time
      if (p.time >= 0) {
        element.hasTimer = true
      } else {
        element.hasTimer = false
      }
      //console.log(element)
    })
  },


  deleteAsset(state, action) {
    let p = action.payload
    let id = p.id
    delete state.assets[id]
  },


  deletePage(state, action) {
    let id = action.payload.pageId
    for (let key of Object.keys(state.pages)) {
      let page = state.pages[key]
      if (page.name === id) {
        delete state.pages[key]
        break
      }
    }

  },
  

  loadAppState(state, action) {
    /* sets app state from a string. used to load a save file
    and set app state from it */

    //we catch errors beforehand and show them to user,
    //by actually parsing the JSON twice. A bit wasteful, but probably okay.
    //Tht's why there is no try catch for the json here.
    
    let newState = JSON.parse(action.payload.content)

    for (let key of Object.keys(state)) {
      delete state[key]
    }

    for (let key of Object.keys(newState)) {
      state[key] = newState[key]
    }

    return
  },


  createNewPage(state, action) {
    //story net view issued command to create new page:
    let x = action.payload.x
    let y = action.payload.y
    createNewPage(state, false, x, y)
  },

  createNewPageFromGotoInput(state, action) {
    //goto input: user typed new page name in choice goto input and doing so
    //issued command
    //to create a new page:
    const pageId = action.payload.pageId
    //const parentId = action.payload.parentId
    const selfId = action.payload.selfId
    const newPageName = action.payload.newPageName
    let page = createNewPage(state, newPageName, false, false)
    let newPageId = page.name
    setLinkGotoTargetDo(state, pageId, selfId, newPageId)
  },


  setLinkGotoTarget(state, action) {
    //both used for links with a classic goto behavior and
    //for gotoCommands ("redirects") (direct gotos without user intervention)
    const pageId = action.payload.pageId
    //const parentId = action.payload.parentId
    const selfId = action.payload.selfId
    const gotoPageId = action.payload.data.value
    setLinkGotoTargetDo(state, pageId, selfId, gotoPageId)
  },


  setPagePosition (state, action) {
    const page = action.payload.page
    const x = action.payload.x
    const y = action.payload.y
    
    if (!page) throw new Error(`Page does not exist.`)
    const newPage = _.cloneDeep(page)
    state.pages[newPage.name] = newPage
    newPage.storyNetViewX = x
    newPage.storyNetViewY = y
    //broken. i thought with immer we can just change it but no way.
    //todo to do: is this still a thing to fix?

    return state
  },

  addChoice(state, action) {
    const parentId = action.payload.parentId
    const pageId = action.payload.pageId 
    const mode = action.payload.mode
    let commands = []
    commands.push(createCommand({
      type: "text",
      text: "",
    }))
    let link = createLink({
      text: "",
      pageName: pageId, //sic. because of historical reasons, pages have two ids,
        //one is called name and one id (not to be confused with printedName)
    }, createCommandBlock(commands, [], false, parentId))
    link.mode = mode
    modifyElement(state, pageId, parentId, (element) => {
      element["links"].push(link)
    })
  },


  addCommand(state, action) {        
    const parentId = action.payload.parentId
    const pageId = action.payload.pageId
    let data = action.payload.data
    let cm = createCommand(data)
    modifyElement(state, pageId, parentId, (element) => {
      element["commands"].push(cm)
    })
  },

  deleteSomething(state, action) {
    const parentId = action.payload.parentId
    const pageId = action.payload.pageId
    const selfId = action.payload.selfId
    const propKey = action.payload.propKey
    modifyElement(state, pageId, parentId, (element) => {
      element[propKey] = element[propKey].filter(n => n.id !== selfId)
    })
  },
  
  deleteGather(state, action) {
    const parentId = action.payload.parentId
    const pageId = action.payload.pageId
    modifyElement(state, pageId, parentId, (element) => {
      element.gather = false
    })
  },

  setLinkMode(state, action) {
    const pageId = action.payload.pageId
    const selfId = action.payload.selfId
    const mode = action.payload.mode
    modifyElement(state, pageId, selfId, (element) => {
      element.mode = mode
      const parentId = selfId
      element.commandBlock = createCommandBlock([], [], false, parentId)
      //console.log("mode", element)
    })
  },

  setCommandText(state, action) {
    //also used for setting link (choice) text
    //const parentId = action.payload.parentId
    const pageId = action.payload.pageId
    const selfId = action.payload.selfId
    const text = action.payload.text
    //console.log("SET COMMAND TEXT", selfId)
    modifyElement(state, pageId, selfId, (element) => {
      element.data.text = text
    })
  },

  addGather(state, action) {
    const pageId = action.payload.pageId
    const parentId = action.payload.parentId
    modifyElement(state, pageId, parentId, (commandBlock) => {
      commandBlock.gather = createGather(commandBlock.id)
    })
  },


  undo(state, action) {
    console.log("now  0", undoState.states, undoPointer)
    undoPointer--
    let theUndoObj = undoState.states[undoPointer]
    if (!theUndoObj) {
      undoPointer++
      state.notifications = []
      createNotification(state, `Nothing to undo.`, "inform", 3000)
      return //no undo state
    }
    let theState = theUndoObj.state
    state = theState
    //undoState.states.splice(undoState.states.length - 1) //remove last entry
    console.log("now undo", undoState.states, undoPointer)
    state.notifications = [] //important
    const name = getPrintedFuncName(theUndoObj.funcName)
    createNotification(state, `Undone "${name}"`, "inform", 3000)
    return state
  },

  
  redo(state, action) {
    //broken todo to do fix
    let theState = undoState.states[undoPointer]
    if (!theState)  {
      console.log("nothing to redo", undoPointer)
      return
    }
    undoPointer++
    state = theState
    console.log("now redo", undoState.states, state, undoPointer)
  },

  
  setAppState(state, action) {
    let newState = action.payload
    //console.log("trying to set app state. old:", state, "new:", newState)
    for (let key of Object.keys(state)) {
      state[key] = newState[key]
    }
    state.pages = newState.pages
  },

  setAsStartingPage(state, action) {
    let pageId = action.payload
    let page = state.pages[pageId]
    if (!page) throw new Error("Cannot set this as startPage. No page with id: " + pageId)
    state.startPage = pageId
  },

  setPageName(state, action) {
    let p = action.payload
    state.pages[p.pageId].printedName = p.newName
  },

}


function getPrintedFuncName(name) {
  function separated(txt) {
    let nu = ""
    for (let char of txt) {
      if (char.toUpperCase() === char) {
        nu += " " + char.toLowerCase()
      } else {
        nu += char
      }
    }
    return nu
  }
  let map = {
    genericStateChange: "change property",
    genericAssignProp: "change property",
    deleteSomething: "delete item",
  }
  if (map[name]) return map[name]
  return separated(name)
}

/*
function issueFeedback2User(state, type, msg) {
  state.currentUserMessage = ({
    type: type,
    msg: msg,
  })
  return state
}
*/

for ( let key of Object.keys(theReducers) ) {
  let exclude = new Set(["undo", "redo", "notify", "destroyNotificationBox", "setAppState"])
  if (exclude.has(key)) continue
  //let value = theReducers[key]
  theReducers[key] = undoify(theReducers[key], key)
}

let undoPointer = 0

const undoState = {
  states: [],
} //undostate is not part of global store.
//As such it is not persistent across sessions.
//This is the way most programs work.

const maxUndo = 3 //for app, not story

function undoify(func, funcName) {
  return (state, action) => {
    let newState = _.cloneDeep(state)
    //remove entries if undoPointer is in the middle of stack:
    let keep = undoState.states.splice(0, undoPointer)
    //console.log("keep", keep)
    keep.push({
      state: newState,
      funcName: funcName,
    })
    undoState.states = keep
    undoPointer++
    func(state, action)
    //console.log("undo states", undoState.states)
    //remove old entries:
    if (undoState.states.length > maxUndo) {
      undoState.states.splice(0, 1) //remove first entry
      undoPointer--
    }
    //console.log("amd then", undoState.states)
  }
}


const dataSlice = createSlice({
  name: 'data',
  initialState: initialState,
  reducers: theReducers,
})





function modifyElement (state, pageId, parentId, doThis) {
  /* pass:
  1. state
  2. page id
  3. "parent" id: actually id of target element!!
  4. function (gets passed the target element) -> can
    do whatever it wants with the target element or its children/properties

  This is basically a wrapper function that handles state cloning and
  fetching an element by id.
  */
  const page = state.pages[pageId]
  ////console.log(p.pageId, p.parentId, page)

  if (!page) throw new Error(`Page does not exist.`)
  const newPage = _.cloneDeep(page)
  const element = treeWalk.getTreeElement(newPage, parentId)
  if (!element) throw new Error(`Cannot perform action: element with id "${parentId}" does not exist?!`)

  //console.log("retrieved this element:", element)

  doThis(element)

  state.pages[pageId] = newPage

  return state
}




let obj = {
  dataSlice: dataSlice,
  action: dataSlice.actions,
}

export default obj


