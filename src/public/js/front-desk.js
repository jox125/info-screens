const socket = io()

const addSessionForm = document.getElementById('add-session-form')
const sessionNameInput = document.getElementById('session-name')
const sessionList = document.getElementById('session-list')
const error = document.getElementById('nameError')

let sessions = []

socket.on('connect', () => {
    console.log('Connected to server')

    // Request initial data
    socket.emit('session:request')
})

// Render sessions after updates
socket.on('sessions:update', (data) => {
    sessions = data
    renderSessions()
})

// Listener for creating new session
addSessionForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const name = sessionNameInput.value.trim()

    if(!name) {
        error.textContent = 'Name is required'
        error.style.color = 'red'
        return
    }
    error.textContent = ''
    socket.emit('session:add', ({ name }))
    sessionNameInput.value = ''
})


// Renders the session list
function renderSessions() {
    sessionList.innerHTML = ''
    
    if(sessions.length === 0) {
        sessionList.textContent = 'No sessions yet. Add one to get started.'
        return
    }

    sessions.forEach(session => {
        const item = document.createElement('div')
        item.classList.add = 'session-item'
        item.classList.add = 'list-container'

        const name = document.createElement('h3')
        name.textContent = session.name

        const driverCount = document.createElement('span')
        driverCount.textContent = `${session.drivers.length} drivers`

        item.appendChild(name)
        item.appendChild(driverCount)
        sessionList.appendChild(item)
    })
}

/* TODO
Front Desk/Receptionist
- Display Sessions
- Display drivers in sessions

- Edit/remove sessions
- Add/remove drivers to sessions w/ name

Drivers
- Automatically assign racecar

Input Validation
*/