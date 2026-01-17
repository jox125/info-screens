import express from 'express'
import 'dotenv/config'
import { static as serveStatic } from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { raceState } from './testRaceState.js'

// Initialize express, socketIO
const app = express()
const server = createServer(app)
const io = new Server(server)
const __dirname = fileURLToPath(dirname(import.meta.url))

app.use(serveStatic('src/public'))

app.get('/front-desk', (req, res) => {
    res.sendFile(join(__dirname, '/public/front-desk.html'))
})

// Race state (currently in memory)
// const raceState = {
//     sessions: [],
//     currentRace: null,
//     raceMode: 'safe',   // safe, hazard, danger, finish
//     duration: 60000,    // Only 1 min races for now
// }

// Connect with client
io.on('connection', (socket) => {
    console.log('Client connected')

    // ---- SESSION MANAGEMENT ----

    // Adding a session
    socket.on('session:add', (data) => {
        const normalizedName = normalize(data.name)
        if(!normalizedName) {
            return socket.emit('session:error', {
                message: 'Session name is required',
                focus: true
            })
        }

        const session = {
            id: Date.now(),
            name: normalizedName,
            drivers: [],
            status: 'upcoming'  // upcoming, next, in progress, finished
        }

        raceState.sessions.push(session)
        io.emit('sessions:update', raceState.sessions)
        console.log(`[session:add] id=${session.id} name="${session.name}"`)
    })

    // Editing session name
    socket.on('session:edit', (data) => {
        const session = findSession(data.sessionId)
        if(!session) {
            return socket.emit('session:error', { message: 'Session not found' })
        }

        const normalizedName = normalize(data.newName)
        if(!normalizedName) {
            return socket.emit('session:edit:error', {
                sessionId: data.sessionId,
                message: 'Name is required'
            })
        }

        const oldName = session.name
        session.name = normalizedName
        io.emit('sessions:update', raceState.sessions)
        console.log(`[session:edit] id=${session.id} name="${oldName}" -> "${session.name}"`)
    })

    socket.on('session:remove', (data) => {
        const session = findSession(data.sessionId)
        if(!session) {
            return socket.emit('session:error', { message: 'Session not found' })
        }

        raceState.sessions = raceState.sessions.filter(
            s => s.id !== session.id
        )
        io.emit('sessions:update', raceState.sessions)
        console.log(`[session:remove] id=${session.id} name="${session.name}"`)
    })

    // Adding a driver
    socket.on('driver:add', (data) => {
        const normalizedName = normalize(data.name)
        if(!normalizedName) {
            return socket.emit('driver:error', { message: 'Driver name is required' })
        }

        const session = findSession(data.sessionId)
        if(!session) {
            return socket.emit('session:error', { message: 'Session not found' })
        }

        const carNum = assignCar(session)
        const isFull = !carNum
        if(isFull) {
            console.warn(`Session is full`)
            return socket.emit('driver:add:error', { message: 'Session is full' })
        }

        const driver = session.drivers.find(
            d => normalize(d.name, true) === normalize(data.name, true)
        )
        if(driver) {
            console.warn(`[driver:add] session=${session.id} driver="${driver.name}" already exists`)
            return socket.emit('driver:error', { message: `${driver.name} already exists`})
        }
        
        const newDriver = {
            id: Date.now(),
            name: normalizedName,
            carNum
        }
        session.drivers.push(newDriver)

        io.emit('sessions:update', raceState.sessions)
        console.log(`[driver:add] session=${session.id} driver=${newDriver.id} name="${newDriver.name}"`)
    })
    
    // Editing a driver
    socket.on('driver:edit', (data) => {
        const normalizedName = normalize(data.newName)

        if(!normalizedName) {
            return socket.emit('driver:edit:error', {
                sessionId: data.sessionId,
                driverId: data.driverId,
                message: 'Name is required'
            })
        }
        
        const session = findSession(data.sessionId)
        if(!session) {
            return socket.emit('session:error', { message: 'Session not found' })
        }
        
        const driver = findDriver(data.sessionId, data.driverId)
        if(!driver) {
            return socket.emit('driver:error', { message: 'Driver not found' })
        }

        const duplicate = session.drivers.find(
            d => normalize(d.name, true) === normalize(data.newName, true)
        )

        // Check if a driver with the new name already exists
        if(duplicate) {
            console.warn(`[driver:edit] session=${session.id} driver="${duplicate.name}" already exists`)
            return socket.emit('driver:edit:error', { 
                sessionId: data.sessionId,
                driverId: data.driverId,
                message: `${duplicate.name} already exists`
            })
        }

        const oldName = driver.name
        driver.name = normalizedName
        io.emit('sessions:update', raceState.sessions)
        console.log(`[driver:edit] session=${session.id} driver=${driver.id} name="${oldName}" -> "${driver.name}"`)
    })

    // Removing a driver
    socket.on('driver:remove', (data) => {
        const session = findSession(data.sessionId)
        if(!session) {
            return socket.emit('session:error', { message: 'Session not found' })
        }

        const driver = findDriver(data.sessionId, data.driverId)
        if(!driver) {
            return socket.emit('driver:error', { message: 'Driver not found' })
        }
        
        session.drivers = session.drivers.filter(
            d => d.id !== driver.id
        )

        io.emit('sessions:update', raceState.sessions)
        console.log(`[driver:remove] session=${session.id} driver=${driver.id} name="${driver.name}"`)
    })


    // ---- REQUESTS ----

    socket.on('session:request', () => {
        socket.emit('sessions:update', raceState.sessions)
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected')
    })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`)
})


// ---- FUNCTIONS ----

function findSession(sessionId) {
    const session = raceState.sessions.find(
        s => s.id === Number(sessionId)
    )
    
    if(!session) {
        console.warn(`Invalid sessionId recieved: ${sessionId}`)
        return
    }

    return session
}

function findDriver(sessionId, driverId) {
    const session = findSession(sessionId)
    if(!session) return

    const driver = session.drivers.find(
        d => d.id === Number(driverId)
    )

    if(!driver) {
        console.warn(`Invalid driverId recieved: ${driverId} in session: ${sessionId}`)
        return
    }

    return driver
}

function assignCar(session) {
    const assigned = new Set(session.drivers.map(d => d.carNum))
    const maxCars = 8

    for(let num = 1; num <= maxCars; num++) {
        if(!assigned.has(num)) return num
    }
}

function normalize(str, lowerCase = false) {
    str = str.trim()
    return lowerCase ? str.toLowerCase() : str
}