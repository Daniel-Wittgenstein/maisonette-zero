
import GenericButton from "./GenericButton.js"

/* 

unfinished.

example:


      <Alert  
        buttons = {[
          {title: "ok", icon: "", text: "OK", onClick: () => {}},
          {title: "cancel", icon: "", text: "cancel", onClick: () => {}},
          
        ]}
      ></Alert>

*/


function Alert(props) {

  let text = "Do you really want to quit?".repeat(100)

  let index = -1
  let buttons = props.buttons.map(
    button => {
      index++
      return (
        <GenericButton
          key={index}
          title={button.text}
          icon={button.icon}
          text={button.text}
          onClick={button.action}
        ></GenericButton>
      )
    }
  )



  return (
    <div style={{
      background: "rgba(0,0,0,0.4)", //overlay
      position: "absolute",
      top: "0px",
      left: "0px",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "900000000",
    }}>
      <div
        style={{
          background: "#fff", //alert window itself
          width: "20vw",
          height: "15vh",
          minWidth: "250px",
          minHeight: "180px",
          overflow: "auto",
          borderRadius: "6px",
          boxShadow: "3px 3px 4px 1px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div>

        </div>
        <div
          style={{
            background: "#ccf", //top window bar
            width: "100%",
            height: "20%",
            overflow: "auto",
            boxShadow: "0px 1px 2px 1px rgba(0, 0, 0, 0.4)",
          }}
        >
        </div>

        <div
          style = {{ //alert window body
            display: "flex",
            height: "80%",
            flexDirection: "column",
            justifyContent: "space-between",

          }}>

          <div
            style = {{ //text
              height: "70%",
              padding: "12px",
              overflowY: "scroll",
            }}>
              {text}
          </div>


          <div
            style = {{ //buttons
              height: "30%", 
              background: "#CCC",
              display: "flex",
              justifyContent: "space-around",
              paddingLeft: "16px",
              paddingRight: "16px",

            }}>
              {buttons}
          </div>

        </div>


      </div>
    </div>

  )

}



export default Alert



