

import { useRef } from "react"


function formatSize(s) {
  //actually KB (1,000 not 1,024), not KiB
  if (s < 1000) return "< 1 KB"
  if (s < 1000 * 1000) {
    return round ( (s / 1000), 0) + " KB"
  }
  return round ((s / (1000 * 1000)), 1) + " MB"
}



function round(n, digits) {
  let factor = Math.pow(10, digits)
  return Math.round(n * factor) / factor
}



function AssetEntry(props) {

  const inputField = useRef(null)

  function handleKeyPress() {

  }

  function handleChange() {

  }

  let src = props.self.data

  let size = formatSize(props.self.size)

  let preview = null

  if (props.self.type === "image") {
    preview = (<img alt="preview" className="m-3" src={src} style={{width: "auto", height: "48px"}}></img>)
  } else if (props.self.type === "audio") {
    preview = (
      <audio controls className="m-3" >
        <source src={src}></source>
      </audio>
    )
  }

  function deleteSelf() {
    props.requestDelete(props.self)
  }


  return (
    <div className="flex items-center m-2">

      Name:&nbsp;
      <input ref={inputField}
        spellCheck={false}
        style={{height: "1.5rem", width: "100px",}}
        className="p-1 border-2 border-gray-600 rounded-md"
        defaultValue={"2"}
        maxLength={48}
        onKeyPress={handleKeyPress}
        onChange={handleChange}>
      </input>


      {preview}

      <div className="mr-4">{props.self.fileTypeInfo}</div>

      <div>size: {size}</div>

      <button onClick={deleteSelf} className="m-4 border-2 border-gray-200 rounded-md p-2"
        >delete</button>
    </div>
  )

}


export default AssetEntry

