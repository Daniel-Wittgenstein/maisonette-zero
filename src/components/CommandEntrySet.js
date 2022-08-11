
import SmartInput from "./SmartInput.js"

import ifCondValidator from '../language-processing/ifConditionValidator.js'

const validatorFunc = ifCondValidator.setCommandValidatorFunction

//todo to do: fix syncvalue! check if it's correct
//todo; should id be props.id or props.data.id?=???? check

function CommandEntrySet(props) {
  console.log("CommandEntrySet props", props)
  return (
    <>
      <div className="flex items-center">

        <SmartInput
          validatorFunc={validatorFunc}
          label="change variable:"
          subLabel="Enter an expression, like: x = x + 1"
          type="text"
          simpleMode={false}
          pageId={props.pageId}
          id={props.id}
          syncArray={["data", "content"]}
          syncValue={props.data.content}
          style={{width: "240px"}}
          trim={true}
        ></SmartInput>

      </div>
    </>
  )

}


export default CommandEntrySet