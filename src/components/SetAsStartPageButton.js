

import {useDispatch} from 'react-redux'
import dataSlice from "../reducers/dataSlice"


function SetAsStartPageButton(props) {
  const dispatch = useDispatch()

  function click() {
    dispatch( dataSlice.action.setAsStartingPage(props.pageId) )
  }

  let text = "set as starting page"

  if (props.isStartPage) text = "the story will start at this page ⚑"

  return (
    <button className="m-4 border-2 border-gray-200 rounded-md p-2"
      onClick={click}
      >{text}</button>
  )

}

export default SetAsStartPageButton
