

let data = `

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  (*§§§INJECT_META*) <!-- do not remove this line --->

  <style>

    /* Your custom css comes after this line: */

    body {
      margin: 0px;
      padding: 0px;
    }

    /* user-1, user-2 and user-3 are custom, user-defined styles for images.
      Whatever CSS you put here will apply to images with the custom style
      user-1, user-2, user-3, respectively:
    */

    .user-1 {
      max-width: 25%; /* Just an example. Change to whatever you want. */
    }

    .user-2 {
      border: 10px solid grey; /* Just an example. Change to whatever you want. */
      border-radius: 20px; 
    }

    .user-3 {
      filter: invert(10%); /* Just an example. Change to whatever you want. */
    }


  </style>

  <style> (*§§§INJECT_STYLE*) /* do NOT remove this line */ </style>

</head>
`

function getHtmlHead() {
 return data
}

export default getHtmlHead