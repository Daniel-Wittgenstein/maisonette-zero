
/*

A generic, clickable button that displays an icon or a text or both.

If both icon and text are used, the text will be displayed to the right of the icon.

props:

  - icon: google material font icon name as string, e.g.: "delete" for trash bin icon;
      empty string for no icon.

  - text: text to display as string
      empty string for no text

  - title: title of button (text to be displayed on hover) as string

  - onClick: function to run when button is clicked

  - width: (optional) css width, as string, like: "40px"
      pass falsey value to auto-set width from contents.
      Normally you don't want to set this.
      An exception is when you have a button that changes content
      where you want to keep the same width no matter the content,
      for aesthetic reasons.

  

*/

function GenericButton(props) {
  let tstyle = { display: "flex", alignItems: "center", justifyContent: "center", }
  if (props.width) {
    tstyle.width = props.width
  }
  return (
      <button
        style={tstyle}
        onClick={props.onClick}
        title={props.title}
        className="
          m-1 border-2 border-gray-200 rounded-md p-1
          bg-white cursor-pointer hover:bg-sky-100
          hover:text-sky-600 hover:border-sky-200"
          >

        <span className="material-symbols-outlined"
        >{props.icon}</span>
        
        {
          props.text
          ?
          <span
          className="ml-1 mr-1">{props.text}</span>
          :
          null
        }

      </button>
  )
}

export default GenericButton




