const addSessionForm = document.getElementById('add-session-form')
const sessionNameInput = document.getElementById('session-name')
const sessionList = document.getElementById('session-list')

addSessionForm.addEventListener('submit', () => {
    const name = sessionNameInput.value.trim()

    socket.emit('session:add', ({ name }))
    sessionNameInput.value = ''
})