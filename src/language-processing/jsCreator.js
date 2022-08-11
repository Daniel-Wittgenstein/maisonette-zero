

import Tokenizer from "./tokenizer.js"
import IfConditionValidator from "./ifConditionValidator.js"

function jsify(tokens, varName) {
  tokens = tokens.map(token => {
    if (token.type === "variable"
      && token.content !== "&&"
      && token.content !== "||"
    ) {
      token.content = `${varName}["${token.content}"]`
    }
    return token
  })
  return tokens
}

function convertToJs(str, varName = "vr") {
  /* This does not do the additional checks done by the functions inside
  ifConditionValidator.
  
  Takes string containing compatible app code.
  Converts it to JavaScript code AS STRING.

  str: string containing common code
  varName: string containing variable name. The name of the object,
    our variables should be wrapped in.
  -> returns string containing JS code
  */
  let tokens = Tokenizer.tokenize(str)
  if (tokens.error) return tokens
  tokens = (IfConditionValidator
    .doTokenReplacements(tokens)).tokens //doTokenReplacements
    //never returns error object
  tokens = jsify(tokens, varName)
  str = Tokenizer.tokensToString(tokens)
  return str
}

const exp = {
  convertToJs,
}


export default exp