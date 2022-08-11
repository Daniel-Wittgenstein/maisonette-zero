
import AssetEntry from "./AssetEntry.js"

import {useDispatch} from 'react-redux'
import dataSlice from "../reducers/dataSlice"

import { useSelector } from 'react-redux'

import { useRef } from "react"


function AssetsView() {

  const dispatch = useDispatch()
  let state = useSelector(state => state.main)

  const fileInput = useRef(null)

  function clickAddAsset() {
    fileInput.current.click()
  }


  let lst = Object.values(state.assets)
  let assetListEl = lst.map( asset => {
    return (
      <AssetEntry
        key={asset.id}
        self={asset}
        requestDelete={requestDelete}
      >

      </AssetEntry>
    )
  })

  let assetMenu = (
    <div>
      <button className="m-4 border-2 border-gray-200 rounded-md p-2"
        onClick={clickAddAsset}
        >add a new asset</button>
    </div>
  )

  function requestDelete(entry) {
    let id = entry.id
    dispatch( dataSlice.action.deleteAsset(
      {
        id: id,
      })
    )
  }


  function fileInputOnChange(ev) {
    if (!fileInput.current.files) return
    let file =  fileInput.current.files[0]
    if (!file) return

    let reader = new FileReader()

    reader.onload = function (evt) { //is there a difference between reader.onload and reader.onloadend?
      let content = evt.target.result
      loadContent(content, fileInput.current.files[0].name, fileInput.current.files[0].size)
      fileInput.current.value = "" //trick:
      //so if exact same file is selected twice,
      //it will still trigger as change
    }

    reader.onerror = function (evt) {
      alert("Loading failed.")
    }

    reader.readAsDataURL(file)
  }


  function loadContent(content, name, size) {
    let type = ""
    if (content.startsWith("data:audio")) {
      type = "audio"
    } else if (content.startsWith("data:image")) {
      type = "image"
    } else {
      type = "wrong"
    }

    if (type === "wrong") {
      alert("Unknown asset type. Not an image or an audio.")
      return
    }

    dispatch( dataSlice.action.createNewAsset(
      {
        fileTypeInfo: content.split(";")[0].replace("data:", "").replace("/", ": "),
        userName: name,
        data: content,
        type: type,
        size: size,
      })
    )
  }

  return (
    <div className="m-4">

      <p>The file types with best compatibility across different browsers are: JPEG/JPG, GIF and PNG for images,
        and MPEG/MP3 for audio.</p>
      <p>We cannot recommend using other file types, because browser support is limited.
      </p>

      {assetMenu}

      {assetListEl}

      <input style={{display: "none"}} onChange={fileInputOnChange} ref={fileInput} type="file"></input>

    </div>
  )
}


export default AssetsView
