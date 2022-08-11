
import Tokenizer from "./tokenizer.js"


function collectVarNames(val) {
  let tokens = Tokenizer.tokenize(val)
  let arr = []
  for (let token of tokens) {
    if (token.type === "variable") {
      arr.push(token.content)
    }
  }
  return arr
}

function rejectMalformedVariables(tokens) {
  for (let token of tokens) {
    if (token.type === "variable") {

      if (token.content.includes(".")) {
        return {
          error: true,
          msg: `Variable names cannot contain dots.`
        }
      }

      if (token.content.substr(1).includes("$")) {
        return {
          error: true,
          msg: `Variable names cannot contain a $ symbol. Only the first character can be a $ symbol, if `+
            `the variable is a text variable.`
        }
      }

      if (token.content.startsWith("_")) {
        return {
          error: true,
          msg: `Variable names can contain an underscore character (_). But they cannot start with it.`
        }
      }

    }
  }
  return {error: false}
}

function informVariablesWithUncommonCharacters(tokens) {
  for (let token of tokens) {
    if (token.type === "variable") {
      if (includesUncommonChars(token.content)) {
        return {
          error: true,
          msg: `The expression seems okay, but some variable names ` +
            `contain characters that ` +
            `Ink may not like. ` +
            `If you want to export your story to Ink, refer to the Ink guide ` +
            `to see which character sets it supports for identifier names.`
        }
      }
    }
  }
  return {error: false}
}

function includesUncommonChars(txt) {
  /* 
  Latin Extended A: 256 - 283 \u0100-\u017F
  Latin Extended B: 384 - 581 \u0180-\u024F
  */
  for (let i = 0; i < txt.length; i++) {
    let x = txt.charCodeAt(i)
    if (x > 581) return true
    if (x > 283 && x < 384) return true
  }
  return false
}


function setCommandValidatorFunction(val) {
  //takes text, returns object with error: true,
  //and msg if not a valid set command
  let result = Tokenizer.tokenize(val)

  if (result.error) return result
  let tokens = result

  if (!tokens.length) return {
    error: true,
    msg: "Change variable command should not be empty. Example: health = health + 10"
  }

  result = rejectMalformedVariables(tokens)
  if (result.error) return result

  result = validateTokensForSet(tokens)
  if (result !== "") return {
    error: true,
    msg: result,
  }

  let sentence = tokens.map(t => {
    if (t.isStringLiteral) return '"' + t.content + '"'
    return t.content
  }).join(" ")

  result = Tokenizer.checkSyntax(sentence)

  if (!result) {
    let errMsg = `JavaScript syntax error. This does not seem to be a valid expression.`
    return {
      error: true,
      msg: errMsg,
    }
  }
  
  result = checkTypes(tokens, "command")
  if (result !== "") return {
    error: true,
    msg: result,
  }

  result = informVariablesWithUncommonCharacters(tokens)
  if (result.error) return result
  
  return {
    error: false,
    notify: true,
    msg: `Command looks okay!`
  }

}

function ifValidatorFunction (val) {
  //takes text, returns object with error: true,
  //and msg if not a valid if condition

  if (val.trimLeft().toLowerCase().startsWith("if ") ||
    val.toLowerCase() === "if"
  ) {
    return {
      msg: `There is no need to start the condition with if. The if is already implicit. :)`,
      error: true,
    }    
  }

  let result = Tokenizer.tokenize(val)
  if (result.error) return result
  let tokens = result

  if (!tokens.length) return {
    error: true,
    msg: "Condition should not be empty. Example: health >= 50"
  }

  result = rejectMalformedVariables(tokens)
  if (result.error) return result

  result = validateTokens(tokens, "condition")
  if (result !== "") return {
    error: true,
    msg: result,
  }

  result = doTokenReplacements(tokens)
  if (result.error) return result
  let andOrReplacementHappened = result.andOrReplacementHappened
  tokens = result.tokens

  let sentence = Tokenizer.tokensToString(tokens)

  result = Tokenizer.checkSyntax(sentence)

  if (!result) {
    let errMsg = `JavaScript syntax error. This does not seem to be a valid expression.`
    if (andOrReplacementHappened) {
      errMsg += ` (I saw "and" or "or" and converted the sentence you typed to: «${sentence}» in order `+
        `to make it more palatable to the computer, but the JavaScript parser is still complaining.)`
    }
    return {
      error: true,
      msg: errMsg,
    }
  }
  
  result = checkTypes(tokens, "condition")
  if (result !== "") return {
    error: true,
    msg: result,
  }

  result = informVariablesWithUncommonCharacters(tokens)
  if (result.error) return result

  return {
    error: false,
    notify: true,
    msg: `Condition looks okay!`
  }
}



function validateTokensForSet(tokens) {
  if (tokens[0] && tokens[1]
    && tokens[0].type === "variable"
    && tokens[1].isOperator
    && tokens[1].content === "="
    && tokens[2]
    ) {
    return ""
  } else {
    return "The command should start with a variable name followed by an "
      + "equals sign, followed "
      + "by an expression. "
      + `Example: x = y * 2`
  }
  
}


function validateTokens(tokens) {
  function isKeyword(token) {
    let text = token.content.toLowerCase()
    return text === "and" || text === "or"
  }
  let previous = {}
  for (let token of tokens) {
    if (token.isOperator && token.token === "=") {
      return `A single equals symbol (=) is not allowed inside a condition. `+
        `If you want to compare if two things are equal, use the double equals sign: ==`
    }
    if (token.type === "variable") {
      if (previous.type === "variable") {
        if (!isKeyword(token) && !isKeyword(previous)) {
          return `Two consecutive words are not allowed, unless one of the words `+
            `is "and" or "or". Variable names should consist of only one word.`
        }
      }
    }
    previous = token
  }
  return ""
}


function checkTypes(tokens, name = "expression") {
  let previousType = false
  let presentLiterals = false
  let presentNumbers = false
  for (let token of tokens) {
    let go = false
    let currentType = false
    if (token.type === "variable") {
      currentType = token.varType
    } else if (token.isStringLiteral) {
      currentType = "string"
      presentLiterals = true
    } else if (token.type === "number") {
      currentType = "number"
      presentNumbers = true
    }
    if (!currentType) continue
    if (previousType && previousType !== currentType) {
      if (presentLiterals || presentNumbers) {
        return `This ${name} mixes different types. In a numeric expression ` +
        `only normal variable names and numbers are allowed. In a text expression, ` +
        `on the other hand, you can only have text variables starting with ` +
        `a $ symbol and so-called literal text strings enclosed between apostrophes: "". `+
        `You seem to be mixing numbers and texts in the same expression, but that's ` + 
        `not allowed unfortunately.`
      }
      return `This ${name} contains both string variables (starting with $) `+
        `and number variables. `+
        `The different variable types should not be mixed in the same ${name}.`
    }
    previousType = currentType
  }
  return ""
}



function doTokenReplacements(tokens) {
  let andOrReplacementHappened = false 
  tokens = tokens.map(token => {
    if (token.type === "variable") {
      if (token.content.toLowerCase() === "and") {
        token.content = "&&"
        andOrReplacementHappened = true
      } else if (token.content.toLowerCase() === "or") {
        token.content = "||"
        andOrReplacementHappened = true
      }
    }
    return token
  })
  return {
    tokens: tokens,
    andOrReplacementHappened,
  }
}

let exp = {
  ifValidatorFunction,
  setCommandValidatorFunction,
  collectVarNames,
  doTokenReplacements,
}

export default exp

