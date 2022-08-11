

import PageProcessor from "./PageProcessor.js"

const symbols = {
  "page": "===",
  "choice": "+",
  "gather": "-",
  "goto": "->",
  "if": "if:",
  "command": "#",
}

const emptyChoiceKeyword = "$empty" //user exposed
const emptyChoiceKeywordInternal = "*EMPTY_CHOICE_TARGET*" //internal


function processPage(page) {
  /* takes page as chunk list,
  returns page as nested structure */
  return PageProcessor.processPage(page)
}


function process(txt) {
  //##########################
  //split into lines:
  let lines = txt.split("\n")
  //##########################
  //annotate lines:
  let index = 0 //sic
  lines = lines.map(line => {
    index++
    let lineTrimmed = line.trim()
    let type = "text"
    for ( let key of Object.keys(symbols) ) {
      if ( lineTrimmed.startsWith(symbols[key]) ) {
        type = key
      }
    }
    if (type === "text" && !lineTrimmed) type = "empty"
    return {
      content: lineTrimmed,
      type,
      lineNr: index, //starting with 1, not 0!
    }
  })

  //##########################
  //merge if-lines with the command/choice/goto following them:
  let chunks = []
  let ifLineRead = false
  for (let line of lines) {
    if (line.type === "if") {
      if (ifLineRead) {
        return {
          error: true,
          msg: `Two 'if' lines cannot follow each other.`,
          lineNr: line.lineNr,
          lineContent: line.content,
        }
      }
      ifLineRead = line
      continue
    }

    if (ifLineRead) {
      if (line.type === "page" || line.type === "gather" || line.type === "empty") {
        let n = (line.type === "empty" ? "n" : "")
        return {
          error: true,
          msg: `A${n} ${line.type} line cannot be preceded by an if line: ${ifLineRead.content}`,
          lineNr: line.lineNr - 1, //-1 : if line / -0: empty line; returning if line
            //probably makes more sense.
          lineContent: line.content,
          ifLine: ifLineRead,
        }
      } else {
        line.if = ifLineRead
        chunks.push(line)
        ifLineRead = false
      }
      continue
    }

    chunks.push(line)
  } //for let line of lines

  //########################## 
  //merge consecutive text chunks into one:
  let newChunks = []
  let accumulate = []
  chunks.push({type: "finisher"})

  for (let chunk of chunks) {

    if (chunk.type === "text") {
      accumulate.push(chunk)
      continue
    }
    
    if (accumulate.length) {
      let content = accumulate.map(n => n.content).join(" ")
      let lineStart = accumulate[0].lineNr
      let lineEnd = accumulate[accumulate.length - 1].lineNr
      newChunks.push({
        content,
        lineNr: lineStart,
        lineStart,
        lineEnd,
        type: "text",
        if: accumulate[0].if,
      })
      accumulate = []
    }

    if (chunk.type !== "finished") {
      newChunks.push(chunk)
    }

  } //for (let chunk of chunks)

  newChunks = newChunks.filter(n => n.type !== "empty" && n.type !== "finisher")

  //process choices, commands and gathers:
  newChunks = processUnits(newChunks)

  if (newChunks.error) return newChunks

  //console.log("new chunks", newChunks)

  //split into pages:

  let pages = {}
  let currentPage = false
  let x, y 

  for (let chunk of newChunks) {
    if (chunk.type === "page") {
      let res = processPageHeader(chunk.content)
      if (res.error) {
        res.line = chunk.line
        res.lineNr = chunk.lineNr
        return res
      }
      currentPage = res[0]
      x = res[1]
      y = res[2]
      pages[currentPage] = []
    } else {
      if (!currentPage) {
        return {
          error: true,
          msg: `Code must start with === page delimiter.`,
        }
      }
      pages[currentPage].push(chunk)
    }
  }

  //console.log(pages)




  for ( let key of Object.keys(pages) ) {
    pages[key] = processPage(pages[key])
  }

  return pages

  //now build the tree structure


  //then: validate goto ids and convert the to maisonette data structure ids, same for page ids
  
  
/* first look at msn editor, how target structure needs to be. 
does it make sense to put cratepage etc into own module and then import it here and
into reducer??? probably, yes. but we need to work out what parameters
these funciton take and disentangle them from the reducer methods where needed.


*/

}



function getId() {
  let dat = + new Date()
  let id = dat + "/" + Math.random()
  return id
}


function processPageHeader(n) {

  const addText = `
    A line starting a new page should look like this (example):
    === page_name, 4/6
  `

  let org = n
  n = n
    .replace("===", "")
    .trim()

  let parts = n.split(",").map(n => n.trim())

  if (parts.length !== 2) return {
    error: true,
    msg: `Page start line: expected exactly one comma.${addText}`,
  }

  let coords = parts[1].split("/").map(n => n.trim())

  if (coords.length !== 2) return {
    error: true,
    msg: `Page start line: expected: number slash number.${addText}`,    
  }

  parts[0] = parts[0].toLowerCase().replaceAll("  ", " ")

  for (let i = 0;  i < 2; i++) {
    coords[i] = parseInt(coords[i], 10)
    if (!coords[i] && coords[i] !== 0) {
      return {
        error: true,
        msg: `Page start line: coordinates must be numbers.${addText}`,         
      }
    }
  }

  return [
    parts[0],
    coords[0],
    coords[1],
  ]

}





function processUnits(chunks) {
  for (let chunk of chunks) {
    let res = processUnit(chunk)
    if (res && res.error) return res
  }
  return chunks
}


function processUnit(chunk) {
  //modifies chunks in place, return falsey, if everything okay, else error object
  //console.log("process chunk", chunk)
  if (chunk.type === "page") return //processed elsewhere
  if (chunk.type === "choice") {
    let res = processChoice(chunk)
    return res
  }
  if (chunk.type === "goto") {
    let res = processGoto(chunk)
    return res
  }
  if (chunk.type === "gather") {
    let res = processGather(chunk)
    return res
  }
  if (chunk.type === "command") {
    let res = processCommand(chunk)
    return res
  }
}



function processCommand(command) {
  //console.log("process command", command)
  let subtype
  let text = command.content.replace("#", "").trim()
  let parts = text.split(":")
  if (parts.length < 2) {
    return {
      error: true,
      msg: `Expected a line of the form #command: command data / But I did not find a colon (:)`,
      line: command,
      lineNr: command.lineNr,
    }
  }
  subtype = parts[0].trim().toLowerCase()
  parts.shift()
  let content = parts.join(":").trim()
  let func = commandProcessor[subtype]
  if (!func) {
    return {
      error: true,
      msg: `#${subtype}: is not a command I know.`,
      line: command,
      lineNr: command.lineNr,
    }
  }
  let res = func(content, command)
  if (res.error) {
    return {
      error: true,
      msg: res.msg,
      line: command,
      lineNr: command.lineNr,
    }
  }
  return res
}

//just return an object with error = true and msg = `msg`
//from commandProcessor methods. the rest of the info is auto-added
const commandProcessor = {
  text(text, command) {
    //nothing so far
    return false
  },

  image(text, command) {
    // #image: image_name / classes: classname1, classname2 
    if (text === "") {
      return {
        error: true,
        msg: `Expected image name. You cannot just write "#image:", without an image name after that.`,
      }
    }
    let parts = text.split("/")
    if (parts.length > 2) {
      return {
        error: true,
        msg: `Too many slashes. I expect exactly one slash (/) character between the image name and the `
          + `"classes:" definition. Example:\n#image image_name / classes: class1, class2`,
      }
    }

    let name = parts[0].trim()
    if (name.includes(" " || name.includes(",") ) ) {
      let msg = `This format is not correct.\n` +
        `expected: #image image_name\n` +
        `or: #image image_name / classes: class1, class2\n` +
        `Maybe you tried to separate the name from the classes with a comma, `+
        `instead of a slash (/) character?`
      return {
        error: true,
        msg,
      }
    }
    command.imageName = name
    command.cssClasses = []
    let classes
    if (parts[1]) {
      classes = parts[1].trim()
      if (!classes.startsWith("classes:")) {
        return {
          error: true,
          msg: `I was expecting: #image: image_name / classes: class1, class2 --- but the "classes:" keyword `
            + "is missing here."
        }
      }
      classes = classes.replace("classes:", "").trim()
      let snips = classes.split(",").map(n => n.trim()).filter(n => n)
      for (let snip of snips) {
        if (!isValidCssClass(snip)) {
          return {
            error: true,
            msg: `${snip} is not a valid name for a css class.`,
          }
        }
      }
      command.cssClasses = snips
    } //if classes are given
    return false
  },

  set(text, command) {
    // # set: x = x + 2 - y
    command.execLine = text
    return false
  },
  
}



function processGather(gather) {
  let i = -1
  while (true) {
    i++
    let char = gather.content[i]
    if (char !== "-" || i >= gather.content.length || i > 20) break
  }
  let text = gather.content.substr(i).trim()
  gather.level = i
  if (text !== "") {
    let msg = `A gather line should only consist of minus symbols. Additional content on the same line ` +
      `is not allowed.`
    if (text.includes("-")) {
      msg = `Spaces between minus symbols are not allowed. To create a gather, write: --- / not: -  -  -`
    }
    return {
      error: true,
      msg,
      line: gather,
      lineNr: gather.lineNr,
    }
  }
  return false
}


function processGoto(gotoCommand) {
  let target = gotoCommand.content.replace("->", "").trim()
  if ( !isValidPageName(target) ) {
    return {
      error: true,
      msg: `Page name should not include special characters.`,
      line: gotoCommand,
      lineNr: gotoCommand.lineNr,        
    }
  }
  gotoCommand.target = target
  return false
}


function processChoice(choice) {
  //console.log("processing choice", choice)
  let i = -1
  while (true) {
    i++
    let char = choice.content[i]
    if (char !== "+" || i >= choice.content.length || i > 20) break
  }
  let level = i
  let rest = choice.content.substr(i).trim()

  if (rest.startsWith("+")) {
    return {
      error: true,
      msg: `Spaces between plus symbols are not allowed. To create a choice, write: +++ / not: +  +  +`,
      line: choice,
      lineNr: choice.lineNr,
    }
  }

  if (rest === "") {
    return {
      error: true,
      msg: `Empty choices are not allowed.`,
      line: choice,
      lineNr: choice.lineNr,
    }
  }
  let text = ""
  let target = false
  if (choice.content.includes("->")) {
    let parts = choice.content.split("->")
    text = parts[0].replaceAll("+", "").trim()
    target = parts[1].trim()
    if ( !isValidPageName(target) ) {
      return {
        error: true,
        msg: `Page name should not include special characters.`,
        line: choice,
        lineNr: choice.lineNr,        
      }
    }
    if (target === "") {
      return {
        error: true,
        msg: `After -> I was expecting the name of a page to go to.`,
        line: choice,
        lineNr: choice.lineNr,
      }
    }
    if (target === emptyChoiceKeyword) {
      target = emptyChoiceKeywordInternal
    }
  } else {
    text = rest
  }

  if (text === "") {
    return {
      error: true,
      msg: `Choices without text content (empty choices) are not allowed.`
    }
  }

  choice.text = text
  choice.target = target
  choice.level = level

  return false
}

let pageNameInvalidCharsSet = new Set(`.,:;/\\?=()!"'§$%&[]#~+*-\`^°<>|`.split(""))

let cssClassInvalidCharsSet = new Set(`.,:;/\\?=()!"'§$%&[]#~+*\`^°<>|`.split(""))




function isValidPageName(str) {
  let forbidden = pageNameInvalidCharsSet
  for (let char of str) {
    if (forbidden[char]) return false
  }
  return true
}


function isValidCssClass(str) {
  let forbidden = cssClassInvalidCharsSet
  for (let char of str) {
    if (forbidden[char]) return false
  }
  return true
}



let testData = `



  === page 1, 2/2


  -

  --

  

  -------

  # image: cat / classes: rounded, custom1

  if: schnupstext
  Schnups!
  Schnups!
    Schnups!    




  One morning you went
  away and
  came back forever.


  if: cangoleft
  + go left

    ++ go sea

      if: black_sea_enabled == 1
      +++ go black sea

      okay, you go to the
      black
      sea, my
      man



      +++ go white sea

      ok, white sea it
      is!

      schnups!

    ++ go mountain


  + go right -> page3

  + go mid -> $empty

  -
  Gather the
  flow
  here.
  -> page2

  === page 2, 3/3

  -> page3

  === page 3, 1/6

`
function test() {
  let result = process(testData)
  console.log("FINAL RESULT PROCESS", result)
}

//test()

const exp = {
  process,
  test,
}

export default exp











