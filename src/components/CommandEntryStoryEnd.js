



function CommandStoryEnd(props) {


  if (window.DEBUG.log.props) window.DEBUG.doLogProps(props, "CommandStoryEnd")

  return (
    <>
      <div className="flex items-center">
        <div>--- END THE STORY ---</div>
      </div>
    </>
  )
}

export default CommandStoryEnd
 
/*         {props.data.text} -> text of input*/