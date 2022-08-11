





function isVersionCompatible(requestedVersion, appVersion) {
  //THIS FUNCTION SHOULD BE UPDATED IN CONJUNCTION WITH state.version
  //ON NEW RELEASES.

  /* gets two strings:
    - requestedVersion: the requested version
    - appVersion: the version of the target app (usually the version
      of the app that is currently running, i.e. <<state.version>> is passed)
      returns true if the requested version is compatible with
      the appVersion, otherwise false.
      Older versions NEVER support future versions (that would be hard to ensure),
      so if requestedVersion is higher than appVersion, we want to return false.
      Future versions CAN support older versions or break compatibility.
  */
  if (requestedVersion === "0.1" && appVersion === "0.1") return true
  return false
}


export default isVersionCompatible
