/* eslint-disable no-eval */

/*

Note: since Ink support has been dropped: ignore all references to Ink below.

A simple tokenizer for a minimal common subset of JavaScript / Ink.

Aims for the lowest common denominator, more or less, stuff that works in JS and in Ink.

The indices returned by stringToPrimitiveTokens are currently wrong.
This should not affect functionality, since we don't use them right now, but if we want
better error reporting, it would be good to fix them.
*/

function checkSyntax(code) {
  /* pass code as string. */
  try {
    eval(`() => {${code}}`)
  } catch (e) {
    if (e instanceof SyntaxError) {
      //console.log(e)
      return false
    }
  }
  return true
}


const cyphers = setFromString("0123456789")
function isCypher(char) {
  return cyphers.has(char)
}

const maxTokenLength = 3 //max length for operators

// THE DOT SYMBOL MUST NOT APPEAR IN THE TOKENS ARRAY below!
// It is special, because it is a) not an operator and b) can appear in the middle
// of variable identifiers and numbers.

const tokens = [
  "+", "-", "/", "*", "=", "==", 
  '"', '\\"', 
  "&&", "||", "(", ")", "!",
  "++", "--", "+=", "-=", "/=", "*=",
  "<=", ">=", "<", ">", "!="
]

let tokensSet = new Set(tokens)

//some of these are allowed in JS, but not in Ink, so we forbid them:
const forbiddenTokens = [
  ":", "?", "===", "!==", "%", "^", "'",
  "&", "->", "#", "~", "|",
  "°", "`", "§", "[", "]", "{",
  "}", "@", ";", ",", "<>", "=>", "=<", "<<", ">>",
  "**"
]

let forbiddenTokensSet = new Set(forbiddenTokens)

const allTokens = tokens.concat(forbiddenTokens)

let tokenMap = {}

for (let token of allTokens) {
  if (token.length) {
    let firstChar = token[0]
    if (!tokenMap[firstChar]) tokenMap[firstChar] = []
    tokenMap[firstChar].push(token)
    tokenMap[firstChar].sort( (a, b) => b.length - a.length) 
  }
}


const tokenizationTests = [
  `x = x + 1`,
  `x`,
  `abc`,
  ` abc  `,
  `x = 5 - \\"`,
  `  abc"\\""""""""""""""\\-=++weuweegbn->------==========  `,
  `/////////////////////////`,
  `a = a + vars - x ? x === 3 : ( x === 2 ) -+ 082278.44 % äöü->>>;§`,
  `   f gr t  = % 5$ $saashsa     ----------- 7 +==          **=^*=*+`,
  `\"`,
  `'`,
  `"`,
]


function testTokenization() {
  for (let item of tokenizationTests) {
    testStringToPrimitiveTokens(item)
  }
}


function testStringToPrimitiveTokens(str) {
  let lst = stringToPrimitiveTokens(str)
  let str2 = reverseStringToPrimitiveTokens(lst)
  if (str === str2) {
    console.log(str, "PASSED TEST")
  } else {
    console.log("&&&"+str+"&&&", "->", "&&&"+str2+"&&&") 
    throw new Error (`TEST FAILED.`)
  }
}

function reverseStringToPrimitiveTokens(arr) {
  return arr.map(n => n.token).join("")
}


function stringToPrimitiveTokens(str) {
  /*
  Takes a string and splits
  the string into tokens, preserving whitespace.
  Returns an array of objects of type:
  {token: string, index: integer}

  IMPORTANT: The returned index values are currently broken and should not be used!!
  
  This basically just finds out where there are operators
  and special symbols in the string
  and can correctly identify == vs =
  (i.e.: it does NOT interpret == as two tokens,
  but as a single one), also stuff like -> vs. -
  \" vs. " etc. are interpreted correctly. It doesn't really do a lot more than that.
  
  The resulting array of strings/indices can be reversed
  to recreate the exact same original string and that feature
  can be used to test the correctness of this function quite easily.
  (See test function.)
  */

  //console.log(tokenMap)

  let addedTokens = []

  function addToken(token, index) {
    addedTokens.push({
      token, index
    })
  }

  let lookahead = []

  let currentToken = ""
  let currentTokenStart = 0


  for (let index = 0; index < str.length; index++) {
    let char = str[index]
    for (let d = 1; d < maxTokenLength + 1; d++) {
      lookahead[d] = str.substr(index, d)
    }

    let found = false
    if ( tokenMap[char] ) {
      for (let token of tokenMap[char]) {

        if (lookahead[token.length] === token) {
          //
          addToken(currentToken, currentTokenStart)
          addToken(token, index)
          index += token.length - 1
          found = true
          currentToken = ""
          currentTokenStart = index
          break
        }
      }
      if (found) continue
    }
    currentToken += char
  }

  addToken(currentToken, currentTokenStart)

  return addedTokens

}

function setFromString(str) {
  return new Set(str.split(""))
}

function stringLiteralsTokenize(tokens) {
  /*

  Takes token list returned from stringToPrimitiveTokens.
  Leaves tokens as they are, except for apostrophes,
  where it converts everything in between to a string token.

  Since stringToPrimitiveTokens already handled apostrophe escaping
  via \" that is of no concern here.

  If the apostrophes are not balanced, an object with property
  "error: true" is returned. NO other checks for correctness are performed,
  this function strictly just handles string literals, nothing else.

  The result is basically a list like this:

  0: {token: 'x ', index: 0}
  1: {token: '=', index: 2}
  2: {token: ' y ', index: 2}
  3: {isStringLiteral: true, content: ' \\" sadssadds ', index: 6}
  4: {token: ' ', index: 21}
  5: {token: '===', index: 23}
  6: {token: ' 2', index: 25}
  
  
  */

  function pushString() {
    addedItems.push({
      isStringLiteral: true,
      content: currentString,
      index: currentStringStart,
    })
  }
  let currentString = ""
  let currentStringStart = 0
  const addedItems = []
  let insideString = false
  let index = -1
  for (let token of tokens) {
    index ++
    if (token.token === '"') {
      insideString = !insideString
      if (!insideString) {
        pushString()
        currentString = ""
      } else {
        currentStringStart = token.index
      }
      continue
    }
    if (insideString) {
      currentString += token.token
    } else {
      addedItems.push(token)
    }
  }
  if (insideString) {
    return {
      error: true,
      msg: `Unclosed string. Your probably forgot to close a text with an apostrophe (").`,
    }
  }
  return addedItems
}


function annotateValidOperators(tokens) {
  for (let token of tokens) {
    if (tokensSet.has(token.token)) {
      token.isOperator = true
    }
  }
  return tokens
}


function checkForInvalidOperators(tokens) {
  for (let token of tokens) {
    if (token.isStringLiteral) {
      continue
    }

    let text = token.token

    if (forbiddenTokensSet.has(text)) {
      let addHelp = ""
      if (text.length === 1) {
        let lst = tokenMap[text]
        if (lst) lst = lst.filter(n => n.length !== 1)
        if (lst && lst.length) {
          addHelp = ` Maybe you meant: `
          let i = -1
          for (let item of lst) {
            i++
            addHelp += item
            if (i !== lst.length -1) {
              addHelp += " or "
            }
          }
        }
      }

      let separator = ":"
      if (text === ":") {
        separator = " "
      }

      return {
        error: true,
        msg: `${text}${separator} This token is not allowed inside expressions.${addHelp}`,
        index: token.index
      }
    }
  }
  return tokens
}

function tokensAlphaNumAnnotate(tokens) {

  tokens = tokens.map( token => {
    if (token.type === "word") {
      let text = token.content

      text = text.trim()
    
      let firstChar = text[0]
      let type = false
      if (isCypher(firstChar) || firstChar === ".") {
        type = "number"
      } else {
        type = "variable"
      }
  
      for (let char of text) {
        if (char.trim() === "") {
          //should not happen, just for testing:
          return {
            error: true,
            msg: `${text}: Two consecutive words are not allowed. `+
              `After a variable name, I expect an equals sign or `+
              `an operator or some other symbol, but not another variable name.`
          }
        }
  
        if (type === "number") {
          if (!isCypher(char) && char !== ".") {
            return {
              error: true,
              msg: `${text}: A variable name should not start with a digit or a dot.`,
            }
          }
        }
      }
      token.type = type
    }

    return token
  })
  return tokens
}





function annotateWords(tokens) {
  /*
    until now, tokens that are not operators
    and not string literals, look like this: "abc and def",
    i.e. consecutive words are lumped together in one single token.
    Here we split them by whitespace, i.e. we divide it into
    three tokens: "abc", "and", "def".
  */
  let newTokens = []
  for (let token of tokens) {
    if (token.isStringLiteral || token.isOperator) {
      newTokens.push(token)
      continue
    }
    let text = token.token
    text = text.trim()
    let parts = text.split(/\s/).map(n => n.trim()).filter(n => n)
    for (let part of parts) {
      newTokens.push({
        content: part,
        index: -1,
        type: "word",
      })
    }
  }
  return newTokens
}

function annotateVariableTypes(tokens) {
  tokens = tokens.map ( token => {
    if (token.type === "variable" && token.content.startsWith("$")) {
      token.varType = "string"
    } else {
      token.varType = "number"
    }
    return token
  })
  return tokens
}

function tokenize(str) {
  //first split into primitive tokens (basically find out where operators are):
  let tokens = stringToPrimitiveTokens(str)

  //now find out if / where there are string literals:
  tokens = stringLiteralsTokenize(tokens)
  if (tokens.error) return tokens

  //now let's remove tokens that are just pure whitespace, unless it's a string literal:
  tokens = tokens.filter(t => t.isStringLiteral || t.token.trim() !== "")

  //return error if invalid operators were used:
  tokens = checkForInvalidOperators(tokens)
  if (tokens.error) return tokens

  //add information to the valid operators:
  tokens = annotateValidOperators(tokens)
  if (tokens.error) return tokens

  //now the non-literal string, non-operator tokens need to be split into individual
  //tokens (separating words):
  tokens = annotateWords(tokens)
  if (tokens.error) return tokens

  //now let's find out which tokens are variable names and which are numbers:
  tokens = tokensAlphaNumAnnotate(tokens)
  if (tokens.error) return tokens

  //annotate variable types:
  tokens = annotateVariableTypes(tokens)
  if (tokens.error) return tokens

  //normalize operator tokens to use content property, too:
  tokens.forEach(token => {
    if (token.isOperator) token.content = token.token
  })

  return tokens
}


function tokensToString(tokens) {
  /* 
  takes token array, rejoins it to code string
  */
  return tokens.map(t => {
    if (t.isStringLiteral) return '"' + t.content + '"'
    return t.content
  }).join(" ")
}



const exp = {
  testTokenization,
  tokenize,
  checkSyntax,
  tokensToString,
}

export default exp