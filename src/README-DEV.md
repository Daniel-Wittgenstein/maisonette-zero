
This is the developer readme, with a couple of quick infos.

The readme seen on Github is one folder above this :)

- Built with React + Redux

- Uses Tailwind

- The final exported stories do NOT include React, nor Redux, nor Tailwind!
  We aim for (reasonably) lean exported stories without framework bloat!

- No server stuff, the whole app is client-side. Unfortunately that doesn't mean
  you can just open a simple index.htm in your web-browser, because React etc.

- Canvas is used to display the story net view. The canvas is not controlled by React
  directly, it gets data from React and then does its own thing.

- Two spaces indentation, not because I love it, but because it's popular.

- The contents of the "autoTemplate" folder are auto-generated, so don't change them
  for your changes will be overwritten.

- For a rundown on how "autoTemplate" gets populated and how the export functionality works,
  see the readme file inside the folder "bruh".

- Start developing with "npm start"

- I hope you have fun! :)
