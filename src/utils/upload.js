


/*

initiate file upload without messing around with hidden input elements
(gets all auto-handled by this module)

*/



function onChange(evt, fileInput, callbackFunc, errFunc, method) {
  console.log("FTW", fileInput)
  if (!fileInput.files) return
  let file = fileInput.files[0]
  if (!file) return

  let reader = new FileReader()

  reader.onload = function (evt) { //is there a difference between reader.onload and reader.onloadend?
    let content = evt.target.result
    callbackFunc(content, fileInput.files[0].name, fileInput.files[0].size)
    fileInput.value = "" //trick:
    //so if exact same file is selected twice,
    //it will still trigger as change
    document.body.removeChild(fileInput)
  }

  reader.onerror = function (evt) {
    errFunc("Reading file failed.")
  }

  reader[method](file)
  
}


function upload(callbackFunc, errFunc, method = "readAsText") {
  /* The callback function gets called once (if) user finishes selecting file.
  It gets passed:
    - file content
    - file name
    - file size
  Error function gets called if there is an error reading the file.
  If the user just aborts the upload, i.e. closes the file selection
  window, no callback at all is called.
  - method: pass "readAsText" or "readAsDataUrl"
  */  
  let el = document.createElement("input")
  el.style.display = "none"
  el.type = "file"
  //el.innerHTML = `<input style={{display: "none"}} type="file"></input>`
  el.onchange = (event) => {
    onChange(event, el, callbackFunc, errFunc, method)
  }
  document.body.appendChild(el)
  el.click()
}



export default upload