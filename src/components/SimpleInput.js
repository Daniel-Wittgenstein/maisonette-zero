




function SimpleInput(props) {
  /* 
    props:
    value, onChange, onBlur, onFocus
    
    styleInner: styles input

    multiLine: false = input / true = textarea

    This should not have extra features.
    It's just a basic building block, a controlled input
    that is so generic it can be used for all kinds of things. 
  */

  let el



  if (props.multiLine) {
    el = (
      <textarea
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        spellCheck={false}
        style={ props.styleInner || {} }
        className="p-1 border-2 border-gray-600 rounded-md"
      ></textarea>
    )
  } else {
    el = (
      <input
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        spellCheck={false}
        style={ props.styleInner || {} }
        className="p-1 border-2 border-gray-600 rounded-md"
      ></input>
    )
  }

  return (
    <>
      {el}  
    </>
  )
}


export default SimpleInput