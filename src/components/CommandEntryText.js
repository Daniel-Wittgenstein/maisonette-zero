
import SmartInput from './SmartInput.js'


function CommandEntryText(props) {

  if (window.DEBUG.log.props) window.DEBUG.doLogProps(props, "CommandEntryText")

  return (
    <>
      <div className="flex items-center">
                
        <SmartInput
            validatorFunc={false}
            label="text:"
            subLabel=""
            type="text"
            simpleMode={false}
            pageId={props.pageId}
            id={props.id}
            syncArray={["data", "text"]}
            syncValue={props.data.text}
            styleOuter={{
              width: "100%",
            }}
            styleInner={{
              width: "100%",
              height: "90px", 
            }}
            trim={true}
            multiLine={true}
            ></SmartInput>

      </div>
    </>
  )
}

export default CommandEntryText
 
/*         {props.data.text} -> text of input*/