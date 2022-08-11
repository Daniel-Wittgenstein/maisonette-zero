

function getId() {
  let dat = + new Date()
  let id = dat + "/" + Math.random()
  return id
}

export default getId

