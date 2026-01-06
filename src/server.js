import express from 'express'
import { static as serveStatic } from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

// Initialize express, socketIO
const app = express()
const server = createServer(app)
const io = new Server(server)

app.use(serveStatic('src/public'))

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

    // Adding a session
    socket.on('session:add', (data) => {
        const session = {
            name: data.name,
            drivers: [],
            status: 'upcoming'
        }
        raceState.sessions.push(session)
        io.emit('sessions:update', raceState.sessions)

        // For debugging
        console.log(raceState)
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected')
    })
})

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`)
})