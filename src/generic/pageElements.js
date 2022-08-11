

/*

Functions that create pages and the elements that make up a page.

These functions are used by our reducer and by the program
that converts MaisonetteScript to page elements.

*/

import getId from '../utils/getId.js'

const _ = require('lodash')


function createLink(linkProps, commandBlock) {
  if (!commandBlock.isCommandBlock) throw new Error (`Not a valid command block.`)
  return {
    data: {
      ifConditionEnabled: false,
      ifConditionContent: "",
      text: linkProps.text,
      gotoTarget: false,
      type: "choice",
      pageId: linkProps.pageId,
      pageName: linkProps.pageName,
    },
    commandBlock: commandBlock,
    id: getId(),
  }
}

function createCommandBlock(commands, links, gather, parentId) {
  let cb = {
    isCommandBlock: true,
    commands: commands,
    links: links,
    gather: gather,
    id: getId(),
    parentId: parentId,
  }
  return cb
}


function createGather(parentId) {
  let id = getId()
  return {
    isGather: true,
    id: id,
    parentId: parentId,
    commandBlock: createCommandBlock([], [], false, id) //sic. id NOT parentId
  }
}

function createCommand(data) {
  return {
    isCommand: true,
    data: data,
    id: getId(),
  }
}



function createNewPage(state, printedName, x, y) {

  state.pageIdCounter ++
  let id = state.pageIdCounter + "/" + getId()
  if (!printedName) printedName = "page " + state.pageIdCounter

  //console.log("COMMAND CREATE NEW PAGE AT ", x, y)
  let newPages = _.cloneDeep(state.pages)

  if (!x && x !== 0) {
    //if x isn't given, ignore y as well: (either both must be given or none)
    let result = findFreePositionForPageOnGrid(newPages)
    console.log("find res", result)
    ;[x, y] = result
  }


  if (newPages[id]) throw new Error(`Colliding page names.`)

  let newPage = {
    storyNetViewX: x,
    storyNetViewY: y,
    name: id, //sic
    printedName: printedName,
    id: getId(),
    commandBlock: createCommandBlock([], [], false, "PAGE_NO_PARENT"),
  }

  newPages[id] = newPage

  state.pages = newPages

  return newPage
}



function findFreePositionForPageOnGrid(pages) {
  /* This should not be hard-coded, but currently it is:
  It just assumes that the storynetview grid has at least a certain width
  and height. Ideally, we would refactor the app
  so that the canvas of storynetview does not have a fixed
  size but is controlled via props passed down from here.
  Also, pageboxwidth and pageboxheight must correspond to the
  value inside storynetview.
  */
  const minWidth = 15
  const minHeight = 25
  const pageBoxWidth = 80 //super-important: if you change this, change it inside dataslice, too!!!
  const pageBoxHeight = 32
  let gridX = Math.round(pageBoxWidth * 1.2)
  let gridY = Math.round(pageBoxHeight * 1.3)

  let hash = {}
  for (let page of Object.values(pages)) {
    hash[page.storyNetViewX + "/" + page.storyNetViewY] = true
  }
  for (let y = 0; y < minHeight; y++) {
    for (let x = 0; x < minWidth; x++) {
      let gx = x * gridX
      let gy = y * gridY
      let v = hash[gx + "/" + gy]
      if (!v) return [gx, gy]
    }
  }
  return [0, 0]
}



function getCommandDataFromType(type) {
  const data = {
    type,
    ifConditionContent: "",
  }
  if (type === "set") data.content = ""
  if (type === "text") data.text = ""
  return data
}



export {
  createLink,
  createCommandBlock,
  createGather,
  createCommand,
  createNewPage,
  getCommandDataFromType,
}