

/* 
New version of the module, adapted for iframe architecture.





testing script:
    <script>
    window.onload = () => {
      abcabc = "abcabc"; window.defdef = "defdef"
      document.body.innerHTML = 
      \`<p style="background: white; color: black;" >No HTML template. Cannot render story.
      Testing variables:
      abcabc: \${abcabc}, \${window.abcabc}
      defdef: \${defdef}, \${window.defdef}
      </p>\`
    }
    </script>



*/


import data from "../autoTemplate/runTime.js"
import runTimeCodeAsDataJs from "../autoTemplate/runTime.js"

import runTimeCodeAsDataCss from "../autoTemplate/storyCss.js"

import TreeWalker from "../utils/treeWalk.js"

import JsCreator from "../language-processing/jsCreator.js"

const _ = require('lodash')

function getHtml(exportedFinal = false) {
  return `
  <!doctype html>
    <html lang="en">
      §§§HEAD
      <body>

      <div id="dev-tools">
        <button style="width: 24px; height: 24px"
          onclick="document.getElementById('dev-tools').style.display='none'">X</button>
        <textarea id="var-shower" spellcheck="false" readonly="true">
        </textarea>
      </div>

      <div id="story-wrapper"></div>

        <script>
          window.EXPORTED_FINAL = ${exportedFinal}
        </script>
        
        <script>
          storyData = (*§§§INJECT_DATA*);
        </script>

        <script>(*§§§INJECT_RUNTIME*)</script>

        (*§§§INJECT_START_SCRIPT*)

      </body>
    </html>
  `
}

/*
function convertModuleToIIFE(str) {
    str = str.replace("export default runtime", "")
    str = `; window.runtime = (function () {${str}; return runtime}());`
    return str
}
*/

function sanitize(n) {
  if (!n) return "unknown"
  return (n
    .replaceAll("<", "")
  )
}

function sanitize2(n) {
  if (!n) return "unknown"
  n = String(n)
  return (n
    .replaceAll("<", "")
    .replaceAll('"', "")
  )
}

function sanitizeList(n) {
  if (!n) return "unknown"
  return (n
    .replaceAll('"', " ")
    .replaceAll(",", " ")
    .split(" ")
    .map(n => n.trim())
    .filter(n => n)
    .join(", ")
  )
}

const specialSequence = `䷔⪑ᔢ፩൏` //admittedly a bit hacky, but works. DO NOT
  //CHANGE WITHOUT CHANGING CORRESPONDING REGEX

function convertNeutralCodeToJs(state) {
  //convert all ifCondition and set commands contents to js code AS STRINGS
  //with special char sequence:
  let abort = false
  for (let key of Object.keys(state.pages)) {
    let page = state.pages[key]
    TreeWalker.walkTree(page,
      (el) => {
        if (abort) return
        if (el.data && el.data.ifConditionContent) {
          //console.log("IF COND", el.data, el.data.ifConditionContent)
          let res = JsCreator.convertToJs(el.data.ifConditionContent)
          if (res.error) abort = res
          el.data.ifConditionContent = specialSequence + res + specialSequence
        }
        if (el.data && el.data.type === "set" && el.data.content) {
          //console.log("SET COMMAND", el.data, el.data.content)
          let res = JsCreator.convertToJs(el.data.content)
          if (res.error) abort = res
          el.data.content = specialSequence + res + specialSequence
        }
      }
    )
  }
  if (abort) return abort
  return state
}

function insertJSintoJSONString(jsonStr) {
  //convert special char sequence to js function as string:
  jsonStr = jsonStr.replace(/"䷔⪑ᔢ፩൏.*?䷔⪑ᔢ፩൏"/g, (n) => {
    n = n.replaceAll(specialSequence, "")
    n = n.substr(1)
    n = n.substr(0, n.length - 1)
    n = n.replaceAll('\\\\', '\\')
    n = n.replaceAll('\\"', '"')
    return `() => {return ${n}}`
  })
  return jsonStr
}

function getEntirePage(state, exportedFinal = false) {
  state = _.cloneDeep(state)
  let html = getHtml(exportedFinal)
  
  //The following basically converts string conditions and string code to actual code.


  //transform if conditions and set commands to proper JS code AS STRINGS:
  state = convertNeutralCodeToJs(state)
  
  if (state.error) {
    return state
  }

  //now convert the whole state to a json string:
  let storyData = JSON.stringify(state)

  //now change that string so that some strings inside it are actually not strings
  //anymore but JS functions when parsed as JS:
  storyData = insertJSintoJSONString(storyData)

  let code = runTimeCodeAsDataJs.Contents

  let startScript = `
  <script>
    window.onload = start

    function start() {
      runTime.loadStory(storyData)
      runTime.restartStory(document.getElementById("story-wrapper"))
    }
  </script>
  `

  let meta = `
    <title>${sanitize(state.storySettings.title)}</title>
    <meta name="author" content="${sanitize2(state.storySettings.author)}">
    <meta name="creator" content="Maisonette Interactive Fiction Tool">
    <meta name="genres" content="${sanitizeList(state.storySettings.genres)}">
    <meta name="year" content="${sanitize2(state.storySettings.year)}">

  `

  html = html
    .replace("§§§HEAD", state.headContents)
    .replace("(*§§§INJECT_META*)", meta)
    .replace("(*§§§INJECT_TITLE*)", state.storyTitle || "untitled story")
    .replace("(*§§§INJECT_DATA*)", storyData)
    .replace("(*§§§INJECT_RUNTIME*)", code)
    .replace("(*§§§INJECT_STYLE*)", runTimeCodeAsDataCss.Contents)
    .replace("(*§§§INJECT_START_SCRIPT*)", startScript)

  //console.log("FINAL HTML", code)

  return html
}


export default getEntirePage