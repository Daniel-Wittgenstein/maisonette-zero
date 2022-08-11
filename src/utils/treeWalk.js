

/*

These functions walk through a very specific kind of tree:
a data tree that stores the entire structure of a page in our app!

*/



function walkTreeWithFixedOrder(pageObject, callFunc) {
  /* This is like walkTree, only with
  different walk order.
  This function is important for stateToScript.js
  */
  let page = pageObject
  
  if (!page) return false

  let finalResult = false
  rec(page, false, 0)
  //console.log("result", result)
  return finalResult

  function rec(currentEl, parent, level) {
    if (finalResult) return

    let res = callFunc(currentEl, parent, level)

    if (res && res.finalResult) {
      finalResult = res.finalResult
      return
    }

    parent = currentEl

    if (currentEl.commandBlock) {//if element HAS commandBlock, NOT isCommandBlock
      let newLevel = level
      if (!parent.isGather) newLevel = level + 1
      rec(currentEl.commandBlock, parent, newLevel)
      return
    }

    if (currentEl.commands) {
      for (let command of currentEl.commands) {
        rec(command, parent, level)
      }
    }

    if (currentEl.links) {
      //console.log("links", currentEl.links)
      for (let link of currentEl.links) {
        rec(link, parent, level)
      }
    }

    if (currentEl.gather) {
      rec(currentEl.gather, parent, level)
    }


  } //rec

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


function getTreeElement(pageObject, needleId) {
  //Function searches tree for a certain id and returns the corresponding
  //element if there is any.

  if (!pageObject) return false
  //traverse page until you find the right element:
  let res = walkTree(pageObject, (element, parent) => {
    if (element.id === needleId) return {
      finalResult: element,
    }
    return false
  })
  return res
}

let exp = {
  getTreeElement,
  walkTree,
  walkTreeWithFixedOrder,
}


export default exp
