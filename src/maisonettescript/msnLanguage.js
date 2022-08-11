
const style = {
  pageRest: "comment",
  pageEqualsSymbols: "integer",
  standard: "operator",
  choice: "keyword",
  gather: "keyword",
  command: "atom",
  if: "string",
  goto: "def",
}

function mkMsn(parserConfig) {
  return {

    startState: function() {
      const state = {
        lineStart: false,
      }
      return state
    },

    token: function(stream, state) {
      
      if (state.insidePageHeader) {
        state.insidePageHeader = false
        stream.skipToEnd()
        return style.pageRest 
      }

      if (stream.sol()) {
        state.lineStart = true
      }

      if (state.lineStart) {
        stream.eatSpace()
        state.lineStart = false
        
        if ( stream.match(/\=\=\=/, false) ) {
          stream.next()
          stream.next()
          stream.next()
          state.insidePageHeader = true
          return style.pageEqualsSymbols
        }

        if ( stream.match(/\->/, false) ) {
          stream.skipToEnd()
          return style.goto
        }

        if ( stream.match(/\+/, false) ) {
          stream.skipToEnd()
          return style.choice
        }

        if ( stream.match(/\-/, false) ) {
          stream.skipToEnd()
          return style.gather
        }

        if ( stream.match(/#/, false) ) {
          stream.skipToEnd()
          return style.command
        }

        if ( stream.match(/if\:/, false) ) {
          stream.skipToEnd()
          return style.if
        }

      }


//command # if_: condition. and ???? that's it?

      

      stream.next()
      return style.standard
    },

  }
}

export const msnLanguage = mkMsn({})

