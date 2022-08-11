




To develop the app, you must do (from the top-level directory, in two different terminal
windows):

- npm start

- node ./bruhwatcher.js

Both processes then run in the background and take care of any changes to the app.

While not working on the runtime, you do not need to run bruhwatcher.js (but you still can).

bruhwatcher.js only works on Linux.





----------------

The information below is outdated.

As it stands now, we need to build via bruh
every time we change the runtime or the story css files,
not just if we want to test the export functionality,
but also if we want to test the preview.

----------------


Bruh is a simple command-line program we wrote specifically for this project.

It's written in Go. You can compile the source code for your platform.

Once you got Go installed, just do (from the "bruh" folder):

  $ go build

Bruh takes a text file, reads its contents, and outputs a JS file that can be used to load the raw data
of that text file. The reason for this is, of course, that we cannot just load the contents of a file
using JS.

For help, try:

  $ ./bruh -help

and:

  $ ./bruh -man

(Both give different texts, do read both.)

Architecture:

The folder "runtime" contains the runtime that makes the actual story run. It contains "js" and "css" files.

When play-testing the story, these files are imported into a React component and used there
to run the story. (We can import the CSS files, not just the JS files, thanks to Webpack magic.) 

When we click export, of course, it's different. In that case, the app fetches
the data loaded from the folder "autoTemplate". "autoTemplate" is a folder with auto-generated
contents, so you should NEVER change the files inside it. (Except for the readme file over there.)
That data is then used to create the final HTML file to be exported.

"autoTemplate" is populated by bruh. Bruh takes the files inside the folder "runtime", processes
them and then writes corresponding files into "autoTemplate".

The files inside the "runtime" folder are the single source of truth when it comes to the runtime!
The files inside "autoTemplate" are just auto-build from them.

Since both the app and the final exported story use the exact same "runtime" files, they should
work identically. There could be discrepancies, of course, resulting from the different environment
they run in, i.e. interference with React, global vars messing with things etc.
This is an area that requires careful engineering and above all tests, to make sure everything
works the same on both sides of the equation. But fundamentally, the runtime is only written once,
which is, of course, a much saner approach than writing two different runtimes (one for testing, one for
the final exported product). This, of course, means, that the runtime can NEVER use React features.

The HTML used in the final exported story and inside the React app to display the story
is duplicated, however (it has to be written twice), but it should be kept small (just enough HTML to kick
off the story) and it should be kept identical or at least as similar as possible in both places.

Important: whenever a change is made to the runtime files, that change reflects immediately
inside the play/test feature of the app. You can develop the runtime and immediately see what
your new feature does. (Assuming, of course, that you are running the app correctly via "npm start".)

However the changes ARE NOT immediately reflected inside the EXPORTED file.
The reason for this is that bruh needs to run first (it needs to convert the changed "runtime" files
to "autoTemplate" files, see above.) So, when testing the export functionality and working
on the runtime simultaneously, always make sure to re-run bruh after changes!

Couldn't we set up bruh to just run on EVERY CHANGE making
the previous paragraph redundant? Yes, we could, but we would have to test first
if it impacts performance and we would have to set that up via file watchers
or whatever. So far, we haven't, because rerunning bruh
manually seemed like not that big of a deal (remember: you only need to re-run it
when working on the export functionality, not constantly).

How to run bruh to populate "autoTemplate":

From the main directory, do:

$ ./bruhbuild.sh

Of course, this only works on Linux. There is no build script for other platforms.
But since the script runs only a few very basic commands (just open the script
to see how simple it is), it should be very easy to port.

Note that this only prepares the runtime files so they can be used in the final story export.

It's not the build script for the entire project.

To build the entire project: "npm build"

