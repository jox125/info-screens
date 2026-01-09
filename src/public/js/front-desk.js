const socket = io()

const addSessionForm = document.getElementById('add-session-form')
const sessionNameInput = document.getElementById('session-name')
const sessionNameError = document.getElementById('session-name-error')
const sessionList = document.getElementById('session-list')
const addDriverForm = document.getElementById('add-driver-form')
const driverNameInput = document.getElementById('driver-name')
const driverNameError = document.getElementById('driver-name-error')
const driverList = document.getElementById('driver-list')
const driverPanel = document.getElementById('driver-panel')

let sessions = []
let selectedSessionId = null

socket.on('connect', () => {
    console.log('Connected to server')

    // Request initial data
    socket.emit('session:request')
})

// Render sessions after updates
socket.on('sessions:update', (data) => {
    sessions = data
    renderSessions()

    if(selectedSessionId) {
        renderDrivers()
    }
})

// Listener for creating new session
addSessionForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const sessionName = sessionNameInput.value.trim()

    if(!sessionName) {
        sessionNameError.textContent = 'Session name is required'
        return
    }
    sessionNameError.textContent = ''
    sessionNameInput.value = ''
    socket.emit('session:add', ({ name: sessionName }))
})

// Listener for toggling driverPanel visibility
sessionList.addEventListener('click', (e) => {
    const item = e.target.closest('.session-item')
    if(!item) return

    const id = Number(item.dataset.sessionId)
    selectedSessionId = selectedSessionId === id ? null : id

    driverPanel.classList.toggle('hidden', selectedSessionId === null)

    renderSessions()
    renderDrivers()
})

// Listener for creating new driver
addDriverForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const driverName = driverNameInput.value.trim()

    if(!driverName) {
        driverNameError.textContent = 'Driver name is required'
        
    }
    driverNameError.textContent = ''
    driverNameInput.value = ''

    socket.emit('driver:add', {
        sessionId: selectedSessionId,
        name: driverName
    })
})

// Listener for toggling edit form and removing driver
driverList.addEventListener('click', (e) => {
    const driver = e.target
    const driverItem = driver.closest('.driver-item')
    const driverId = driverItem.dataset.id
    
    // Remove driver
    if(driver.classList.contains('remove-driver-button')) {
        removeDriver(driverId)
    }
    
    // Toggles edit form
    if(driver.classList.contains('edit-driver-button')) {
        const editForm = driverItem.querySelector('.edit-driver-form')
        editForm.classList.toggle('hidden')
    }
})

// Listener for editing driver
driverList.addEventListener('submit', (e) => {
    if(!e.target.classList.contains('edit-driver-form')) return
    e.preventDefault()

    const driverItem = e.target.closest('.driver-item')
    const driverId = driverItem.dataset.id
    const input = driverItem.querySelector('.edit-driver-name')
    const newName = input.value.trim()

    if(!newName) {
        input.placeholder = 'New name is required'
        input.classList.add('error')
        return
    }
    input.placeholder = 'New driver name'
    input.classList.remove('error')

    editDriver(driverId, newName)

    e.target.classList.add('hidden')
})


// Renders the session list
function renderSessions() {
    sessionList.innerHTML = ''

    if(sessions.length === 0) {
        sessionList.textContent = 'No sessions yet. Add one to get started.'
        driverPanel.classList.add('hidden')
        return
    }


    sessions.forEach(session => {
        const item = document.createElement('div')
        item.classList.add('session-item')
        item.classList.add('list-container')
        item.dataset.sessionId = session.id

        if(session.id === selectedSessionId) {
            item.classList.add('selected')
        }

        const name = document.createElement('h3')
        name.textContent = `${session.name} - ${session.status}`

        const driverCount = document.createElement('span')
        driverCount.textContent = `${session.drivers.length} drivers`

        item.appendChild(name)
        item.appendChild(driverCount)
        sessionList.appendChild(item)
    })
}

// Render drivers for selected session
function renderDrivers() {
    driverList.innerHTML = ''

    const session = sessions.find(
        s => s.id === selectedSessionId
    )

    if(!session || session.drivers.length === 0) {
        driverList.textContent = 'No drivers yet. Add one to get started.'
        return
    }

    session.drivers.forEach(driver => {
        const item = document.createElement('div')
        item.classList.add('driver-item', 'list-container')
        item.dataset.id = driver.id

        const driverName = document.createElement('h3')
        driverName.textContent = driver.name

        const editButton = document.createElement('button')
        editButton.classList.add('edit-driver-button')
        editButton.textContent = 'Edit Driver'

        const editForm = document.createElement('form')
        editForm.classList.add('edit-driver-form', 'hidden')
        editForm.id = `edit-driver-form-${driver.id}`

        const nameInput = document.createElement('input')
        nameInput.type = 'text'
        nameInput.classList.add('edit-driver-name')
        nameInput.placeholder = 'New driver name'

        const saveButton = document.createElement('button')
        saveButton.type = 'submit'
        saveButton.textContent = 'Save driver'

        const removeButton = document.createElement('button')
        removeButton.classList.add('remove-driver-button')
        removeButton.textContent = 'Remove Driver'

        editForm.appendChild(nameInput)
        editForm.appendChild(saveButton)
        item.appendChild(driverName)
        item.appendChild(editButton)
        item.appendChild(removeButton)
        item.appendChild(editForm)
        driverList.appendChild(item)
    })
}

function editDriver(driverId, newName) {
    socket.emit('driver:edit', ({
        sessionId: selectedSessionId,
        driverId,
        newName
    }))
}

function removeDriver(driverId) {
    socket.emit('driver:remove', ({
        sessionId: selectedSessionId,
        driverId
    }))
}

/* TODO
Front Desk/Receptionist

Sessions
- Display sessions and buttons for editing/removing
- Edit/Remove sessions

Drivers
- Display drivers and buttons for editing
- Automatically assign racecar
- Edit drivers in sessions

Input Validation
- Add authentication w/ access keys
- The driver's name must be unique within each race session.
- Max 8 cars in one session
*/