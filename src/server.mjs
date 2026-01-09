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

    // Adding a driver
    socket.on('driver:add', (data) => {
        const session = raceState.sessions.find(
            s => s.id === Number(data.sessionId)
        )

        if(!session) return

        session.drivers.push({
            id: Date.now(),
            name: data.name
        })

        io.emit('sessions:update', raceState.sessions)
    })

    socket.on('driver:edit', (data) => {
        const session = raceState.sessions.find(
            s => s.id === Number(data.sessionId)
        )

        if(!session) return

        const driver = session.drivers.find(
            d => d.id === Number(data.driverId)
        )

        if(!driver) return

        driver.name = data.newName

        io.emit('sessions:update', raceState.sessions)
    })

    // Removing a driver
    socket.on('driver:remove', (data) => {
        const session = raceState.sessions.find(
            s => s.id === Number(data.sessionId)
        )

        if(!session) return
        
        session.drivers = session.drivers.filter(
            d => d.id !== Number(data.driverId)
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