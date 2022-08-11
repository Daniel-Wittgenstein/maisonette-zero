

//import { useSelector } from 'react-redux'

//import PageView from "./components/PageView"

import StoryNetView from "./components/StoryNetView"

import NotificationOverlay from "./components/NotificationOverlay"

import { useEffect } from 'react'

import {useDispatch} from 'react-redux'
import dataSlice from "./reducers/dataSlice"

import {useState} from 'react'



function App() {
  //let state = useSelector(state => state.main)
  const dispatch = useDispatch()
  let [finishedLoading, setFinishedLoading] = useState(false)

  useEffect(() => {
    //run on mount:
    let p = localStorage.getItem("std-save")
    if (p) p = JSON.parse(p)
    //console.log("LOADED FROM STORAGE", p)
    if (p) {
      dispatch( dataSlice.action.setAppState(p), [])
    }
    setFinishedLoading(true)
  }, [])

  //console.log("rendering app. state is:")

  let show = null
  
  if (finishedLoading) {
    show = (
      <>
        <StoryNetView></StoryNetView>
        <NotificationOverlay></NotificationOverlay>
      </>
    )
  }


  return (
    <>

      {show}

    </>
    
  )
}

export default App



