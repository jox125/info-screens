import express from 'express'
import 'dotenv/config'
import { static as serveStatic } from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

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
const raceState = {
    sessions: [],
    currentRace: null,
    raceMode: 'safe',   // safe, hazard, danger, finish
    duration: 60000,    // Only 1 min races for now
}

// Connect with client
io.on('connection', (socket) => {
    console.log('Client connected')

    // ---- SESSION MANAGEMENT ----

    // Adding a session
    socket.on('session:add', (data) => {
        const session = {
            id: Date.now(),
            name: data.name,
            drivers: [],
            status: 'upcoming'  // upcoming, in progress, finished
        }

        raceState.sessions.push(session)
        io.emit('sessions:update', raceState.sessions)

        // For debugging
        console.log(raceState)
    })

    // Editing session name
    socket.on('session:edit', (data) => {
        const session = findSession(data.sessionId)
        if(!session) return

        session.name = data.newName
        io.emit('sessions:update', raceState.sessions)
    })

    socket.on('session:remove', (data) => {
        const session = findSession(data.sessionId)
        if(!session) return

        raceState.sessions = raceState.sessions.filter(
            s => s.id !== session.id
        )
        io.emit('sessions:update', raceState.sessions)
    })

    // Adding a driver
    socket.on('driver:add', (data) => {
        const session = findSession(data.sessionId)
        if(!session) return

        const carNum = assignCar(session)
        const isFull = !carNum
        
        if(isFull) {
            console.warn(`Session is full`)
            socket.emit('driver:add:error', { message: 'Session is full' })
            return
        }

        session.drivers.push({
            id: Date.now(),
            name: data.name,
            carNum
        })

        io.emit('sessions:update', raceState.sessions)
    })

    // Editing a driver
    socket.on('driver:edit', (data) => {
        const driver = findDriver(data.sessionId, data.driverId)
        if(!driver) return

        driver.name = data.newName
        io.emit('sessions:update', raceState.sessions)
    })

    // Removing a driver
    socket.on('driver:remove', (data) => {
        const session = findSession(data.sessionId)
        if(!session) return

        const driver = findDriver(data.sessionId, data.driverId)
        if(!driver) return
        
        session.drivers = session.drivers.filter(
            d => d.id !== driver.id
        )
        io.emit('sessions:update', raceState.sessions)
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