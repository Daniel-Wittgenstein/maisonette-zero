

/* This just returns the standard English phrases for the exported story.
(Not for the app! There is no app localization so far, nor do
I plan to add that in the near future.)
This returned object is then further used for localization
(meaning that every phrase can be replaced by a custom phrase.)
*/



function loadLocalization() {

  return {
    //menu items:
    restart: `restart`,
    load: `load`,
    save: `save`,
    settings: `settings`,
    about: `about`,
    back: `back<br>⟵`,
    //questions e.a.:
    reallyRestart: `Do you really want to restart the story? All progress will be lost.`,
    reallyLoad: `Do you really want to load an old save-state? All progress will be lost.`,
    confirm: `yes, do it`,
    abort: `no`,
    overrideColors: `use custom color scheme`,
    overrideColorsAdditionalInfo: `(This may not look pretty. Use this setting only if you have `+
      `trouble reading the text.)`,
    fgColor: "text color",
    bgColor: "background color",
    undoTitle: "undo",
    menuTitle: "menu",
    savedOk: "Saved!",
  }

}



export default loadLocalization