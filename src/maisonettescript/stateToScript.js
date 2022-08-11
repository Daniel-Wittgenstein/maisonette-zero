

/*

  Takes app state, converts it to a string containing
    MaisonetteScript code.


  gui: changing choice type should remove sub-nodes. they should visually
  disappear and be actually removed and a notification should be issued.
  look into how to best do notifications. then implement it.
  then continue here, by implementing story end.

  then this is almost done.

  this way they won't show up inside statetoscript.js this is a big,
  but not of this module, they should not exist in the first place.



    */

import TreeWalker from "../utils/treeWalk.js"

const format = {
  emptyLinesBeforeNewPage: 2,
  emptyLinesAfterNewPage: 1,
  emptyLinesAfterTextBlock: 1,
  emptyLinesAtFileBeginning: 0,
  emptyLinesAfterCommand: 1,
  emptyLinesAfterGather: 0,
  indent: 4,
}


function convert(state) {
  let out = format.emptyLinesAtFileBeginning
  for ( let key of Object.keys(state.pages) ) {
    const page = state.pages[key]
    out += 
      "\n".repeat(format.emptyLinesBeforeNewPage) +
      "=== " + page.printedName + `, ${page.storyNetViewX}/${page.storyNetViewY}\n`+
      "\n".repeat(format.emptyLinesAfterNewPage)
    TreeWalker.walkTreeWithFixedOrder(page, doEachElement)
  }
  console.log("FINAL", out)
  return out

  function doEachElement(el, parent, level) {
    let output = ""

    if (el.storyNetViewX || el.storyNetViewX === 0) {
      //is page
      return
    }
    if (el.isCommandBlock) return
    console.log("do each element", el, level)
    if (el.isCommand) {
      output = processCommand(el)
    } else if (el.isGather) {
      output = "-".repeat(level) + "\n".repeat(format.emptyLinesAfterGather)
    } else if (el.data && el.data.type === "choice") {
      //je nach choice type etc.
      //processchoice
      let plus = "+".repeat(level) + " "
      if (el.mode === "sub") {
        output = plus + el.data.text
      } else if (el.mode === "goto") {
        output = plus + el.data.text + " -> " + el.data.gotoTargetName 
      } else if (el.mode === "nothing") {
        output = plus + el.data.text + " -> $empty" 
      } else {
        throw new Error("Unknown link type.")
      }
    } else {
      console.log(el)
      throw new Error(`Unknown element.`)
    }

    let rep = format.indent * (level)
    let indent = " ".repeat( rep )
    output = output.replaceAll("\n", "\n" + indent)
    out += indent + output + "\n"
  }

}


function processCommand(el) {
  const data = el.data
  const type = data.type
  let out = ""

  if (data.ifConditionEnabled) {
    out += "if: " + data.ifConditionContent + "\n"
  }

  if (type === "text") {
    out += data.text + "\n".repeat(format.emptyLinesAfterTextBlock)
  } else if (type === "goto") {
    out += "-> " + data.gotoTargetName + "\n".repeat(format.emptyLinesAfterCommand)
  } else if (type === "image") {
    out += `#image todo` + "\n".repeat(format.emptyLinesAfterTextBlock)
  }

  return out
}


const exp = {
  convert,
}

export default exp







