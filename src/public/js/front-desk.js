const socket = io()

const addSessionForm = document.getElementById('add-session-form')
const sessionNameInput = document.getElementById('session-name')
const sessionList = document.getElementById('session-list')
const addDriverForm = document.getElementById('add-driver-form')
const driverNameInput = document.getElementById('driver-name')
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

// Error message for client if session is full
socket.on('driver:add:error', (data) => {
    driverNameInput.placeholder = data.message
    driverNameInput.classList.add('error')
})

// Listener for creating new session
addSessionForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const sessionName = sessionNameInput.value.trim()

    if(!sessionName) {
        sessionNameInput.placeholder = 'Session name is required'
        sessionNameInput.classList.add('error')
        return
    }
    sessionNameInput.placeholder = 'New session name'
    sessionNameInput.classList.remove('error')
    sessionNameInput.value = ''
    socket.emit('session:add', ({ name: sessionName }))
})

// Listener for toggling driverPanel visibility and removing session
sessionList.addEventListener('click', (e) => {
    const session = e.target
    const sessionItem = session.closest('.session-item')

    if(!sessionItem) return
    if(session.closest('.edit-session-form')) return

    // Remove session
    const isRemoveButton = session.classList.contains('remove-session-button')
    const id = Number(sessionItem.dataset.sessionId)
    
    if(isRemoveButton) {
        removeSession(id)

        // Hide driver panel if session was selected
        if(selectedSessionId === id) {
            selectedSessionId = null
            driverPanel.classList.add('hidden')
        }
        return
    }

    // Toggles edit form
    if(session.classList.contains('edit-session-button')) {
        const editForm = sessionItem.querySelector('.edit-session-form')
        editForm.classList.toggle('hidden')
        return
    }

    selectedSessionId = selectedSessionId === id ? null : id
    driverPanel.classList.toggle('hidden', selectedSessionId === null)

    renderSessions()
    renderDrivers()
})

sessionList.addEventListener('submit', (e) => {
    if(!e.target.classList.contains('edit-session-form')) return
    e.preventDefault()

    const sessionItem = e.target.closest('.session-item')
    const sessionId = sessionItem.dataset.sessionId
    const input = sessionItem.querySelector('.edit-session-name')
    const newName = input.value.trim()

    if(!newName) {
        input.placeholder = 'New name is required'
        input.classList.add('error')
        return
    }
    input.placeholder = 'New session name'
    input.classList.remove('error')

    editSession(sessionId, newName)

    e.target.classList.add('hidden')
})

// Listener for creating new driver
addDriverForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const driverName = driverNameInput.value.trim()

    if(!driverName) {
        driverNameInput.placeholder = 'Driver name is required'
        driverNameInput.classList.add('error')
        return
    }
    driverNameInput.placeholder = 'New driver name'
    driverNameInput.classList.remove('error')
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
    
    // Remove driver
    if(driver.classList.contains('remove-driver-button')) {
        const driverId = driverItem.dataset.id
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
        const emptyMessage = createEmptyMessage('No sessions yet. Add one to get started.')
        emptyMessage.classList.add('empty-message--sessions')

        sessionList.appendChild(emptyMessage)
        driverPanel.classList.add('hidden')
        return
    }

    const statusOrder = ['in progress', 'next', 'upcoming', 'finished']
    const groupedSessions = {
        'in progress': [],
        'next': [],
        'upcoming': [],
        'finished': []
    }

    // Group sessions by status
    sessions.forEach(session => {
        if(groupedSessions[session.status]) {
            groupedSessions[session.status].push(session)
        }
    })

    // Render groups with a status header
    statusOrder.forEach(status => {
        const sessionsInGroup = groupedSessions[status]

        const column = document.createElement('div')
        column.classList.add('session-column')

        const header = document.createElement('h2')
        header.classList.add('session-status-header')
        header.textContent = status.charAt(0).toUpperCase() + status.slice(1)
        column.appendChild(header)

        if(sessionsInGroup.length === 0) {
            const emptyMessage = createEmptyMessage(`No ${status} sessions`)
            column.appendChild(emptyMessage)
        } else {
            sessionsInGroup.forEach(session => {
                const item = createSessionItem(session)
                column.appendChild(item)
            })
        }

        sessionList.appendChild(column)
    })
}

// Render drivers for selected session
function renderDrivers() {
    driverList.innerHTML = ''

    const session = sessions.find(
        s => s.id === selectedSessionId
    )

    if(!session || session.drivers.length === 0) {
        const emptyMessage = createEmptyMessage('No drivers yet. Add one to get started.')
        emptyMessage.classList.add('empty-message--drivers')
        driverList.appendChild(emptyMessage)
        return
    }

    const sortedDrivers = [...session.drivers].sort(
        (a, b) => a.carNum - b.carNum
    )

    sortedDrivers.forEach(driver => {
        const item = createDriverItem(driver)
        driverList.appendChild(item)
    })
}

function editSession(sessionId, newName) {
    socket.emit('session:edit', ({
        sessionId,
        newName
    }))
}

function removeSession(sessionId) {
    socket.emit('session:remove', ({
        sessionId
    }))
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

function createEmptyMessage(message) {
    const emptyMessage = document.createElement('p')
    emptyMessage.classList.add('empty-message')
    emptyMessage.textContent = message

    return emptyMessage
}

function createSessionItem(session) {
    const item = document.createElement("div");
    item.classList.add("session-item");
    item.classList.add("list-container");
    item.dataset.sessionId = session.id;

    if (session.id === selectedSessionId) {
        item.classList.add("selected");
    }

    const header = document.createElement("div");
    header.classList.add("session-header");

    const name = document.createElement("h3");
    name.textContent = `${session.name}`;

    const driverCount = document.createElement("span");
    driverCount.className = "driver-count";
    driverCount.textContent = `${session.drivers.length} drivers`;

    const editButton = document.createElement("button");
    editButton.classList.add("edit-session-button");
    editButton.textContent = "Edit Session";

    const editForm = document.createElement("form");
    editForm.classList.add("edit-session-form", "hidden");

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.classList.add("edit-session-name");
    nameInput.id = session.id;
    nameInput.placeholder = "New session name";

    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.textContent = "Save session";

    const removeButton = document.createElement("button");
    removeButton.classList.add("remove-session-button");
    removeButton.textContent = "Remove Session";

    editForm.appendChild(nameInput);
    editForm.appendChild(saveButton);
    header.appendChild(name);
    header.appendChild(driverCount);
    item.appendChild(header);
    item.appendChild(editButton);
    item.appendChild(removeButton);
    item.appendChild(editForm);

    return item;
}

function createDriverItem(driver) {
    const item = document.createElement("div");
    item.classList.add("driver-item", "list-container");
    item.dataset.id = driver.id;

    const header = document.createElement("div");
    header.classList.add("driver-header");

    const driverName = document.createElement("h3");
    driverName.textContent = driver.name;

    const driverCar = document.createElement("span");
    driverCar.classList.add("driver-car");
    driverCar.textContent = `#${driver.carNum}`;

    const editButton = document.createElement("button");
    editButton.classList.add("edit-driver-button");
    editButton.textContent = "Edit Driver";

    const editForm = document.createElement("form");
    editForm.classList.add("edit-driver-form", "hidden");

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.classList.add("edit-driver-name");
    nameInput.id = driver.id;
    nameInput.placeholder = "New driver name";

    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.textContent = "Save driver";

    const removeButton = document.createElement("button");
    removeButton.classList.add("remove-driver-button");
    removeButton.textContent = "Remove Driver";

    editForm.appendChild(nameInput);
    editForm.appendChild(saveButton);
    header.appendChild(driverName);
    header.appendChild(driverCar);
    item.appendChild(header);
    item.appendChild(editButton);
    item.appendChild(removeButton);
    item.appendChild(editForm);

    return item
}

/* TODO
Front Desk/Receptionist

Styling

Update display when session status changes

Input Validation
- Add authentication w/ access keys
- The driver's name must be unique within each race session.
*/