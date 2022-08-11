

/*

Converts app state to Ink source code.

Works, but legacy, since Ink support has been dropped
(would put too many constraints on what we want to do).

*/


import collectVariables from '../utils/collectVariables.js'

import Tokenizer from "./tokenizer.js"

function customWalk(commandBlock, func, level = 0) {
  /* 
    This does not use the treeWalk module,
    because it needs to walk the page tree in its own way/order. 
  */
  for (let command of commandBlock.commands) {
    func(command, "command", level)
  }
  for (let link of commandBlock.links) {
    func(link, "choice", level)
    if (link.mode === "sub") {
      if (link.commandBlock) {
        customWalk(link.commandBlock, func, level + 1)
      }
    }
  }
  if (commandBlock.gather) {
    let commandBl2 = commandBlock.gather.commandBlock
    if (commandBl2) {
      func(commandBlock.gather, "gather", level)
      customWalk(commandBl2, func, level)
    }
  }
}

function walkThroughPage(pageObj, func) {
  customWalk(pageObj.commandBlock, func)
}

function processCode(str) {
  /* Both if conditions and set commands are
  processed by this. We could process them separately, but currently
  there is no need to. */
  //does: and / or -> AND OR etc.
  let tokens = Tokenizer.tokenize(str)
  tokens = tokens.map (token => {
    if (token.type === "variable") {
      if (token.content === "and" || token.content === "or") {
        token.content = token.content.toUpperCase()
      } else if (token.content.startsWith("$")) {
        //there can be no conflict, because we do not allow variables starting with an
        //underscore inside the tool
        token.content = token.content.replace("$", "_")
      }
    }
    return token
  })
  str = Tokenizer.tokensToString(tokens)
  return str
}


function convertPageToInk(pageObj) {
  function ind(level) {
    return "  ".repeat(level)
  }
  let indentCondition = "  "
  let out = ""
  let func = (el, type, level) => {
    
    if (type === "command") {
      let type = false
      if (el.data) type = el.data.type
      let pre = ""
      let after = ""

      if (el.data.ifConditionEnabled) {
        pre = ind(level) + "{" + processCode(el.data.ifConditionContent) + ":\n" +
          indentCondition
        after = ind(level) + "}\n"
      }

      if (type === "text") {
        out += pre  + ind(level) + `${el.data.text}\n` + after
        return
      }

      if (type === "set") {
        out += pre + ind(level) + `~ ${processCode(el.data.content)}\n` + after
        return
      }
      
      out += pre + ind(level) + `#unsupported_command: ${type}\n` + after
    }
    
    if (type === "choice") {
      let ch = "+".repeat(level + 1)
      out += "\n" + ind(level) + ch + " " + el.data.text + "\n"
    }

    if (type === "gather") {
      console.log(222, el)
      let ch = "-".repeat(level + 1)
      out += "\n" + ind(level) + ch + "\n"
    }

  }

  walkThroughPage(pageObj, func)

  return out
}


function sanitizeInkyPageName(str) {
  //Ink knot names can start with a number,
  //there is no need to handle that
  return (str
    .trim()
    .toLowerCase()
    .replace(/\s/g, "_")
    .replaceAll(/[^a-zA-Z_0-9]/g, "")
  )
}

function getPageMap(pages) {
  //returns map of the form: page.id => Inky name of page
  let tmpPageMap = {}
  let pageMapResult = {}

  for (let page of Object.values(pages)) {
    let name = sanitizeInkyPageName(page.printedName)
    if (tmpPageMap[name]) {
      //conflict: two identically named pages
      let n = 1
      let xname
      while (true) {
        n++
        if (n > 20) {
          //otherwise good luck if you thousand pages with the exact same name
          xname = name + "_" + String(Math.random()).replaceAll(".", "")
          break
        }
        xname = name + "_" + n
        if (!tmpPageMap[xname]) break
      }
      name = xname
    }
    tmpPageMap[name] = true
    pageMapResult[page.id] = name
  }
  return pageMapResult
}


function convertToInk(state) {
  //console.log("CONVERTING TO INK, STATE:", state)
  let code = ""

  //add var defs:
  let r = collectVariables.getAllVars(state)
  if (r.error) {
    alert(`Could not convert to Ink: ${r.error.msg}`)
    return
  }

  for (let item of r) {
    let val = "0"
    if (item.varType === "string") val = '""'
    code += `VAR ${item.content} = ${val}\n`
  }

  code += "\n"

  //pages:
  const pageMap = getPageMap(state.pages)

  //add startpage -> goto startpage at beginning 
  let startId = state.pages[state.startPage]?.id
  code += "-> " + pageMap[startId] + "\n\n"
  //add pages and their contents:
  for (let page of Object.values(state.pages)) {
    let inkyName = pageMap[page.id]
    //console.log(page.printedName, inkyName)
    let text = convertPageToInk(page)
    code += `=== ${inkyName}\n` + text + "\n\n"
  }

  //of these tags, the Ink standard web template
  //only supports "author", but we
  //add the others, too, as they are meta-data
  //that might be used for something.
  let tags = ["title", "author", "genres", "year"]
  let tagTxt = ""
  for (let tag of tags) {
    tagTxt += `#${tag}: ${state.storySettings[tag]}\n`
  }
  code = tagTxt + "\n" + code

  return code
}


const exp = {
  convertToInk,
}

export default exp