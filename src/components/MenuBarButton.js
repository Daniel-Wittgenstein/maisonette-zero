

import GenericButton from "./GenericButton.js"



function MenuBarButton(props) {
  return (
    <GenericButton
      title={props.text}
      icon={props.icon}
      text = {props.print || ""}
      onClick={props.action}
    ></GenericButton>
  )
}

export default MenuBarButton



