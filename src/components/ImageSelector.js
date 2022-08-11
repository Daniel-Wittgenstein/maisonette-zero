



import { useSelector } from 'react-redux'

import {useState} from "react"

function ImageSelector(props) {

  function select(assetId) {
    setShowSelector(false)
    props.onChange(assetId)
  }

  const [showSelector, setShowSelector] = useState(false)

  function clickChange() {
    setShowSelector(true)
  }

  let state = useSelector(state => state.main)

  let assetListEl

  if (showSelector) {
    let lst = Object.values(state.assets)
    lst = lst.filter(a => a.type === "image")
    if (!lst.length) {
      assetListEl = (<div>No images.</div>)
    } else {
      assetListEl = lst.map( asset => {
        return (
          <div key={asset.id} onClick={() => select(asset.id)}
              className="mr-2 hover:bg-gray-200" style={{border: "1px solid #CCC", padding: "4px", borderRadius: "4px"}}>
            <img alt="" style={{width: "auto", height: "48px"}} src={asset.data}></img>
          </div>
        )
      })
    }
  }

  return (
    <>

      {showSelector ?
        <div className="flex items-center mr-2 ml-2">
          {assetListEl}
        </div>
        :
        <button className="mr-4 ml-4 border-2 border-gray-200 rounded-md p-2"
        onClick={clickChange}
        >change</button>
      }

    </>
  )


}


export default ImageSelector

