const socket = io()

const addSessionForm = document.getElementById('add-session-form')
const sessionNameInput = document.getElementById('session-name')
const sessionList = document.getElementById('session-list')

addSessionForm.addEventListener('submit', () => {
    const name = sessionNameInput.value.trim()

    socket.emit('session:add', ({ name }))
    sessionNameInput.value = ''
})


/*
Front Desk/Receptionist
Display Sessions

Add/edit/remove sessions
Add/remove drivers to sessions w/ name

Drivers
Automatically assign racecar
*/