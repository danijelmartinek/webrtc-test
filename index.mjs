import http from 'http'
import express from 'express'
import { Server } from 'socket.io'

const app = express()
const port = process.env.PORT || 2000
app.use(express.static('./public'))

const server = http.createServer({}, app)
const io = new Server(server)


io.on('connection', socket => {
	socket.on('offer', (offerObj) => {
		socket.broadcast.emit("offer", offerObj);
	})

	socket.on('answer', (answerObj) => {
		socket.broadcast.emit("answer", answerObj);
	})
})

server.listen(port, () => {
	console.log('Server up and running at %s port', port)
})
