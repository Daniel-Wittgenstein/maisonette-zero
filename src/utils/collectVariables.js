

import treeWalker from './treeWalk.js'

import tokenizer from '../language-processing/tokenizer.js'

//walkTree,
//tokenizer.tokenize


function getAllVars(state) {
  function add(text) {
    console.log(77, text)
    let tokens = tokenizer.tokenize(text)
    if (tokens.error) return tokens
    tokens = tokens.filter(t => {
      return t.type === "variable"
        && t.content.toLowerCase() !== "and"
        && t.content.toLowerCase() !== "or"
    })
    for (let token of tokens) {
      result.push(token)
    }
    return {error: false}
  }
  let err = false
  let result = []
  for (let page of Object.values(state.pages)) {
    // eslint-disable-next-line no-loop-func
    treeWalker.walkTree(page, (el) => {
      //console.log(1111123, el)
      if (el.data && el.data.ifConditionEnabled) {
        let res = add(el.data.ifConditionContent)
        if (res.error) err = res
      }
      if (el.data && el.data.type === "set") {
        let res = add(el.data.content)
        if (res.error) err = res
      }
    })
  }
  if (err) return err
  return result
}


const exp = {
  getAllVars,
}

export default exp