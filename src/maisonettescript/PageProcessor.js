

import {createLink} from '../generic/pageElements.js'
import {createCommandBlock} from '../generic/pageElements.js'
import {createGather} from '../generic/pageElements.js'
import {createCommand} from '../generic/pageElements.js'
import {createNewPage} from '../generic/pageElements.js'
import {getCommandDataFromType} from "../generic/pageElements.js"

function processPage(page, pageId) {
  /*
    1. flat array of elements (chunks) that male up page

    2. pageId: must be passed

  */

  function addEntryToParentChain(el) {
    parentChain.push(el)
  }

  function removeLastEntryfromParentChain() {
    parentChain.pop()
  }

  function currentParent() {
    //last entry of parent chain
    return parentChain[parentChain.length - 1]
  }

  console.log("received page for processing:", page)
  const parentChain = []
  let currentLevel = 1

  //create top-level page command block:
  const commandBlock = createCommandBlock([], [], false, "PAGE_NO_PARENT")
  addEntryToParentChain(commandBlock)
  
  for (let item of page) {
    const type = item.type

    //### ### ### ### ### ### ### ### ### ### ### ### ### ### ###
    if (type === "gather") {
      const gather = item
      if (gather.level > currentLevel) {
        return {
          error: true,
          msg: `Gathers cannot have a higher level than their surrounding block. The current level is `+
            `${currentLevel}, but this gather has level ${gather.level}.`,
        }
      }

    //### ### ### ### ### ### ### ### ### ### ### ### ### ### ###
    } else if (type === "choice") {

    //### ### ### ### ### ### ### ### ### ### ### ### ### ### ###
    } else if (type === "text" || type === "command" || type === "goto") {
      const parent = currentParent()
      if (!parent.isCommandBlock) {
        throw new Error(`parent is not command block.`)
      }
      const commandData = getCommandDataFromType(type)
      const command = createCommand(commandData)
      parent.commands.push(command)

      if (type === "goto") {
        command.data.gotoTarget = item.target
        command.data.gotoTargetName = "UNKNOWN" //TO DO TODO YIKES. state.pages[
          //gotoPageId].printedName //get the page name  
      }
      //image needs data.assocAssetId: "1659459383115/0.4605182886071768"
      if (type === "image") {
        console.log(parent, item, "IMAGE")
      }
      
      
    }
    //### ### ### ### ### ### ### ### ### ### ### ### ### ### ###

  }
}




const exp = {
  processPage,
}

export default exp



